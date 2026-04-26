import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const ownerPassword = await bcrypt.hash('Owner@123456', 12);
  const userPassword = await bcrypt.hash('User@123456', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sejoursenegal.sn' },
    update: {},
    create: {
      email: 'admin@sejoursenegal.sn',
      passwordHash: adminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      isVerified: true,
      isActive: true,
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: 'proprietaire@sejoursenegal.sn' },
    update: {},
    create: {
      email: 'proprietaire@sejoursenegal.sn',
      passwordHash: ownerPassword,
      firstName: 'Moussa',
      lastName: 'Diallo',
      role: 'OWNER',
      isVerified: true,
      phone: '+221770000001',
    },
  });

  await prisma.user.upsert({
    where: { email: 'utilisateur@sejoursenegal.sn' },
    update: {},
    create: {
      email: 'utilisateur@sejoursenegal.sn',
      passwordHash: userPassword,
      firstName: 'Aminata',
      lastName: 'Sow',
      role: 'USER',
      isVerified: true,
      phone: '+221770000002',
    },
  });

  const destinations = [
    { name: 'Dakar', slug: 'dakar', region: 'Dakar', description: 'La capitale vibrante du Sénégal', order: 1 },
    { name: 'Saly', slug: 'saly', region: 'Thiès', description: 'Station balnéaire prisée de la Petite Côte', order: 2 },
    { name: 'Saint-Louis', slug: 'saint-louis', region: 'Saint-Louis', description: 'La ville aux mille couleurs', order: 3 },
    { name: 'Somone', slug: 'somone', region: 'Thiès', description: 'Lagune et plage préservées', order: 4 },
    { name: 'Cap Skirring', slug: 'cap-skirring', region: 'Ziguinchor', description: 'Les plus belles plages de Casamance', order: 5 },
    { name: 'Thiès', slug: 'thies', region: 'Thiès', description: 'Ville des tapisseries et culture', order: 6 },
    { name: 'Ziguinchor', slug: 'ziguinchor', region: 'Ziguinchor', description: 'Porte d\'entrée de la Casamance', order: 7 },
    { name: 'Mbour', slug: 'mbour', region: 'Thiès', description: 'Entre mer et terre, la Petite Côte', order: 8 },
  ];

  for (const dest of destinations) {
    await prisma.destination.upsert({
      where: { slug: dest.slug },
      update: {},
      create: dest,
    });
  }

  const property1 = await prisma.property.upsert({
    where: { slug: 'villa-premium-almadies-dakar-abc123' },
    update: {},
    create: {
      ownerId: owner.id,
      slug: 'villa-premium-almadies-dakar-abc123',
      title: 'Villa Premium aux Almadies',
      description: 'Magnifique villa avec piscine privée dans le quartier résidentiel des Almadies à Dakar. Vue sur mer, accès plage à pied, prestations haut de gamme.',
      type: 'VILLA',
      status: 'PUBLISHED',
      address: 'Route des Almadies, Dakar',
      city: 'Dakar',
      district: 'Almadies',
      latitude: 14.7645,
      longitude: -17.5200,
      maxGuests: 8,
      bedrooms: 4,
      bathrooms: 3,
      pricePerNight: 150000,
      cleaningFee: 25000,
      serviceFee: 15000,
      minNights: 2,
      checkInTime: '15:00',
      checkOutTime: '11:00',
      instantBooking: true,
      isPremium: true,
      isFeatured: true,
      cancellationPolicy: 'MODERATE',
      rules: ['Non-fumeur', 'Pas d\'animaux', 'Pas de soirées'],
      amenities: ['wifi', 'piscine', 'climatisation', 'cuisine', 'parking', 'terrasse', 'barbecue', 'lave-linge'],
      avgRating: 4.8,
      reviewCount: 24,
      publishedAt: new Date(),
    },
  });

  await prisma.property.upsert({
    where: { slug: 'appartement-plateau-dakar-def456' },
    update: {},
    create: {
      ownerId: owner.id,
      slug: 'appartement-plateau-dakar-def456',
      title: 'Appartement moderne au Plateau',
      description: 'Appartement contemporain en plein cœur du Plateau, quartier business et culturel de Dakar. Idéal pour les séjours professionnels ou touristiques.',
      type: 'APARTMENT',
      status: 'PUBLISHED',
      address: 'Avenue Léopold Sédar Senghor, Plateau',
      city: 'Dakar',
      district: 'Plateau',
      latitude: 14.6937,
      longitude: -17.4441,
      maxGuests: 4,
      bedrooms: 2,
      bathrooms: 1,
      pricePerNight: 45000,
      cleaningFee: 10000,
      serviceFee: 5000,
      minNights: 1,
      instantBooking: false,
      cancellationPolicy: 'FLEXIBLE',
      rules: ['Non-fumeur', 'Silence après 22h'],
      amenities: ['wifi', 'climatisation', 'cuisine', 'ascenseur', 'sécurité'],
      avgRating: 4.5,
      reviewCount: 12,
      publishedAt: new Date(),
    },
  });

  await prisma.propertyPhoto.createMany({
    data: [
      { propertyId: property1.id, url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200', isCover: true, caption: 'Vue principale', order: 0 },
      { propertyId: property1.id, url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200', isCover: false, caption: 'Piscine', order: 1 },
      { propertyId: property1.id, url: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=1200', isCover: false, caption: 'Chambre principale', order: 2 },
      { propertyId: property1.id, url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200', isCover: false, caption: 'Cuisine', order: 3 },
    ],
    skipDuplicates: true,
  });

  console.log('Seeding completed!');
  console.log('Admin: admin@sejoursenegal.sn / Admin@123456');
  console.log('Owner: proprietaire@sejoursenegal.sn / Owner@123456');
  console.log('User: utilisateur@sejoursenegal.sn / User@123456');
}

main().catch(console.error).finally(() => prisma.$disconnect());
