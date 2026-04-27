import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { success, error, paginated } from '../utils/response';
import { generateUniqueSlug } from '../utils/slug';
import { logAudit } from '../utils/audit';
import { v4 as uuidv4 } from 'uuid';

export async function listProperties(req: Request, res: Response) {
  const {
    city, type, minPrice, maxPrice, guests, checkIn, checkOut,
    amenities, page = '1', limit = '12', sort = 'createdAt',
  } = req.query as Record<string, string>;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where: Record<string, unknown> = { status: 'PUBLISHED' };

  if (city) where.city = { contains: city, mode: 'insensitive' };
  if (type) where.type = type;
  if (minPrice || maxPrice) {
    where.pricePerNight = {
      ...(minPrice && { gte: parseFloat(minPrice) }),
      ...(maxPrice && { lte: parseFloat(maxPrice) }),
    };
  }
  if (guests) where.maxGuests = { gte: parseInt(guests) };
  if (amenities) where.amenities = { hasEvery: amenities.split(',') };

  if (checkIn && checkOut) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    where.bookings = {
      none: {
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          { checkIn: { lte: checkOutDate }, checkOut: { gte: checkInDate } },
        ],
      },
    };
  }

  const sortMap: Record<string, object> = {
    createdAt: { createdAt: 'desc' },
    priceAsc: { pricePerNight: 'asc' },
    priceDesc: { pricePerNight: 'desc' },
    rating: { avgRating: 'desc' },
  };

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: sortMap[sort] || { createdAt: 'desc' },
      select: {
        id: true, slug: true, title: true, type: true, city: true, district: true,
        pricePerNight: true, cleaningFee: true, maxGuests: true, bedrooms: true,
        bathrooms: true, avgRating: true, reviewCount: true, isPremium: true,
        isFeatured: true, instantBooking: true, amenities: true,
        photos: { where: { isCover: true }, take: 1, select: { url: true } },
        owner: { select: { id: true, firstName: true, lastName: true, avatar: true, isVerified: true } },
      },
    }),
    prisma.property.count({ where }),
  ]);

  return paginated(res, properties, total, parseInt(page), parseInt(limit));
}

export async function getProperty(req: Request, res: Response) {
  const { slug } = req.params;
  const property = await prisma.property.findUnique({
    where: { slug },
    include: {
      photos: { orderBy: { order: 'asc' } },
      owner: { select: { id: true, firstName: true, lastName: true, avatar: true, isVerified: true, createdAt: true } },
      reviews: {
        where: { isPublished: true },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { reviewer: { select: { firstName: true, lastName: true, avatar: true } } },
      },
      availabilities: {
        where: { date: { gte: new Date() } },
        select: { date: true, isBlocked: true, price: true },
      },
    },
  });

  if (!property) return error(res, 'Annonce introuvable', 404);
  if (property.status !== 'PUBLISHED' && req.user?.id !== property.ownerId && req.user?.role !== 'SUPER_ADMIN') {
    return error(res, 'Annonce non disponible', 404);
  }

  return success(res, property);
}

export async function createProperty(req: Request, res: Response) {
  const { title, description, type, address, city, district, latitude, longitude,
    maxGuests, bedrooms, bathrooms, pricePerNight, cleaningFee, serviceFee,
    minNights, maxNights, checkInTime, checkOutTime, instantBooking,
    cancellationPolicy, rules, amenities } = req.body;

  const baseSlug = generateUniqueSlug(title);
  const suffix = uuidv4().slice(0, 6);
  const slug = `${baseSlug}-${suffix}`;

  const property = await prisma.property.create({
    data: {
      ownerId: req.user!.id, slug, title, description, type, address, city,
      district, latitude, longitude, maxGuests, bedrooms, bathrooms,
      pricePerNight, cleaningFee: cleaningFee || 0, serviceFee: serviceFee || 0,
      minNights: minNights || 1, maxNights, checkInTime, checkOutTime,
      instantBooking: instantBooking || false, cancellationPolicy, rules: rules || [],
      amenities: amenities || [], status: 'DRAFT',
    },
  });

  await logAudit({ userId: req.user!.id, action: 'CREATE', entity: 'Property', entityId: property.id, req });
  return success(res, property, 201);
}

export async function updateProperty(req: Request, res: Response) {
  const { id } = req.params;
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) return error(res, 'Annonce introuvable', 404);
  if (property.ownerId !== req.user!.id && req.user!.role !== 'SUPER_ADMIN') {
    return error(res, 'Accès refusé', 403);
  }

  const {
    title, description, type, address, city, district, latitude, longitude,
    maxGuests, bedrooms, bathrooms, pricePerNight, cleaningFee, serviceFee,
    minNights, maxNights, checkInTime, checkOutTime, instantBooking,
    cancellationPolicy, rules, amenities,
  } = req.body;

  const updated = await prisma.property.update({
    where: { id },
    data: {
      title, description, type, address, city, district, latitude, longitude,
      maxGuests, bedrooms, bathrooms, pricePerNight, cleaningFee, serviceFee,
      minNights, maxNights, checkInTime, checkOutTime, instantBooking,
      cancellationPolicy, rules, amenities, updatedAt: new Date(),
    },
  });

  await logAudit({ userId: req.user!.id, action: 'UPDATE', entity: 'Property', entityId: id, req });
  return success(res, updated);
}

export async function submitForReview(req: Request, res: Response) {
  const { id } = req.params;
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) return error(res, 'Annonce introuvable', 404);
  if (property.ownerId !== req.user!.id) return error(res, 'Accès refusé', 403);
  if (property.status !== 'DRAFT') return error(res, 'Annonce déjà soumise ou publiée', 400);

  const photos = await prisma.propertyPhoto.count({ where: { propertyId: id } });
  if (photos < 3) return error(res, 'Minimum 3 photos requises', 400);

  await prisma.property.update({ where: { id }, data: { status: 'PENDING_REVIEW' } });
  return success(res, { message: 'Annonce soumise pour validation.' });
}

export async function deleteProperty(req: Request, res: Response) {
  const { id } = req.params;
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) return error(res, 'Annonce introuvable', 404);
  if (property.ownerId !== req.user!.id && req.user!.role !== 'SUPER_ADMIN') {
    return error(res, 'Accès refusé', 403);
  }

  await prisma.property.update({ where: { id }, data: { status: 'SUSPENDED' } });
  await logAudit({ userId: req.user!.id, action: 'DELETE', entity: 'Property', entityId: id, req });
  return success(res, { message: 'Annonce supprimée.' });
}

export async function getOwnerProperties(req: Request, res: Response) {
  const properties = await prisma.property.findMany({
    where: { ownerId: req.user!.id },
    include: {
      photos: { where: { isCover: true }, take: 1 },
      _count: { select: { bookings: true, reviews: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return success(res, properties);
}

export async function getOwnerStats(req: Request, res: Response) {
  const ownerId = req.user!.id;
  const [totalBookings, confirmedBookings, pendingBookings, totalRevenue, properties] = await Promise.all([
    prisma.booking.count({ where: { property: { ownerId }, status: { not: 'CANCELLED_BY_USER' } } }),
    prisma.booking.count({ where: { property: { ownerId }, status: 'CONFIRMED' } }),
    prisma.booking.count({ where: { property: { ownerId }, status: 'PENDING' } }),
    prisma.payment.aggregate({
      where: { booking: { property: { ownerId } }, status: 'PAID' },
      _sum: { amount: true },
    }),
    prisma.property.count({ where: { ownerId } }),
  ]);

  return success(res, {
    totalBookings,
    confirmedBookings,
    pendingBookings,
    totalRevenue: totalRevenue._sum.amount || 0,
    properties,
  });
}

export async function getOwnerRevenueStats(req: Request, res: Response) {
  const ownerId = req.user!.id;
  const { year = String(new Date().getFullYear()) } = req.query as Record<string, string>;

  const bookings = await prisma.booking.findMany({
    where: {
      property: { ownerId },
      status: { in: ['CONFIRMED', 'COMPLETED'] },
      checkIn: {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      },
    },
    select: { checkIn: true, ownerAmount: true, totalAmount: true, commissionAmount: true, nights: true },
  });

  const monthly = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    label: new Date(2000, i).toLocaleString('fr-FR', { month: 'short' }),
    revenue: 0,
    commissions: 0,
    bookings: 0,
    nights: 0,
  }));

  for (const b of bookings) {
    const m = new Date(b.checkIn).getMonth();
    monthly[m].revenue += b.ownerAmount;
    monthly[m].commissions += b.commissionAmount;
    monthly[m].bookings += 1;
    monthly[m].nights += b.nights;
  }

  return success(res, { year: parseInt(year), monthly });
}

export async function exportOwnerBookingsCSV(req: Request, res: Response) {
  const ownerId = req.user!.id;
  const { status, from, to } = req.query as Record<string, string>;

  const where: Record<string, unknown> = { property: { ownerId } };
  if (status) where.status = status;
  if (from || to) {
    where.checkIn = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };
  }

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { checkIn: 'desc' },
    include: {
      user: { select: { firstName: true, lastName: true, email: true, phone: true } },
      property: { select: { title: true, city: true } },
      payments: { select: { status: true, provider: true, paidAt: true } },
    },
  });

  const header = [
    'ID', 'Statut', 'Voyageur', 'Email', 'Téléphone', 'Logement', 'Ville',
    'Arrivée', 'Départ', 'Nuits', 'Voyageurs', 'Total (XOF)', 'Votre part (XOF)',
    'Commission (XOF)', 'Paiement', 'Fournisseur', 'Payé le',
  ].join(';');

  const rows = bookings.map(b => {
    const payment = b.payments[0];
    return [
      b.id,
      b.status,
      `${b.user.firstName} ${b.user.lastName}`,
      b.user.email,
      b.user.phone || '',
      b.property.title,
      b.property.city,
      new Date(b.checkIn).toLocaleDateString('fr-FR'),
      new Date(b.checkOut).toLocaleDateString('fr-FR'),
      b.nights,
      b.guests,
      b.totalAmount,
      b.ownerAmount,
      b.commissionAmount,
      payment?.status || '',
      payment?.provider || '',
      payment?.paidAt ? new Date(payment.paidAt).toLocaleDateString('fr-FR') : '',
    ].join(';');
  });

  const csv = [header, ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="reservations-${Date.now()}.csv"`);
  res.send('﻿' + csv); // BOM for Excel
}

export async function manageAvailability(req: Request, res: Response) {
  const { propertyId } = req.params;
  const { dates, isBlocked, price } = req.body;

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return error(res, 'Annonce introuvable', 404);
  if (property.ownerId !== req.user!.id) return error(res, 'Accès refusé', 403);

  const upserts = dates.map((date: string) =>
    prisma.availability.upsert({
      where: { propertyId_date: { propertyId, date: new Date(date) } },
      update: { isBlocked, price },
      create: { propertyId, date: new Date(date), isBlocked, price },
    })
  );

  await Promise.all(upserts);
  return success(res, { message: 'Disponibilités mises à jour.' });
}

export async function toggleFavorite(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.user!.id;

  const existing = await prisma.favorite.findUnique({
    where: { userId_propertyId: { userId, propertyId: id } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return success(res, { isFavorite: false });
  } else {
    await prisma.favorite.create({ data: { userId, propertyId: id } });
    return success(res, { isFavorite: true });
  }
}

export async function getFavorites(req: Request, res: Response) {
  const favorites = await prisma.favorite.findMany({
    where: { userId: req.user!.id },
    include: {
      property: {
        select: {
          id: true, slug: true, title: true, city: true, pricePerNight: true,
          avgRating: true, reviewCount: true,
          photos: { where: { isCover: true }, take: 1, select: { url: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return success(res, favorites.map(f => f.property));
}
