# Shyara Invite — Technical Reference Document

> **Master reference for all developers.** Covers architecture, API contracts, database schema,
> authentication flows, deployment, and conventions for both the frontend and backend.

> **March 2026 package rollout note**: live pricing, entitlements, and validity are now governed by the package split documented in `PACKAGE_ENTITLEMENTS_IMPLEMENTATION.md`. If you see older single-price, free-tier, or perpetual-access examples later in this file, treat them as legacy references and prefer the package rollout document.

## Current Package Reference

| Concern | Current state |
|---|---|
| Packages | `package_a`, `package_b` |
| Transaction kinds | `initial_purchase`, `event_management_addon`, `renewal` |
| Package A price | $149 / €169 |
| Package B price | $99 / €119 |
| Package B add-on | $99 / €99 |
| Renewal | $14 / €20 |
| Invite validity | 3 months |
| Invite entitlement fields | `packageCode`, `eventManagementEnabled`, `validUntil` |
| Derived API flags | `canRenew`, `canUpgradeEventManagement` |

Schema changes, migration behavior, gating rules, and debug steps live in `PACKAGE_ENTITLEMENTS_IMPLEMENTATION.md`.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Repository Structure](#2-repository-structure)
3. [Technology Stack](#3-technology-stack)
4. [Environment Variables](#4-environment-variables)
5. [Database Schema](#5-database-schema)
6. [Authentication & Sessions](#6-authentication--sessions)
7. [API Reference — Customer](#7-api-reference--customer)
8. [API Reference — Admin](#8-api-reference--admin)
9. [Frontend Architecture](#9-frontend-architecture)
10. [Template System](#10-template-system)
11. [Payment Flow (Razorpay)](#11-payment-flow-razorpay)
12. [Email Service](#12-email-service)
13. [File Uploads (Cloudinary)](#13-file-uploads-cloudinary)
14. [Development Setup](#14-development-setup)
15. [Scripts Reference](#15-scripts-reference)
16. [Deployment Guide](#16-deployment-guide)
17. [Code Conventions](#17-code-conventions)
18. [Security Notes](#18-security-notes)

---

## 1. Project Overview

**Shyara** is a digital e-invitation SaaS platform served at `invite.shyara.co.in`.
Users create personalised invite pages, share a link, and track RSVPs in real time.

| Concern | Detail |
|---|---|
| Live URL | https://invite.shyara.co.in |
| Admin Portal | https://invite.shyara.co.in/admin |
| Categories | Wedding, Engagement, Birthday, Baby Shower, Corporate, Anniversary |
| Templates | 15 templates (mix of free and premium, ₹199–₹599) |
| Currency | INR via Razorpay |
| Email provider | Resend |
| Image storage | Cloudinary |

---

## 2. Repository Structure

```
Shyara Invite/
├── backend/                        # Node.js + Express API
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema (source of truth)
│   │   └── seed.ts                 # Seed data (templates, categories, promo codes, admin users)
│   ├── src/
│   │   ├── index.ts                # Express entry point, middleware, route mounting
│   │   ├── lib/
│   │   │   ├── env.ts              # Validated environment variables (Zod)
│   │   │   ├── jwt.ts              # Token signing/verification helpers
│   │   │   ├── prisma.ts           # Singleton PrismaClient
│   │   │   └── logger.ts           # Winston logger
│   │   ├── middleware/
│   │   │   ├── auth.ts             # verifyToken (customer JWT)
│   │   │   ├── adminAuth.ts        # verifyAdminToken + requirePermission
│   │   │   ├── validate.ts         # Zod request validation
│   │   │   ├── upload.ts           # Multer config (5 MB limit, images only)
│   │   │   └── errorHandler.ts     # Global Express error handler
│   │   ├── routes/
│   │   │   ├── auth.ts             # /api/auth/*
│   │   │   ├── templates.ts        # /api/templates/*
│   │   │   ├── invites.ts          # /api/invites/*
│   │   │   ├── public.ts           # /api/public/* (no auth)
│   │   │   ├── checkout.ts         # /api/checkout/*
│   │   │   └── admin/
│   │   │       ├── auth.ts         # /api/admin/auth/*
│   │   │       ├── dashboard.ts    # /api/admin/dashboard/*
│   │   │       ├── customers.ts    # /api/admin/customers/*
│   │   │       ├── invites.ts      # /api/admin/invites/*
│   │   │       ├── templates.ts    # /api/admin/templates/*
│   │   │       ├── transactions.ts # /api/admin/transactions/*
│   │   │       ├── categories.ts   # /api/admin/categories/*
│   │   │       ├── promo-codes.ts  # /api/admin/promo-codes/*
│   │   │       ├── announcements.ts# /api/admin/announcements/*
│   │   │       ├── notes.ts        # /api/admin/notes/*
│   │   │       ├── settings.ts     # /api/admin/settings/*
│   │   │       ├── search.ts       # /api/admin/search/*
│   │   │       ├── admins.ts       # /api/admin/admins/*
│   │   │       └── audit-logs.ts   # /api/admin/audit-logs/*
│   │   ├── services/
│   │   │   ├── email.ts            # Resend — all transactional emails
│   │   │   ├── payment.ts          # Razorpay order/verify helpers
│   │   │   ├── storage.ts          # Cloudinary upload helper
│   │   │   └── slug.ts             # Slug validation + availability check
│   │   └── utils/
│   │       └── http.ts             # AppError, asyncHandler, sendSuccess, sendError
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── package.json
│
└── frontend/shareable-moments/     # React 18 SPA
    ├── public/
    │   ├── og-image.svg            # Social preview image (1200×630)
    │   └── sitemap.xml             # SEO sitemap
    ├── src/
    │   ├── main.tsx                # React root
    │   ├── App.tsx                 # Router, providers, lazy-loaded pages
    │   ├── pages/                  # Customer-facing pages (17 pages)
    │   ├── admin/
    │   │   ├── pages/              # Admin portal pages (16 pages)
    │   │   ├── contexts/
    │   │   │   └── AdminAuthContext.tsx
    │   │   ├── services/
    │   │   │   └── api.ts          # Real HTTP client for all admin endpoints
    │   │   └── types.ts            # Admin TypeScript types
    │   ├── components/
    │   │   ├── ui/                 # shadcn/ui primitives
    │   │   ├── InviteForm/         # Multi-step invite creation wizard
    │   │   ├── InviteCover.tsx     # Opening animation gate (5 animations)
    │   │   ├── CookieConsent.tsx   # GDPR cookie banner
    │   │   └── TemplateThumbnail.tsx
    │   ├── contexts/
    │   │   └── AuthContext.tsx     # Customer auth + session persistence
    │   ├── services/
    │   │   └── api.ts              # Real HTTP client — all customer endpoints
    │   ├── templates/              # 15 template renderers + registry
    │   └── types.ts                # Shared TypeScript types
    ├── index.html                  # SEO meta tags, OG image, sitemap link
    ├── vite.config.ts
    └── package.json
```

---

## 3. Technology Stack

### Backend

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 22.x |
| Framework | Express | 4.21 |
| Language | TypeScript | 5.8 |
| ORM | Prisma | 6.3 |
| Database | PostgreSQL | 16 |
| Auth | JSON Web Tokens (`jsonwebtoken`) | 9.0 |
| Password hashing | bcrypt | 5.1 |
| Input validation | Zod | 3.24 |
| Payments | Razorpay SDK | 2.9 |
| Email | Resend SDK | 4.1 |
| Image storage | Cloudinary SDK | 2.5 |
| HTML sanitisation | isomorphic-dompurify | 3.0 |
| HTTP security | Helmet | 8.1 |
| CORS | cors | 2.8 |
| Rate limiting | express-rate-limit | 7.5 |
| File uploads | Multer | 1.4 |
| Logging | Winston + Morgan | 3.17 / 1.10 |
| Dev runner | tsx watch | 4.19 |

### Frontend

| Layer | Technology | Version |
|---|---|---|
| Framework | React | 18.3 |
| Language | TypeScript | 5.8 |
| Build tool | Vite (SWC) | 5.4 |
| Routing | React Router | 6.30 |
| Styling | Tailwind CSS | 3.4 |
| Component library | shadcn/ui (Radix UI) | latest |
| Animation | Framer Motion | 12.34 |
| Server state | TanStack React Query | 5.83 |
| Forms | React Hook Form + Zod | 7.61 / 3.25 |
| Toasts | Sonner | 1.7 |
| Charts (admin) | Recharts | 2.15 |
| Theme | next-themes | 0.3 |
| Dev server port | 8080 | — |

---

## 4. Environment Variables

### Backend `.env`

All variables are validated at startup via Zod. The server will **refuse to start** if any required variable is missing or malformed.

```env
# ── Server ──────────────────────────────────────────────────────
NODE_ENV=development          # development | production | test
PORT=3000
FRONTEND_URL=http://localhost:8080
ADMIN_PORTAL_URL=             # Optional — defaults to FRONTEND_URL

# ── Database ────────────────────────────────────────────────────
DATABASE_URL=postgresql://shyara:shyara_dev@localhost:5432/shyara_invite

# ── JWT ─────────────────────────────────────────────────────────
JWT_SECRET=<min-32-chars>           # Customer access token secret
JWT_EXPIRES_IN=15m                  # Access token lifetime
REFRESH_TOKEN_SECRET=<min-32-chars> # Refresh token secret
REFRESH_TOKEN_EXPIRES_IN=7d
ADMIN_JWT_SECRET=<min-32-chars>     # Admin token secret (separate key)
ADMIN_JWT_EXPIRES_IN=8h

# ── Google OAuth ─────────────────────────────────────────────────
GOOGLE_CLIENT_ID=<google-oauth-client-id>

# ── Razorpay ─────────────────────────────────────────────────────
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=<razorpay-secret>
RAZORPAY_WEBHOOK_SECRET=<webhook-secret>

# ── Cloudinary ───────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=shyara
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>

# ── Email (Resend) ───────────────────────────────────────────────
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@shyara.co.in

# ── Seeding ──────────────────────────────────────────────────────
ADMIN_SEED_PASSWORD=<strong-password>    # Defaults to "admin123" if omitted
SUPPORT_SEED_PASSWORD=<strong-password>  # Defaults to "support123" if omitted

# ── Docker (docker-compose only) ─────────────────────────────────
POSTGRES_USER=shyara
POSTGRES_PASSWORD=<db-password>
POSTGRES_DB=shyara_invite
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:3000    # Backend base URL (no trailing slash)
                                      # In production: https://api.shyara.co.in
```

---

## 5. Database Schema

**Provider:** PostgreSQL 16
**ORM:** Prisma 6
**Schema file:** `backend/prisma/schema.prisma`

### Models

#### `User`
| Column | Type | Notes |
|---|---|---|
| id | String (CUID) | PK |
| name | String | |
| email | String | Unique |
| passwordHash | String? | Null for Google-only accounts |
| googleId | String? | Unique |
| phone | String? | |
| avatarUrl | String? | |
| plan | Enum `UserPlan` | `free` \| `premium` |
| status | Enum `UserStatus` | `active` \| `suspended` |
| emailVerified | Boolean | default `false` |
| unsubscribeToken | String? | Unique CUID — used in email unsubscribe links |
| emailPreferences | Json | `{"rsvpNotifications": true, "weeklyDigest": false, "marketing": true}` |
| createdAt | DateTime | |
| updatedAt | DateTime | |
| lastLoginAt | DateTime? | |

#### `RefreshToken`
| Column | Type | Notes |
|---|---|---|
| id | String (CUID) | PK |
| token | String | SHA-256 hash of raw token. Unique |
| userId | String | FK → User |
| expiresAt | DateTime | 7 days from creation |
| createdAt | DateTime | |

#### `AdminUser`
| Column | Type | Notes |
|---|---|---|
| id | String (CUID) | PK |
| name | String | |
| email | String | Unique |
| passwordHash | String | bcrypt |
| role | Enum `AdminRole` | `admin` \| `support` |
| createdAt | DateTime | |
| lastLoginAt | DateTime? | |

#### `Template`
| Column | Type | Notes |
|---|---|---|
| slug | String | PK (e.g. `royal-gold`) |
| name | String | |
| category | Enum `EventCategory` | |
| tags | String[] | |
| isPremium | Boolean | default `false` |
| price | Int | In paise? No — in rupees as integer (e.g. `499` = ₹499) |
| isVisible | Boolean | default `true` |
| isFeatured | Boolean | default `false` |
| sortOrder | Int | default `0` |
| purchaseCount | Int | default `0` |
| createdAt | DateTime | |
| updatedAt | DateTime | |

#### `UserTemplate` (purchase record)
| Column | Type | Notes |
|---|---|---|
| id | String (CUID) | PK |
| userId | String | FK → User |
| templateSlug | String | FK → Template |
| purchasedAt | DateTime | |
| transactionId | String? | FK → Transaction |

Unique constraint: `(userId, templateSlug)`

#### `Invite`
| Column | Type | Notes |
|---|---|---|
| id | String (CUID) | PK |
| userId | String | FK → User |
| templateSlug | String | FK → Template |
| templateCategory | Enum `EventCategory` | Denormalised for fast filtering |
| slug | String | Unique public URL slug |
| status | Enum `InviteStatus` | `draft` \| `published` \| `expired` \| `taken_down` |
| data | Json | All event-specific fields (eventTitle, eventDate, venue, etc.) |
| viewCount | Int | default `0` — incremented by public view endpoint |
| eventDate | DateTime? | Parsed event date for filtering/expiry |
| expiryDate | DateTime? | Auto-expire date |
| createdAt | DateTime | |
| updatedAt | DateTime | |

Indexes: `userId`, `status`, `templateSlug`

#### `Rsvp`
| Column | Type | Notes |
|---|---|---|
| id | String (CUID) | PK |
| inviteId | String | FK → Invite |
| name | String | Guest name |
| email | String? | Optional |
| response | Enum `RsvpResponse` | `yes` \| `no` \| `maybe` |
| guestCount | Int | default `1`, max `20` |
| message | String? | |
| submittedAt | DateTime | |
| ipAddress | String? | For dedup on anonymous RSVPs |

Indexes: `inviteId`, `email`

#### `Transaction`
| Column | Type | Notes |
|---|---|---|
| id | String (CUID) | PK |
| userId | String | FK → User |
| templateSlug | String | |
| amount | Int | Final amount in ₹ after discount |
| currency | String | default `"INR"` |
| status | Enum `TransactionStatus` | `pending` \| `success` \| `failed` \| `refunded` |
| razorpayOrderId | String? | |
| razorpayPaymentId | String? | |
| promoCode | String? | Code used (if any) |
| discountAmount | Int | default `0` |
| refundedAt | DateTime? | |
| refundReason | String? | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

Indexes: `userId`, `status`, `razorpayOrderId`, `createdAt`

#### `Category`
| Column | Type | Notes |
|---|---|---|
| id | String (CUID) | PK |
| slug | Enum `EventCategory` | Unique |
| name | String | Display name |
| emoji | String | |
| displayOrder | Int | default `0` |
| isVisible | Boolean | default `true` |

#### `PromoCode`
| Column | Type | Notes |
|---|---|---|
| id | String (CUID) | PK |
| code | String | Unique, case-insensitive matched |
| discountType | Enum `DiscountType` | `percentage` \| `flat` |
| discountValue | Int | e.g. `10` = 10% or ₹10 flat |
| isActive | Boolean | default `true` |
| appliesTo | String | `"all"` or a `templateSlug` |
| usageLimit | Int? | Null = unlimited |
| usageCount | Int | default `0` |
| expiresAt | DateTime? | |
| createdAt | DateTime | |

#### `Setting`
Key-value store for platform configuration.

| Column | Type |
|---|---|
| key | String (PK) |
| value | String |
| updatedAt | DateTime |

Default keys seeded: `currency`, `max_gallery_photos`, `max_rsvp_per_invite`, `maintenance_mode`, `allow_google_auth`, `allow_email_auth`

Also used for OTP storage: keys `otp_<email>` and `otp_expiry_<email>` (15-min TTL, cleaned on use).

#### Support Models
- **`Announcement`** — Admin-sent broadcast emails
- **`AdminNote`** — Internal notes on customers/invites
- **`AuditLog`** — Admin action log

### Enums

```
EventCategory:  wedding | engagement | birthday | baby_shower | corporate | anniversary
UserPlan:       free | premium
UserStatus:     active | suspended
AdminRole:      admin | support
InviteStatus:   draft | published | expired | taken_down
RsvpResponse:   yes | no | maybe
TransactionStatus: pending | success | failed | refunded
DiscountType:   percentage | flat
```

---

## 6. Authentication & Sessions

### Customer Auth

**Flow:**
1. Register / Login → returns `{ user, accessToken }`
2. Access token stored in `localStorage` key `shyara_access_token` (15 min expiry)
3. Refresh token set as `httpOnly` cookie `refreshToken` (7 days)
4. On 401, frontend calls `POST /api/auth/refresh` automatically → new access token issued, old token rotated (deleted from DB, new hash inserted)
5. Logout → refresh token deleted from DB, cookie cleared

**Middleware:** `verifyToken` in `src/middleware/auth.ts`
- Reads `Authorization: Bearer <token>`
- Verifies JWT with `JWT_SECRET`
- Loads full `User` from DB, attaches to `req.user`
- Returns 403 if user is suspended

**Session persistence on frontend:**
- `AuthContext` initialises `user` state from cached localStorage user
- On mount, if token exists, calls `GET /api/auth/me` to validate + refresh user data

### Admin Auth

**Flow:**
1. `POST /api/admin/auth/login` → returns `{ token, admin }`
2. Token stored in `sessionStorage` key `shyara_admin_token` (8 hours)
3. Admin user stored in `sessionStorage` key `shyara_admin_user`
4. No refresh token — admin must re-login after 8h
5. Logout → `POST /api/admin/auth/logout` (server-side token blacklist via `jti` claim)

**Admin roles and permissions:**

| Permission | Admin | Support |
|---|---|---|
| View everything | ✓ | ✓ |
| manage_templates | ✓ | ✗ |
| manage_pricing | ✓ | ✗ |
| manage_promo_codes | ✓ | ✗ |
| manage_settings | ✓ | ✗ |
| manage_categories | ✓ | ✗ |
| suspend_customer | ✓ | ✗ |
| delete_customer | ✓ | ✗ |
| refund | ✓ | ✗ |
| manual_unlock | ✓ | ✗ |
| takedown_invite | ✓ | ✗ |
| send_announcement | ✓ | ✓ |

### JWT Keys

| Token | Secret | Expiry | Storage |
|---|---|---|---|
| Customer access | `JWT_SECRET` | 15 min | localStorage |
| Customer refresh | `REFRESH_TOKEN_SECRET` | 7 days | httpOnly cookie |
| Admin access | `ADMIN_JWT_SECRET` | 8 hours | sessionStorage |

> **Important:** Refresh tokens are stored as **SHA-256 hashes** in the `RefreshToken` table.
> The raw token is sent to the client; the hash is what's stored and compared.

---

## 7. API Reference — Customer

**Base URL:** `{BACKEND_URL}/api`
**Standard response shape:**

```json
{ "success": true, "data": <T> }
{ "success": true, "data": <T[]>, "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }
{ "success": false, "error": "Human-readable message" }
```

**Auth header:** `Authorization: Bearer <accessToken>`

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Server health check |

### Auth (`/api/auth`)

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/register` | No | `{name, email, password}` | `{user, accessToken}` + refresh cookie |
| POST | `/login` | No | `{email, password}` | `{user, accessToken}` + refresh cookie |
| POST | `/google` | No | `{idToken}` | `{user, accessToken}` + refresh cookie |
| POST | `/refresh` | Cookie | — | `{accessToken}` |
| POST | `/logout` | No | — | `{message}` + clears cookie |
| GET | `/me` | Yes | — | Full user object |
| PUT | `/me` | Yes | `{name?, phone?}` | Updated user |
| PUT | `/password` | Yes | `{currentPassword, newPassword}` | `{message}` |
| POST | `/forgot-password` | No | `{email}` | `{message}` (always 200) |
| POST | `/reset-password` | No | `{email, otp, newPassword}` | `{message}` |
| DELETE | `/me` | Yes | — | `{message}` — deletes account + all data |

**Rate limits:** Login/Register: 10 req / 15 min · Forgot-password: 3 req / 1 hour

### Templates (`/api/templates`)

| Method | Path | Auth | Query | Response |
|---|---|---|---|---|
| GET | `/` | No | `category?`, `sort?` (`popular`/`price_asc`/`newest`) | `Template[]` |
| GET | `/:slug` | No | — | `Template` |

### Invites (`/api/invites`)

| Method | Path | Auth | Body / Query | Response |
|---|---|---|---|---|
| GET | `/` | Yes | — | `Invite[]` with `rsvpCount` |
| POST | `/` | Yes | `{templateSlug, slug, data}` | `Invite` (201) |
| GET | `/check-slug` | Yes | `?slug=&excludeId=` | `{available: boolean}` |
| POST | `/upload-image` | Yes | `multipart/form-data` field `file` | `{url, publicId}` |
| GET | `/:id` | Yes | — | `Invite` with `rsvpCount` |
| GET | `/:id/rsvps` | Yes | — | `Rsvp[]` |
| PUT | `/:id` | Yes | `{slug?, data?, status?}` | Updated `Invite` |
| DELETE | `/:id` | Yes | — | `{message}` |

**Status values a user can set:** `draft`, `published`, `expired`
(`taken_down` is admin-only)

**Slug rules:** 3–60 chars, lowercase letters, numbers, hyphens only. Must be unique globally.

### Public (`/api/public`) — No Auth

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/invites/:slug` | — | Invite data (404 if draft) |
| POST | `/invites/:slug/rsvp` | `{name, email?, response, guestCount, message?}` | `Rsvp` |
| POST | `/invites/:slug/view` | — | `{ok: true}` — increments viewCount |

**RSVP rate limit:** 5 per IP per slug per hour
**RSVP dedup:** If email provided, updates existing RSVP from same email. If no email, deduplicates by IP within 24h.

### Checkout (`/api/checkout`)

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/validate-promo` | Yes | `{code, templateSlug}` | `{valid, discountType, discountValue, label}` |
| POST | `/create-order` | Yes | `{templateSlug, promoCode?}` | Free: `{free: true, inviteId, transactionId}` · Paid: `{free: false, orderId, amount, currency, keyId, transactionId}` |
| POST | `/verify-payment` | Yes | `{razorpayOrderId, razorpayPaymentId, razorpaySignature}` | `{transactionId, inviteId}` |
| POST | `/webhook` | No (Razorpay sig) | Razorpay event JSON | `{received: true}` |

---

## 8. API Reference — Admin

**Base URL:** `{BACKEND_URL}/api/admin`
**Auth header:** `Authorization: Bearer <adminToken>`
All routes require admin auth unless noted.

### Admin Auth (`/api/admin/auth`)

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/login` | No | `{email, password}` | `{token, admin: {id,name,email,role,lastLoginAt}}` |
| POST | `/logout` | Yes | — | `{message}` |
| GET | `/me` | Yes | — | `{id,name,email,role,createdAt,lastLoginAt}` |

### Dashboard (`/api/admin/dashboard`)

| Method | Path | Response |
|---|---|---|
| GET | `/overview` | `{totalUsers, activeUsers, totalInvites, publishedInvites, totalRsvps, totalRevenue, revenueThisMonth, newUsersThisMonth, premiumUsers}` |
| GET | `/revenue?period=30d` | `{date, amount}[]` — period: `7d` / `30d` / `90d` |
| GET | `/recent-signups` | User array |
| GET | `/recent-transactions` | Transaction array |
| GET | `/top-templates` | Template array |
| GET | `/alerts` | `{failedTransactionsCount, takenDownInvitesCount, suspendedUsersCount}` |

### Customers (`/api/admin/customers`)

| Method | Path | Permission | Body / Query | Response |
|---|---|---|---|---|
| GET | `/` | — | `?search&status&plan&page&limit` | Paginated customers |
| POST | `/` | — | `{name, email, password, plan?}` | Customer (201) |
| GET | `/:id` | — | — | `{user, invites, transactions, stats}` |
| PUT | `/:id` | — | `{name?, email?, phone?, plan?, status?}` | Updated customer |
| DELETE | `/:id` | `delete_customer` | — | `{message}` |
| POST | `/:id/suspend` | `suspend_customer` | `{reason?}` | Updated customer |
| POST | `/:id/unsuspend` | `suspend_customer` | — | Updated customer |
| POST | `/:id/unlock-template` | `manual_unlock` | `{templateSlug, reason}` | UserTemplate |
| GET | `/:id/activity` | — | — | `{notes, timeline}` |

### Invites (`/api/admin/invites`)

| Method | Path | Permission | Body / Query | Response |
|---|---|---|---|---|
| GET | `/` | — | `?search&status&category&page&limit` | Paginated invites |
| GET | `/:id` | — | — | Invite with `rsvpSummary` |
| PUT | `/:id/slug` | — | `{slug}` | Updated invite |
| POST | `/:id/takedown` | `takedown_invite` | `{reason?}` | Updated invite |
| POST | `/:id/republish` | `takedown_invite` | — | Updated invite |
| GET | `/:id/rsvps` | — | — | `{rsvps, stats}` |

### Templates (`/api/admin/templates`)

| Method | Path | Permission | Body | Response |
|---|---|---|---|---|
| GET | `/` | — | — | All templates |
| GET | `/:slug` | — | — | Single template |
| POST | `/` | `manage_templates` | `{slug, name, category, tags?, isPremium, price, isVisible, isFeatured}` | Template (201) |
| PUT | `/:slug` | `manage_templates` | `{name?, isPremium?, price?, isVisible?, isFeatured?, sortOrder?}` | Updated template |
| DELETE | `/:slug` | `manage_templates` | — | `{message}` |

### Transactions (`/api/admin/transactions`)

| Method | Path | Permission | Body / Query |
|---|---|---|---|
| GET | `/` | — | `?status&page&limit` → `{transactions, summary, pagination}` |
| POST | `/:id/refund` | `refund` | `{reason}` |
| GET | `/failed` | — | `?page&limit` — last 30 days |

### Categories (`/api/admin/categories`)

| Method | Path | Permission | Body |
|---|---|---|---|
| GET | `/` | — | — |
| POST | `/` | `manage_categories` | `{slug, name, emoji, displayOrder?, isVisible?}` |
| PUT | `/reorder` | `manage_categories` | `{orderedIds: string[]}` |
| PUT | `/:id` | `manage_categories` | `{name?, emoji?, displayOrder?, isVisible?}` |
| DELETE | `/:id` | `manage_categories` | — |

### Promo Codes (`/api/admin/promo-codes`)

All routes require `manage_promo_codes` permission.

| Method | Path | Body |
|---|---|---|
| GET | `/` | — |
| POST | `/` | `{code, discountType, discountValue, isActive, appliesTo, usageLimit?, expiresAt?}` |
| PUT | `/:id` | Partial of above |
| DELETE | `/:id` | — |

### Announcements (`/api/admin/announcements`)

| Method | Path | Permission | Body |
|---|---|---|---|
| GET | `/` | — | — |
| POST | `/` | `send_announcement` | `{title, content, sentTo: "all" \| "new_30d" \| "active_invites"}` |

### Settings (`/api/admin/settings`)

Both routes require `manage_settings`.

| Method | Path | Body |
|---|---|---|
| GET | `/` | — → `Record<string, string>` |
| PUT | `/` | `Record<string, string \| number \| boolean \| null>` |

### Notes (`/api/admin/notes`)

| Method | Path | Body / Query |
|---|---|---|
| GET | `/` | `?entityId&entityType=customer\|invite` |
| POST | `/` | `{entityId, entityType, note}` |

### Other Admin Routes

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/search?q=` | — | Searches customers, invites, transactions |
| GET | `/admins` | `manage_settings` | List admin users |
| POST | `/admins` | `manage_settings` | `{name, email, password, role}` |
| DELETE | `/admins/:id` | `manage_settings` | — |
| GET | `/audit-logs` | `manage_settings` | `?adminId&entityType&entityId&page&limit` |

---

## 9. Frontend Architecture

### Routing (`src/App.tsx`)

All pages are **lazy-loaded** via `React.lazy()`.

| Path | Component | Auth |
|---|---|---|
| `/` | Home | No |
| `/templates` | Gallery | No |
| `/templates/:slug/preview` | TemplatePreview | No |
| `/pricing` | Pricing | No |
| `/privacy` | Privacy | No |
| `/terms` | Terms | No |
| `/login` | Login | No |
| `/register` | Register | No |
| `/forgot-password` | ForgotPassword | No |
| `/checkout/:slug` | Checkout | Yes (redirects) |
| `/create/:inviteId` | CreateInvite | Yes |
| `/dashboard` | Dashboard | Yes |
| `/dashboard/invites/:inviteId/edit` | EditInvite | Yes |
| `/dashboard/invites/:inviteId/rsvps` | RsvpManagement | Yes |
| `/account` | Account | Yes |
| `/publish-success/:inviteId` | PublishSuccess | Yes |
| `/i/:slug` | LiveInvite | No |
| `/admin/login` | AdminLogin | No |
| `/admin/*` | Admin portal (16 pages) | Admin JWT |

### State Management

| Concern | Solution |
|---|---|
| Server state | TanStack React Query v5 |
| Auth state | `AuthContext` (React context) |
| Admin auth state | `AdminAuthContext` (React context) |
| Local UI state | `useState` / `useReducer` |
| Toasts | Sonner (`useToast` hook) |
| Themes | next-themes |

### API Client (`src/services/api.ts`)

- Built on native `fetch` — no axios
- Token read/written from `localStorage` key `shyara_access_token`
- User cache in `localStorage` key `shyara_user`
- On `401` response: automatically calls `POST /api/auth/refresh` once (deduped with `refreshPromise`)
- Credentials: `include` on all requests (sends httpOnly refresh cookie)
- Path alias: `@/` maps to `src/`

### Admin API Client (`src/admin/services/api.ts`)

- Same pattern as customer client
- Token from `sessionStorage` key `shyara_admin_token`
- No automatic refresh — on auth failure, redirect to `/admin/login`
- Separate base URL: `{VITE_API_URL}/api/admin`

### Cookie Consent (`src/components/CookieConsent.tsx`)

- Shown 1.5s after first visit
- Persists choice in `localStorage` key `shyara_cookie_consent` (`accepted` | `dismissed`)
- Links to `/privacy` page

---

## 10. Template System

### Registry

All 15 templates are registered in `src/templates/registry.ts`.
Each template exports a `TemplateConfig` object:

```typescript
interface TemplateConfig {
  slug: string;
  name: string;
  category: EventCategory;
  tags: string[];
  isPremium: boolean;
  price: number;              // ₹ integer (0 for free)
  thumbnail: string;          // path in /public
  previewImages: string[];
  supportedSections: string[]; // e.g. ['gallery', 'story', 'itinerary']
  fields: FieldConfig[];       // Form field definitions
  dummyData: Record<string, unknown>; // Used for live preview
}
```

### Available Templates

| Slug | Name | Category | Premium | Price |
|---|---|---|---|---|
| royal-gold | Royal Gold | wedding | Yes | ₹499 |
| floral-garden | Floral Garden | wedding | Yes | ₹399 |
| eternal-vows | Eternal Vows | wedding | Yes | ₹449 |
| rustic-charm | Rustic Charm | wedding | Free | ₹0 |
| celestial-dreams | Celestial Dreams | wedding | Yes | ₹499 |
| midnight-bloom | Midnight Bloom | engagement | Yes | ₹349 |
| golden-ring | Golden Ring | engagement | Free | ₹0 |
| rose-garden | Rose Garden | engagement | Yes | ₹299 |
| confetti-burst | Confetti Burst | birthday | Free | ₹0 |
| neon-glow | Neon Glow | birthday | Yes | ₹199 |
| little-star | Little Star | baby_shower | Free | ₹0 |
| sweet-arrival | Sweet Arrival | baby_shower | Yes | ₹249 |
| executive-edge | Executive Edge | corporate | Yes | ₹599 |
| modern-summit | Modern Summit | corporate | Yes | ₹499 |
| timeless-love | Timeless Love | anniversary | Yes | ₹349 |

### Opening Animations (`src/components/InviteCover.tsx`)

The `InviteCover` component renders a full-screen animated cover that guests must interact with before seeing the invite. Five styles:

| Animation | Description |
|---|---|
| `doors` | Two panels split open from center |
| `curtain` | Drape falls and rises |
| `zoom-burst` | Cover scales out while fading |
| `fade-up` | Slides up and fades |
| `slide-left` | Sweeps off to the left |

Each template specifies its animation in `TemplateConfig`. The component uses Framer Motion.

### Invite Form (`src/components/InviteForm/`)

Multi-step wizard:
1. **Event Details** — template-specific fields via `FieldConfig[]`
2. **Photos** — cover image + gallery (if `supportedSections` includes `gallery`)
3. **Slug** — custom URL slug with real-time availability check via `SlugPicker`
4. **Preview & Publish** — live preview before publish

---

## 11. Payment Flow (Razorpay)

### Full Purchase Flow

```
User clicks "Pay ₹XXX"
    ↓
POST /api/checkout/validate-promo   (optional — validates promo code)
    ↓
POST /api/checkout/create-order
    ← { orderId, amount, currency, keyId } or { free: true, inviteId }
    ↓
[If free] → redirect to /create/:inviteId
[If paid] → Load Razorpay JS SDK (checkout.razorpay.com/v1/checkout.js)
    ↓
Open Razorpay modal with orderId + keyId
    ↓ (user pays)
handler({ razorpay_payment_id, razorpay_order_id, razorpay_signature })
    ↓
POST /api/checkout/verify-payment
    ← { transactionId, inviteId }
    ↓
redirect to /create/:inviteId
```

### Webhook (Backup)

Razorpay also sends `payment.captured` and `payment.failed` events to `POST /api/checkout/webhook`.
The webhook verifies HMAC-SHA256 signature using `RAZORPAY_WEBHOOK_SECRET`.
This ensures payment is recorded even if the user closes the browser before `verify-payment` is called.

### Promo Code Logic

- Validation is done **server-side only** — no client-side promo code list
- Atomic usage increment using `updateMany` with usage limit check — prevents race conditions
- `appliesTo: "all"` matches any template; otherwise must match `templateSlug`
- Expired codes checked server-side against `expiresAt`

---

## 12. Email Service

**File:** `backend/src/services/email.ts`
**Provider:** Resend
**From address:** configured via `EMAIL_FROM` env var
**Template style:** Branded HTML with gradient header, responsive layout, `DOMPurify` sanitisation on all dynamic content

### Available Email Functions

| Function | Trigger | Has Unsubscribe Link |
|---|---|---|
| `sendWelcomeEmail(name, email)` | Registration | No |
| `sendPasswordResetOtpEmail(email, otp)` | Forgot password | No |
| `sendRsvpConfirmationEmail(email, details)` | Guest submits RSVP | Yes (if `unsubscribeToken` provided) |
| `sendRsvpNotificationEmail(email, details)` | Host notified of RSVP | Yes (if `unsubscribeToken` provided) |
| `sendInvitePublishedEmail(email, inviteUrl, token?)` | Invite published | Yes |
| `sendAnnouncementEmail(email, title, content, token?)` | Admin broadcast | Yes |
| `sendAnnouncementBulk(recipients, title, content)` | Admin broadcast — batch | Yes (per recipient) |

### Unsubscribe

Unsubscribe links use the format:
`{FRONTEND_URL}/unsubscribe?token={unsubscribeToken}`

The `unsubscribeToken` is a unique CUID stored on the `User` model.
**Note:** The `/unsubscribe` frontend route + backend handler still need to be implemented to process these tokens.

### OTP (Password Reset)

- 6-character alphanumeric OTP generated via `Math.random().toString(36)`
- Hashed with `bcrypt` (rounds 10) and stored in `Setting` table as `otp_<email>`
- Expiry stored as ISO string in `Setting` as `otp_expiry_<email>` (15 min)
- Both entries deleted on successful reset

---

## 13. File Uploads (Cloudinary)

**Middleware:** `src/middleware/upload.ts` — Multer, memory storage, 5 MB limit, image MIME types only
**Endpoint:** `POST /api/invites/upload-image` (multipart/form-data, field name `file`)
**Storage path:** `shyara/{userId}/`
**Response:** `{ url: string, publicId: string }`

Upload used for:
- Invite cover images
- Gallery photos

---

## 14. Development Setup

### Prerequisites

- Node.js 22+
- Docker + Docker Compose (for local PostgreSQL)
- Git

### Quick Start

```bash
# 1. Clone the repo
git clone <repo-url>
cd "Shyara Invite"

# 2. Start the database
cd backend
docker-compose up db -d

# 3. Set up backend
cp .env.example .env      # Fill in all required values
npm install
npx prisma migrate dev    # Runs migrations
npm run db:seed            # Seeds templates, categories, promo codes, admin users
npm run dev                # Starts on http://localhost:3000

# 4. Set up frontend (new terminal)
cd ../frontend/shareable-moments
cp .env.example .env      # Set VITE_API_URL=http://localhost:3000
npm install
npm run dev                # Starts on http://localhost:8080
```

### Seeded Admin Accounts

After running `npm run db:seed`:

| Email | Password | Role |
|---|---|---|
| admin@shyara.co.in | `ADMIN_SEED_PASSWORD` env var | admin |
| support@shyara.co.in | `SUPPORT_SEED_PASSWORD` env var | support |

Default passwords are `admin123` / `support123` if env vars are not set (dev only).

### Database Management

```bash
npx prisma migrate dev              # Create + apply migration
npx prisma migrate deploy           # Apply in production
npx prisma studio                   # Visual DB browser at localhost:5555
npx prisma generate                 # Regenerate client after schema changes
```

---

## 15. Scripts Reference

### Backend (`backend/`)

| Script | Command | Description |
|---|---|---|
| `dev` | `tsx watch src/index.ts` | Dev server with hot reload |
| `build` | `tsc` | Compile to `dist/` |
| `start` | `node dist/index.js` | Production server |
| `db:migrate` | `prisma migrate dev` | Dev migrations |
| `db:migrate:prod` | `prisma migrate deploy` | Prod migrations |
| `db:reset` | `prisma migrate reset` | Drop + recreate DB |
| `db:generate` | `prisma generate` | Regenerate Prisma client |
| `db:seed` | `tsx prisma/seed.ts` | Seed data |
| `db:studio` | `prisma studio` | Visual DB browser |

### Frontend (`frontend/shareable-moments/`)

| Script | Command | Description |
|---|---|---|
| `dev` | `vite` | Dev server on port 8080 |
| `build` | `vite build` | Production build to `dist/` |
| `build:dev` | `vite build --mode development` | Dev build |
| `preview` | `vite preview` | Preview production build |
| `lint` | `eslint .` | Lint all files |
| `test` | `vitest run` | Run tests once |
| `test:watch` | `vitest` | Watch mode tests |

---

## 16. Deployment Guide

### Backend — Recommended Stack

- **Host:** Railway / Render / AWS EC2 / DigitalOcean
- **Database:** Managed PostgreSQL (Supabase / Neon / Railway Postgres)
- **Process:** `npm run build && npm start`
- **Node version:** 22.x

**Production checklist:**
```bash
# 1. Set all environment variables (see Section 4)
# 2. Run migrations
npx prisma migrate deploy
# 3. Seed (first deploy only)
npm run db:seed
# 4. Build and start
npm run build
npm start
```

### Frontend — Recommended Stack

- **Host:** Vercel / Netlify / Cloudflare Pages
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment:** Set `VITE_API_URL` to your backend URL

**SPA routing:** Configure the host to serve `index.html` for all routes (catch-all redirect).

### Docker (Backend)

```bash
# Using docker-compose (sets up both DB + backend)
docker-compose up --build

# Or just the DB for local dev
docker-compose up db -d
```

**docker-compose.yml env vars to set:**
```
POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
```

### Domain Setup

```
invite.shyara.co.in  → Frontend (Vercel/Netlify)
api.shyara.co.in     → Backend (or use /api proxy in Vercel config)
```

Set `FRONTEND_URL=https://invite.shyara.co.in` in backend.
Set `VITE_API_URL=https://api.shyara.co.in` in frontend.

---

## 17. Code Conventions

### Backend

- **Error handling:** All route handlers wrapped in `asyncHandler()`. Throw `new AppError(message, statusCode)` for expected errors.
- **Response helper:** Always use `sendSuccess(res, data, undefined, statusCode)` and `sendError(res, message, statusCode)` from `utils/http.ts`.
- **Validation:** All request inputs validated with Zod via `validate({ body, params, query })` middleware before handler runs.
- **Auth:** Apply `verifyToken` middleware to any route requiring customer auth. Apply `verifyAdminToken` + `requirePermission('...')` for admin routes.
- **Prisma:** Use `prisma.$transaction([...])` for operations that must be atomic.
- **Logging:** Use `logger.info()`, `logger.error()` etc. (Winston) — never `console.log` in production code.

### Frontend

- **Path alias:** Use `@/` for all imports from `src/` (e.g. `@/components/ui/button`).
- **API calls:** Use `api.methodName()` from `src/services/api.ts`. Never call `fetch` directly in components.
- **Admin API calls:** Use `adminApi.methodName()` from `src/admin/services/api.ts`.
- **Forms:** React Hook Form + Zod resolver. Define schema, use `useForm`, pass resolver.
- **Toast notifications:** Import `useToast` from `@/hooks/use-toast`. Use `toast({ title, description, variant })`.
- **Types:** All shared types in `src/types.ts`. Admin-specific types in `src/admin/types.ts`.
- **Lazy loading:** All pages must be lazy-loaded with `lazy(() => import('./pages/PageName'))`.
- **Component naming:** PascalCase for components, camelCase for utilities and hooks.

### API Response Mapping

When the frontend receives backend data, apply normalisation:
- `templateCategory` field: convert `baby_shower` → `baby-shower` using `.replace(/_/g, '-')`
- `status` field on invites: convert `taken_down` → `taken-down`
- `avatarUrl` field: map to `avatar` in frontend `User` type

---

## 18. Security Notes

### Implemented

- **Passwords:** bcrypt, 12 rounds (10 for OTP)
- **Refresh tokens:** Stored as SHA-256 hash, never in plain text
- **Admin tokens:** Separate JWT secret, 8h expiry, `jti` claim for blacklisting on logout
- **CORS:** Null origin blocked. Only `FRONTEND_URL` and `ADMIN_PORTAL_URL` allowed
- **Rate limiting:** Global 300 req/15min, auth 10/15min, OTP 3/hour, RSVP 5/hour/slug
- **Helmet:** Sets secure HTTP headers (CSP, HSTS, etc.)
- **Input validation:** Zod schemas on all request inputs (body, params, query)
- **Webhook verification:** HMAC-SHA256 on Razorpay webhook payloads
- **Payment idempotency:** `updateMany` with status check prevents double-processing
- **Promo atomicity:** Race condition prevented via atomic `updateMany` with count check
- **HTML sanitisation:** DOMPurify on all email content (announcement body + all dynamic fields)
- **File uploads:** MIME-type allowlist, 5 MB size limit, memory buffer (not disk)
- **Graceful shutdown:** SIGTERM/SIGINT handled, 30s force-kill timeout
- **Error details:** Stack traces never sent to clients; only human-readable messages

### Pending / Recommended Before Launch

- [ ] Implement `/unsubscribe?token=` route (frontend + backend) to honour unsubscribe links
- [ ] Add email verification flow (use `emailVerified` field already in schema)
- [ ] Add Content-Security-Policy header tuned to your domains
- [ ] Enable Prisma query logging in production for slow query alerts
- [ ] Set up database backups (daily automated snapshots)
- [ ] Configure Razorpay webhook retry handling + idempotency log
- [ ] Add Sentry or equivalent error tracking
- [ ] Run `npx prisma validate` and `npx prisma format` before every schema change
- [ ] Rotate JWT secrets on first production deployment (don't use dev values)
- [ ] Verify `CORS` list includes all production frontend URLs before go-live
