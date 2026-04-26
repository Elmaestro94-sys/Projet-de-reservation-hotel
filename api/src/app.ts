import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import propertyRoutes from './routes/property.routes';
import bookingRoutes from './routes/booking.routes';
import paymentRoutes from './routes/payment.routes';
import reviewRoutes from './routes/review.routes';
import messageRoutes from './routes/message.routes';
import notificationRoutes from './routes/notification.routes';
import adminRoutes from './routes/admin.routes';
import destinationRoutes from './routes/destination.routes';
import uploadRoutes from './routes/upload.routes';
import promotionRoutes from './routes/promotion.routes';
import { errorHandler } from './middlewares/error.middleware';
import { notFound } from './middlewares/notFound.middleware';
import { swaggerSpec } from './utils/swagger';

const app = express();

app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes. Réessayez dans quelques minutes.' },
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
});

app.use('/api/v1/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'sejour-senegal-api' });
});

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send('User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\nSitemap: /sitemap.xml\n');
});

app.get('/sitemap.xml', async (_req, res) => {
  try {
    const { default: p } = await import('./utils/prisma');
    const [properties, destinations] = await Promise.all([
      p.property.findMany({ where: { status: 'PUBLISHED' }, select: { slug: true, updatedAt: true }, take: 5000 }),
      p.destination.findMany({ where: { isActive: true }, select: { slug: true } }),
    ]);
    const base = process.env.FRONTEND_URL || 'https://sejoursenegal.sn';
    const urls = [
      `<url><loc>${base}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
      `<url><loc>${base}/recherche</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`,
      ...destinations.map(d =>
        `<url><loc>${base}/destinations/${d.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`
      ),
      ...properties.map(p2 =>
        `<url><loc>${base}/logements/${p2.slug}</loc><lastmod>${p2.updatedAt.toISOString().split('T')[0]}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`
      ),
    ];
    res.type('application/xml').send(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`
    );
  } catch {
    res.status(500).send('Error generating sitemap');
  }
});

// Swagger docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'Séjour Sénégal API' }));
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/properties', propertyRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/destinations', destinationRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/promotions', promotionRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
