import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Séjour Sénégal API',
      version: '1.0.0',
      description: 'API REST de la plateforme premium de réservation au Sénégal',
      contact: { name: 'Support', email: 'hello@sejoursenegal.sn' },
    },
    servers: [
      { url: '/api/v1', description: 'Version 1' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ BearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentification et gestion du compte' },
      { name: 'Properties', description: 'Annonces de logements' },
      { name: 'Bookings', description: 'Réservations' },
      { name: 'Payments', description: 'Paiements Stripe & PayTech' },
      { name: 'Reviews', description: 'Avis voyageurs' },
      { name: 'Messages', description: 'Messagerie' },
      { name: 'Notifications', description: 'Notifications' },
      { name: 'Admin', description: 'Back-office administration' },
      { name: 'Destinations', description: 'Destinations Sénégal' },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
