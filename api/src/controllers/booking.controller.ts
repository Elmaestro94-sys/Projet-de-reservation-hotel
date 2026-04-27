import { Request, Response } from 'express';
import { BookingStatus } from '@prisma/client';
import prisma from '../utils/prisma';
import { success, error } from '../utils/response';
import { logAudit } from '../utils/audit';
import { sendBookingConfirmationEmail, sendBookingCancellationEmail } from '../utils/email';
import { notify } from '../utils/notify';

const PLATFORM_COMMISSION = 0.10;

async function calculateBookingPrice(propertyId: string, checkIn: Date, checkOut: Date, guests: number) {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return null;

  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  if (nights < property.minNights) return null;
  if (property.maxNights && nights > property.maxNights) return null;
  if (guests > property.maxGuests) return null;

  const subTotal = property.pricePerNight * nights;
  const serviceFee = property.serviceFee;
  const cleaningFee = property.cleaningFee;
  const totalAmount = subTotal + cleaningFee + serviceFee;
  const commissionAmount = totalAmount * PLATFORM_COMMISSION;
  const ownerAmount = totalAmount - commissionAmount;

  return {
    property,
    nights,
    pricePerNight: property.pricePerNight,
    cleaningFee,
    serviceFee,
    totalAmount,
    commissionAmount,
    ownerAmount,
  };
}

export async function checkAvailability(req: Request, res: Response) {
  const { propertyId, checkIn, checkOut, guests } = req.body;
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  const blocked = await prisma.availability.findFirst({
    where: {
      propertyId,
      isBlocked: true,
      date: { gte: checkInDate, lt: checkOutDate },
    },
  });

  if (blocked) return success(res, { available: false, reason: 'Date bloquée par le propriétaire' });

  const conflicting = await prisma.booking.findFirst({
    where: {
      propertyId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      checkIn: { lt: checkOutDate },
      checkOut: { gt: checkInDate },
    },
  });

  if (conflicting) return success(res, { available: false, reason: 'Dates déjà réservées' });

  const price = await calculateBookingPrice(propertyId, checkInDate, checkOutDate, guests);
  if (!price) return success(res, { available: false, reason: 'Paramètres invalides' });

  return success(res, { available: true, ...price });
}

export async function createBooking(req: Request, res: Response) {
  const { propertyId, checkIn, checkOut, guests, guestNote } = req.body;
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  const price = await calculateBookingPrice(propertyId, checkInDate, checkOutDate, guests);
  if (!price) return error(res, 'Paramètres de réservation invalides', 400);

  const conflicting = await prisma.booking.findFirst({
    where: {
      propertyId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      checkIn: { lt: checkOutDate },
      checkOut: { gt: checkInDate },
    },
  });

  if (conflicting) return error(res, 'Ces dates ne sont plus disponibles', 409);

  const booking = await prisma.booking.create({
    data: {
      userId: req.user!.id,
      propertyId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      nights: price.nights,
      guests,
      pricePerNight: price.pricePerNight,
      cleaningFee: price.cleaningFee,
      serviceFee: price.serviceFee,
      totalAmount: price.totalAmount,
      commissionRate: PLATFORM_COMMISSION,
      commissionAmount: price.commissionAmount,
      ownerAmount: price.ownerAmount,
      guestNote,
      status: price.property.instantBooking ? 'CONFIRMED' : 'PENDING',
    },
    include: { property: { select: { title: true } }, user: { select: { email: true, firstName: true } } },
  });

  await logAudit({ userId: req.user!.id, action: 'BOOKING', entity: 'Booking', entityId: booking.id, req });

  await notify(
    price.property.ownerId,
    'BOOKING_REQUEST',
    'Nouvelle demande de réservation',
    `${booking.user.firstName} a réservé "${booking.property.title}" pour ${price.nights} nuit(s).`,
    { bookingId: booking.id },
  );

  if (price.property.instantBooking) {
    try {
      await sendBookingConfirmationEmail(booking.user.email, {
        id: booking.id,
        propertyTitle: booking.property.title,
        checkIn: checkIn,
        checkOut: checkOut,
        nights: price.nights,
        totalAmount: price.totalAmount,
        currency: 'XOF',
      });
    } catch {
      // email failure must not block response
    }
    await notify(
      req.user!.id,
      'BOOKING_CONFIRMED',
      'Réservation confirmée',
      `Votre réservation pour "${booking.property.title}" est confirmée.`,
      { bookingId: booking.id },
    );
  }

  return success(res, booking, 201);
}

export async function getUserBookings(req: Request, res: Response) {
  const { status } = req.query;
  const bookings = await prisma.booking.findMany({
    where: {
      userId: req.user!.id,
      ...(status && { status: status as BookingStatus }),
    },
    include: {
      property: {
        select: {
          id: true, slug: true, title: true, city: true,
          photos: { where: { isCover: true }, take: 1, select: { url: true } },
        },
      },
      payments: { select: { status: true, provider: true, amount: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return success(res, bookings);
}

export async function getOwnerBookings(req: Request, res: Response) {
  const { status } = req.query;
  const bookings = await prisma.booking.findMany({
    where: {
      property: { ownerId: req.user!.id },
      ...(status && { status: status as BookingStatus }),
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true } },
      property: { select: { id: true, slug: true, title: true } },
      payments: { select: { status: true, amount: true, provider: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return success(res, bookings);
}

export async function getBooking(req: Request, res: Response) {
  const { id } = req.params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      property: { include: { photos: { where: { isCover: true }, take: 1 } } },
      user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
      payments: true,
      review: true,
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
      },
    },
  });

  if (!booking) return error(res, 'Réservation introuvable', 404);

  const isOwner = booking.property.ownerId === req.user!.id;
  const isGuest = booking.userId === req.user!.id;
  const isAdmin = ['SUPER_ADMIN', 'SUPPORT', 'FINANCE'].includes(req.user!.role);
  if (!isOwner && !isGuest && !isAdmin) return error(res, 'Accès refusé', 403);

  return success(res, booking);
}

export async function confirmBooking(req: Request, res: Response) {
  const { id } = req.params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { property: true, user: { select: { email: true } } },
  });

  if (!booking) return error(res, 'Réservation introuvable', 404);
  if (booking.property.ownerId !== req.user!.id) return error(res, 'Accès refusé', 403);
  if (booking.status !== 'PENDING') return error(res, 'Cette réservation ne peut pas être confirmée', 400);

  await prisma.booking.update({
    where: { id },
    data: { status: 'CONFIRMED', confirmedAt: new Date() },
  });

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

  await notify(
    booking.userId,
    'BOOKING_CONFIRMED',
    'Réservation confirmée',
    `Votre réservation pour "${booking.property.title}" a été confirmée par le propriétaire.`,
    { bookingId: id },
  );

  await logAudit({ userId: req.user!.id, action: 'UPDATE', entity: 'Booking', entityId: id, req });
  return success(res, { message: 'Réservation confirmée.' });
}

export async function cancelBooking(req: Request, res: Response) {
  const { id } = req.params;
  const { reason } = req.body;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { property: true, user: { select: { email: true } } },
  });

  if (!booking) return error(res, 'Réservation introuvable', 404);
  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
    return error(res, 'Cette réservation ne peut pas être annulée', 400);
  }

  const isGuest = booking.userId === req.user!.id;
  const isOwner = booking.property.ownerId === req.user!.id;
  const isAdmin = ['SUPER_ADMIN', 'SUPPORT'].includes(req.user!.role);
  if (!isGuest && !isOwner && !isAdmin) return error(res, 'Accès refusé', 403);

  const cancelStatus = isGuest ? 'CANCELLED_BY_USER' : isOwner ? 'CANCELLED_BY_OWNER' : 'CANCELLED_BY_ADMIN';

  await prisma.booking.update({
    where: { id },
    data: { status: cancelStatus, cancellationReason: reason, cancelledAt: new Date() },
  });

  try {
    await sendBookingCancellationEmail(booking.user.email, {
      id: booking.id,
      propertyTitle: booking.property.title,
      reason,
    });
  } catch { /* email failure must not block */ }

  await notify(
    booking.userId,
    'BOOKING_CANCELLED',
    'Réservation annulée',
    `Votre réservation pour "${booking.property.title}" a été annulée.`,
    { bookingId: id, reason },
  );

  await logAudit({ userId: req.user!.id, action: 'UPDATE', entity: 'Booking', entityId: id, req });
  return success(res, { message: 'Réservation annulée.' });
}

export async function createDispute(req: Request, res: Response) {
  const { id } = req.params;
  const { reason } = req.body;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { property: { select: { ownerId: true, title: true } } },
  });

  if (!booking) return error(res, 'Réservation introuvable', 404);
  if (booking.userId !== req.user!.id) return error(res, 'Accès refusé', 403);
  if (!['CONFIRMED', 'COMPLETED'].includes(booking.status)) {
    return error(res, 'Seules les réservations confirmées peuvent faire l\'objet d\'un litige', 400);
  }

  await prisma.booking.update({
    where: { id },
    data: { status: 'DISPUTED', disputedAt: new Date(), ownerNote: reason },
  });

  await notify(
    booking.property.ownerId,
    'SYSTEM',
    'Litige ouvert',
    `Un litige a été ouvert pour la réservation #${id.slice(0, 8)}.`,
    { bookingId: id },
  );

  await logAudit({ userId: req.user!.id, action: 'UPDATE', entity: 'Booking', entityId: id, newValue: { status: 'DISPUTED', reason }, req });
  return success(res, { message: 'Litige ouvert. Notre équipe vous contactera sous 48h.' });
}

export async function resolveDispute(req: Request, res: Response) {
  const { id } = req.params;
  const { resolution, status } = req.body;

  if (!['CONFIRMED', 'CANCELLED_BY_ADMIN', 'COMPLETED'].includes(status)) {
    return error(res, 'Statut de résolution invalide', 400);
  }

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return error(res, 'Réservation introuvable', 404);
  if (booking.status !== 'DISPUTED') return error(res, 'Cette réservation n\'est pas en litige', 400);

  await prisma.booking.update({
    where: { id },
    data: { status, ownerNote: resolution },
  });

  await notify(booking.userId, 'SYSTEM', 'Litige résolu', `Votre litige pour la réservation #${id.slice(0, 8)} a été résolu.`, { bookingId: id });

  await logAudit({ userId: req.user!.id, action: 'UPDATE', entity: 'Booking', entityId: id, newValue: { status, resolution }, req });
  return success(res, { message: 'Litige résolu.' });
}

export async function autoCompleteBookings(_req: Request, res: Response) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(23, 59, 59, 999);

  const result = await prisma.booking.updateMany({
    where: {
      status: 'CONFIRMED',
      checkOut: { lte: yesterday },
    },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });

  return success(res, { message: `${result.count} réservation(s) marquée(s) comme terminée(s).`, count: result.count });
}
