# Shyara Invite Backend

## Tech Stack

- Node.js 20 + TypeScript
- Express.js
- PostgreSQL 16
- Prisma ORM
- JWT auth (user + admin)
- Razorpay payments
- Resend email delivery
- Cloudinary media storage

## Prerequisites

- Node.js `20.x`
- npm `10+`
- PostgreSQL `16.x`

## Local Setup

1. Clone repository and enter backend:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create env file:

```bash
cp .env.example .env
```

4. Configure `.env` values.

5. Generate Prisma client:

```bash
npm run db:generate
```

6. Initialize migrations (first-time project setup):

```bash
npx prisma migrate dev --name init
```

7. (Current schema) apply index/audit updates:

```bash
npx prisma migrate dev --name add_indexes
```

8. Seed data:

```bash
npm run db:seed
```

9. Start development server:

```bash
npm run dev
```

## Docker Setup

1. Ensure Docker is running.
2. Configure `.env` in `backend/`.
3. Start services:

```bash
docker compose up --build
```

4. Backend runs on `http://localhost:3000`.
5. Postgres runs on `localhost:5432`.

## Environment Variables

- `NODE_ENV`: `development | production | test`.
- `PORT`: HTTP port for backend.
- `FRONTEND_URL`: Main frontend origin allowed by CORS.
- `ADMIN_PORTAL_URL`: Admin portal origin allowed by CORS.
- `CUSTOMER_ACQUISITION_LOCK_ENABLED`: When `true`, new customer signup and all purchases are blocked until launch verification is complete.
- `DATABASE_URL`: Postgres connection string for Prisma.
- `JWT_SECRET`: User access token secret (min 32 chars).
- `JWT_EXPIRES_IN`: Access token expiry (default `15m`).
- `REFRESH_TOKEN_SECRET`: Reserved secret value (keep set; refresh tokens are stored as hashed opaque values).
- `REFRESH_TOKEN_EXPIRES_IN`: Refresh expiry config value (default `7d`).
- `ADMIN_JWT_SECRET`: Admin token secret (min 32 chars).
- `ADMIN_JWT_EXPIRES_IN`: Admin token expiry (default `8h`).
- `GOOGLE_CLIENT_ID`: Google OAuth client ID.
- `RAZORPAY_KEY_ID`: Razorpay key ID.
- `RAZORPAY_KEY_SECRET`: Razorpay key secret.
- `RAZORPAY_WEBHOOK_SECRET`: Razorpay webhook signature secret.
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name.
- `CLOUDINARY_API_KEY`: Cloudinary API key.
- `CLOUDINARY_API_SECRET`: Cloudinary API secret.
- `RESEND_API_KEY`: Resend API key.
- `EMAIL_FROM`: Sender email used for outgoing mail.

## NPM Scripts

- `npm run dev`: Run backend in watch mode (`tsx`).
- `npm run build`: Compile TypeScript to `dist/`.
- `npm run start`: Start compiled app.
- `npm run db:generate`: Generate Prisma client.
- `npm run db:migrate`: Run development migrations.
- `npm run db:migrate:prod`: Run production-safe migrations (`prisma migrate deploy`).
- `npm run db:reset`: Reset database and rerun migrations.
- `npm run db:seed`: Seed local/dev data including default admin users and the test user.
- `npm run db:seed:prod`: Seed production-safe baseline data (categories, templates, settings, promo codes) and optionally seed a test user/admins when explicit env flags are set.
- `npm run db:studio`: Open Prisma Studio.

## API Base URL Conventions

- Base: `http://localhost:3000`
- User auth/profile: `/api/auth/*`
- Templates: `/api/templates/*`
- Invite owner routes: `/api/invites/*`
- Public invite + RSVP: `/api/public/*`
- Checkout + webhook: `/api/checkout/*`
- Admin APIs: `/api/admin/*`

## Development Admin Credentials

Seeded defaults:

- `admin@shyara.co.in / admin123`
- `support@shyara.co.in / support123`

Change these immediately outside local development.

## Production Migrations

Use deploy mode in production environments:

```bash
npx prisma migrate deploy
```

For a brand-new production database, bootstrap baseline catalog data with:

```bash
npx prisma migrate deploy
npm run db:seed:prod
```

Optional production-safe seed flags:

- `SEED_TEST_USER=true` with `TEST_USER_PASSWORD` to create the test customer account.
- `SEED_ADMIN_USERS=true` with `ADMIN_SEED_PASSWORD` and `SUPPORT_SEED_PASSWORD` to create admin accounts.

The production Docker image starts with:

```bash
npx prisma migrate deploy && if [ "$RUN_PROD_SEED" = "true" ]; then npm run db:seed:prod; fi && node dist/index.js
```

Set `RUN_PROD_SEED=true` on the first deployment if you want the container to run `npm run db:seed:prod` before starting.

## Add a New Admin User via API

1. Login as an admin and get JWT:

`POST /api/admin/auth/login`

2. Create admin:

`POST /api/admin/admins`

Body:

```json
{
  "name": "Ops Admin",
  "email": "ops@shyara.co.in",
  "password": "StrongPassword123",
  "role": "admin"
}
```

Headers:

- `Authorization: Bearer <admin_token>`

Required permission: `manage_settings` (admin role).
