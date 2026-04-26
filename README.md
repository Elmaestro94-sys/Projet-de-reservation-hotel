# Séjour Sénégal

Plateforme premium de réservation d'hébergements au Sénégal.

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma 5 |
| Base de données | PostgreSQL 16 |
| Auth | JWT (access 15min + refresh 7j) |
| Paiements | Stripe + PayTech |
| State | Zustand + TanStack Query |
| Email | Nodemailer |

## Démarrage rapide

### Prérequis
- Node.js 20+
- PostgreSQL 16 (ou Docker)

### Installation

```bash
# Cloner et installer les dépendances
git clone <repo>
cd Projet-de-reservation-hotel
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditez .env avec vos valeurs

# Initialiser la base de données
npm run db:migrate
npm run db:seed

# Lancer en développement
npm run dev
```

L'API sera disponible sur `http://localhost:3001`
Le frontend sera disponible sur `http://localhost:5173`

### Avec Docker

```bash
cp .env.example .env
# Éditez .env

docker-compose up -d
```

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|---|---|---|
| Super Admin | admin@sejoursenegal.sn | Admin@123456 |
| Propriétaire | proprietaire@sejoursenegal.sn | Owner@123456 |
| Utilisateur | utilisateur@sejoursenegal.sn | User@123456 |

## Structure du projet

```
.
├── api/                    # Backend Node.js/Express
│   ├── prisma/
│   │   ├── schema.prisma   # Schéma de base de données
│   │   └── seed.ts         # Données initiales
│   └── src/
│       ├── controllers/    # Logique métier
│       ├── middlewares/    # Auth, validation, erreurs
│       ├── routes/         # Définition des routes
│       └── utils/          # JWT, email, prisma, audit
├── web/                    # Frontend React
│   └── src/
│       ├── components/     # Composants réutilisables
│       ├── pages/          # Pages (auth, user, owner, admin)
│       ├── services/       # Clients API
│       └── store/          # État global (Zustand)
└── docker-compose.yml
```

## API Endpoints

### Auth
- `POST /api/v1/auth/register` — Inscription
- `POST /api/v1/auth/login` — Connexion
- `POST /api/v1/auth/refresh` — Renouveler le token
- `GET /api/v1/auth/me` — Profil connecté
- `POST /api/v1/auth/forgot-password` — Mot de passe oublié
- `POST /api/v1/auth/reset-password` — Réinitialiser

### Propriétés
- `GET /api/v1/properties` — Liste (avec filtres)
- `GET /api/v1/properties/:slug` — Détail
- `POST /api/v1/properties` — Créer (propriétaire)
- `PUT /api/v1/properties/:id` — Modifier
- `POST /api/v1/properties/:id/submit` — Soumettre pour validation

### Réservations
- `POST /api/v1/bookings/check-availability` — Vérifier disponibilité
- `POST /api/v1/bookings` — Créer une réservation
- `GET /api/v1/bookings/my` — Mes réservations
- `POST /api/v1/bookings/:id/confirm` — Confirmer (propriétaire)
- `POST /api/v1/bookings/:id/cancel` — Annuler

### Paiements
- `POST /api/v1/payments/stripe/create-session` — Session Stripe
- `POST /api/v1/payments/stripe/webhook` — Webhook Stripe
- `POST /api/v1/payments/paytech/create-session` — Session PayTech
- `POST /api/v1/payments/paytech/webhook` — Webhook PayTech

## Sécurité

- Authentification JWT avec refresh token
- Rate limiting sur toutes les routes
- Validation Zod sur toutes les entrées
- Contrôles d'autorisation côté serveur (jamais côté client uniquement)
- Vérification des webhooks Stripe avec signature
- Recalcul des montants côté serveur (jamais confiance au client)
- Journal d'audit pour toutes les actions sensibles
- Helmet pour les headers de sécurité HTTP

## Paiements

### Stripe
1. Créez un compte sur [dashboard.stripe.com](https://dashboard.stripe.com)
2. Récupérez votre clé secrète de test `sk_test_...`
3. Configurez un webhook pointant sur `https://votredomaine.sn/api/v1/payments/stripe/webhook`
4. Récupérez le secret du webhook `whsec_...`

### PayTech
1. Créez un compte sur [paytech.sn](https://paytech.sn)
2. Récupérez votre API_KEY et API_SECRET
3. Configurez l'IPN URL sur `https://votredomaine.sn/api/v1/payments/paytech/webhook`

## Déploiement production

```bash
# Build
npm run build

# Migration production
npm run db:migrate:prod

# Démarrer
node api/dist/index.js
```

Variables d'environnement production obligatoires à changer :
- `JWT_SECRET` — minimum 32 caractères aléatoires
- `JWT_REFRESH_SECRET` — minimum 32 caractères aléatoires
- `DATABASE_URL` — URL PostgreSQL de production
- `STRIPE_SECRET_KEY` — Clé live Stripe (sk_live_...)
- `NODE_ENV=production`
