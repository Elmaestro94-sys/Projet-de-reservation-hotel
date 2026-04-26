import { Request, Response } from 'express';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../utils/prisma';
import { success, error } from '../utils/response';
import { logAudit } from '../utils/audit';
import { sendBookingConfirmationEmail } from '../utils/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-04-10' as Stripe.LatestApiVersion });

export async function createStripeSession(req: Request, res: Response) {
  const { bookingId } = req.body;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { property: true, user: { select: { email: true } } },
  });

  if (!booking) return error(res, 'Réservation introuvable', 404);
  if (booking.userId !== req.user!.id) return error(res, 'Accès refusé', 403);
  if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
    return error(res, 'Paiement non autorisé pour cette réservation', 400);
  }

  const existingPayment = await prisma.payment.findFirst({
    where: { bookingId, status: 'PAID' },
  });
  if (existingPayment) return error(res, 'Cette réservation est déjà payée', 400);

  const idempotencyKey = `stripe-${bookingId}-${uuidv4()}`;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: booking.user.email,
    metadata: { bookingId, userId: req.user!.id, idempotencyKey },
    line_items: [
      {
        price_data: {
          currency: 'xof',
          product_data: {
            name: `Réservation - ${booking.property.title}`,
            description: `${booking.nights} nuit(s) - ${new Date(booking.checkIn).toLocaleDateString('fr-SN')} au ${new Date(booking.checkOut).toLocaleDateString('fr-SN')}`,
          },
          unit_amount: Math.round(booking.totalAmount),
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.WEB_URL}/bookings/${bookingId}?payment=success`,
    cancel_url: `${process.env.WEB_URL}/bookings/${bookingId}?payment=cancelled`,
  });

  await prisma.payment.create({
    data: {
      bookingId,
      userId: req.user!.id,
      ownerId: booking.property.ownerId,
      provider: 'STRIPE',
      providerReference: session.id,
      idempotencyKey,
      amount: booking.totalAmount,
      currency: 'XOF',
      status: 'PENDING',
    },
  });

  return success(res, { url: session.url, sessionId: session.id });
}

export async function stripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch {
    return res.status(400).send('Webhook signature invalide');
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { bookingId, idempotencyKey } = session.metadata || {};

    const payment = await prisma.payment.findUnique({ where: { idempotencyKey: idempotencyKey! } });
    if (!payment || payment.status === 'PAID') {
      return res.json({ received: true });
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { idempotencyKey: idempotencyKey! },
        data: { status: 'PAID', paidAt: new Date(), providerReference: session.payment_intent as string || session.id },
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CONFIRMED', confirmedAt: new Date() },
      });
    });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: true, user: { select: { email: true } } },
    });

    if (booking) {
      try {
        await sendBookingConfirmationEmail(booking.user.email, {
          id: booking.id,
          propertyTitle: booking.property.title,
          checkIn: booking.checkIn.toISOString().split('T')[0],
          checkOut: booking.checkOut.toISOString().split('T')[0],
          nights: booking.nights,
          totalAmount: booking.totalAmount,
          currency: 'XOF',
        });
      } catch { /* email failure must not block */ }
    }

    await logAudit({ action: 'PAYMENT', entity: 'Payment', entityId: payment.id, newValue: { status: 'PAID' } });
  }

  if (event.type === 'checkout.session.expired' || event.type === 'payment_intent.payment_failed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { idempotencyKey } = session.metadata || {};
    if (idempotencyKey) {
      await prisma.payment.updateMany({
        where: { idempotencyKey, status: 'PENDING' },
        data: { status: 'FAILED' },
      });
    }
  }

  return res.json({ received: true });
}

export async function createPayTechSession(req: Request, res: Response) {
  const { bookingId } = req.body;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { property: true, user: { select: { email: true, firstName: true, lastName: true } } },
  });

  if (!booking) return error(res, 'Réservation introuvable', 404);
  if (booking.userId !== req.user!.id) return error(res, 'Accès refusé', 403);

  const existingPayment = await prisma.payment.findFirst({
    where: { bookingId, status: 'PAID' },
  });
  if (existingPayment) return error(res, 'Réservation déjà payée', 400);

  const idempotencyKey = `paytech-${bookingId}-${uuidv4()}`;

  const payTechPayload = {
    item_name: `Réservation ${booking.property.title}`,
    item_price: Math.round(booking.totalAmount),
    currency: 'XOF',
    ref_command: idempotencyKey,
    command_name: `Séjour Sénégal - ${booking.nights} nuit(s)`,
    ipn_url: `${process.env.API_URL}/api/v1/payments/paytech/webhook`,
    success_url: `${process.env.WEB_URL}/bookings/${bookingId}?payment=success`,
    cancel_url: `${process.env.WEB_URL}/bookings/${bookingId}?payment=cancelled`,
    env: process.env.NODE_ENV === 'production' ? 'prod' : 'test',
  };

  const paytechResponse = await fetch('https://paytech.sn/api/payment/request-payment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      API_KEY: process.env.PAYTECH_API_KEY || '',
      API_SECRET: process.env.PAYTECH_API_SECRET || '',
    },
    body: JSON.stringify(payTechPayload),
  });

  const ptData = await paytechResponse.json() as { success: number; redirect_url?: string; token?: string; errors?: string[] };

  if (ptData.success !== 1) {
    return error(res, `Erreur PayTech: ${ptData.errors?.join(', ')}`, 400);
  }

  await prisma.payment.create({
    data: {
      bookingId,
      userId: req.user!.id,
      ownerId: booking.property.ownerId,
      provider: 'PAYTECH',
      providerReference: ptData.token,
      idempotencyKey,
      amount: booking.totalAmount,
      currency: 'XOF',
      status: 'PENDING',
    },
  });

  return success(res, { redirect_url: ptData.redirect_url, token: ptData.token });
}

export async function paytechWebhook(req: Request, res: Response) {
  const { ref_command, type_event } = req.body;

  if (type_event === 'sale_complete') {
    const payment = await prisma.payment.findUnique({ where: { idempotencyKey: ref_command } });
    if (!payment || payment.status === 'PAID') {
      return res.json({ success: true });
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { idempotencyKey: ref_command },
        data: { status: 'PAID', paidAt: new Date() },
      });
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'CONFIRMED', confirmedAt: new Date() },
      });
    });

    await logAudit({ action: 'PAYMENT', entity: 'Payment', entityId: payment.id, newValue: { status: 'PAID' } });
  }

  if (type_event === 'sale_canceled') {
    await prisma.payment.updateMany({
      where: { idempotencyKey: ref_command, status: 'PENDING' },
      data: { status: 'FAILED' },
    });
  }

  return res.json({ success: true });
}

export async function getUserPayments(req: Request, res: Response) {
  const payments = await prisma.payment.findMany({
    where: { userId: req.user!.id },
    include: {
      booking: {
        select: {
          id: true, nights: true, checkIn: true, checkOut: true,
          property: { select: { title: true, city: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return success(res, payments);
}
