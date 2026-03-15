# Package Entitlements Implementation

## Purpose

This document explains the package-split rollout implemented in March 2026 across the frontend, backend, admin surfaces, and database.

Use this file first when debugging:

- incorrect checkout amounts
- Package B add-on availability
- renewals and expiry handling
- missing RSVP/event-management access
- admin visibility for package or validity state

## Business Rules

### Packages

| Package | Initial price USD | Initial price EUR | What customer gets |
|---|---:|---:|---|
| Package A | 149 | 169 | Invite plus all event-management features |
| Package B | 99 | 119 | Invite only at purchase time, with more premium-looking designs |

### Add-on

| Purchase | USD | EUR | Rule |
|---|---:|---:|---|
| Package B event-management add-on | 99 | 99 | Unlocks RSVP and invite-ops features later |

### Validity and renewal

| Rule | Value |
|---|---|
| Invite validity window | 3 months |
| Renewal price USD | 14 |
| Renewal price EUR | 20 |
| Renewal effect | Adds 3 months from the later of `now` or `validUntil` |
| Renewal availability | Current implementation allows renewal after expiry |

### Feature gating

- Package A starts with event management enabled.
- Package B starts with event management disabled.
- Package B can unlock event management through the add-on purchase only.
- Expired invites are visible in dashboard and admin, but public access, RSVP, editor mutations, and invite-ops actions are blocked until renewal.
- Buying the Package B add-on does not change validity.
- Renewal does not automatically buy the add-on.

## Template Mapping

| Template slug | Package | Notes |
|---|---|---|
| `rustic-charm` | Package A | Less premium design direction, full feature set |
| `rustic-signature` | Package B | More premium-looking rustic/editorial variant, invite-first |

## Source of Truth

### Template level

Templates decide which package the customer is buying.

Fields:

- `Template.packageCode`
- `Template.priceUsd`
- `Template.priceEur`

### Invite level

Invites are the entitlement source of truth after purchase.

Fields:

- `Invite.packageCode`
- `Invite.eventManagementEnabled`
- `Invite.validUntil`

Derived API flags:

- `canRenew`
- `canUpgradeEventManagement`

### Transaction level

Transactions track how the invite entitlement changed.

Fields:

- `Transaction.packageCode`
- `Transaction.kind`
- `Transaction.inviteId`

Kinds:

- `initial_purchase`
- `event_management_addon`
- `renewal`

## Files Added or Changed

### Backend

- `backend/prisma/schema.prisma`
- `backend/src/prisma/schema.prisma`
- `backend/prisma/migrations/20260315133800_package_entitlements_rollout/migration.sql`
- `backend/src/services/packageEntitlements.ts`
- `backend/src/routes/checkout.ts`
- `backend/src/routes/invites.ts`
- `backend/src/routes/public.ts`
- `backend/src/routes/invite-ops.ts`
- `backend/src/routes/share.ts`
- `backend/src/jobs/rsvpReminders.ts`
- `backend/src/routes/admin/templates.ts`
- `backend/src/routes/admin/transactions.ts`
- `backend/src/routes/admin/customers.ts`
- `backend/prisma/seed-lib.ts`

### Frontend

- `frontend/src/lib/packageCatalog.ts`
- `frontend/src/services/api.ts`
- `frontend/src/types/index.ts`
- `frontend/src/pages/Checkout.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/LiveInvite.tsx`
- `frontend/src/pages/InviteOperations.tsx`
- `frontend/src/pages/Pricing.tsx`
- `frontend/src/pages/Home.tsx`
- `frontend/src/pages/Gallery.tsx`
- `frontend/src/pages/TemplatePreview.tsx`
- `frontend/src/pages/SampleInvite.tsx`
- `frontend/src/pages/PublishSuccess.tsx`
- `frontend/src/pages/Terms.tsx`
- `frontend/src/admin/services/api.ts`
- `frontend/src/admin/services/mappers.ts`
- `frontend/src/admin/pages/Invites.tsx`
- `frontend/src/admin/pages/InviteDetail.tsx`
- `frontend/src/admin/pages/CustomerDetail.tsx`
- `frontend/src/admin/pages/Transactions.tsx`
- `frontend/src/admin/pages/Settings.tsx`
- `frontend/src/templates/wedding/rustic-signature/*`

## Database Changes

### Enums

Added:

- `PackageCode`: `package_a`, `package_b`
- `TransactionKind`: `initial_purchase`, `event_management_addon`, `renewal`

### Table changes

#### `Template`

- add `packageCode`

#### `Invite`

- add `packageCode`
- add `eventManagementEnabled`
- add `validUntil`
- add relation to `Transaction[]`

#### `Transaction`

- add `packageCode`
- add `kind`
- add optional `inviteId`

## Migration Behavior

Migration file:

- `backend/prisma/migrations/20260315133800_package_entitlements_rollout/migration.sql`

Behavior:

- existing templates backfilled to `package_a`
- existing transactions backfilled to `package_a` and `initial_purchase`
- existing invites backfilled to:
  - `packageCode = package_a`
  - `eventManagementEnabled = true`
  - `validUntil = migration_timestamp + 3 months`
- legacy `expired` invites reset to `published`
- `taken_down` invites remain taken down

## Central Pricing Logic

Authoritative pricing logic lives in:

- `backend/src/services/packageEntitlements.ts`
- `frontend/src/lib/packageCatalog.ts`

These two modules must stay in sync.

### Backend helper responsibilities

- resolve checkout amount by `intent`, `packageCode`, and currency
- build initial invite entitlements after purchase
- extend validity by 3 months
- derive `isExpired`, `canRenew`, and `canUpgradeEventManagement`
- block promo codes for add-ons and renewals

## Checkout Intents

Endpoint:

- `POST /api/v1/checkout/create-order`

### `initial_purchase`

Request requires:

- `templateSlug`
- `currency`
- optional `promoCode`

Effects:

- creates the checkout order using template package pricing
- creates the invite with initial entitlement fields
- links transaction to the new invite

### `event_management_addon`

Request requires:

- `inviteId`
- `currency`

Effects:

- only valid for Package B invites
- enables `eventManagementEnabled = true` on payment verification

### `renewal`

Request requires:

- `inviteId`
- `currency`

Effects:

- extends `validUntil`
- does not change `eventManagementEnabled`

## Gating Matrix

| State | Public invite | RSVP | Invite edit | Invite ops | Dashboard/Admin visibility |
|---|---|---|---|---|---|
| Package A, active | Allowed | Allowed | Allowed | Allowed | Visible |
| Package B, active, no add-on | Allowed | Blocked | Allowed | Blocked | Visible |
| Package B, active, add-on bought | Allowed | Allowed | Allowed | Allowed | Visible |
| Any package, expired | Blocked with renewal messaging | Blocked | Blocked | Blocked | Visible |
| Taken down | Blocked | Blocked | Owner blocked by status rules | N/A | Visible |

## Frontend Behavior Summary

### Customer-facing

- Pricing page shows Package A, Package B, add-on pricing, renewal pricing, and the 3 month validity rule.
- Checkout supports `intent=initial_purchase`, `intent=event_management_addon`, and `intent=renewal`.
- Dashboard shows:
  - renewal CTA for expired invites
  - add-on CTA for Package B invite-only purchases
- Live invite hides RSVP if event management is unavailable.
- Live invite shows expired messaging when the validity window has passed.
- Package B premium template is `rustic-signature`.

### Admin-facing

- template screens expose package code
- invite screens show package, validity, renewal state, and add-on state
- transaction screens show transaction kind, package, and linked invite
- settings page now documents fixed package pricing instead of implying one editable premium price

## Tests Added

### Backend

- `backend/src/services/packageEntitlements.test.ts`

Coverage:

- initial package prices
- add-on prices
- renewal prices
- initial entitlement creation
- validity extension math
- expiry and upgrade derivation
- promo-code eligibility by intent

### Frontend

- `frontend/src/lib/packageCatalog.test.ts`
- `frontend/src/admin/services/mappers.test.ts`

Coverage:

- frontend price catalog
- package display naming
- admin invite mapping
- admin transaction mapping
- derived renewal and add-on state in admin mapping

## Debugging Playbook

### 1. Wrong checkout amount

Check:

- `backend/src/services/packageEntitlements.ts`
- `frontend/src/lib/packageCatalog.ts`
- template `packageCode`
- checkout `intent`
- currency sent by client

Common causes:

- template assigned to wrong package
- frontend and backend price books drifted
- add-on or renewal being sent as `initial_purchase`

### 2. Package B cannot buy add-on

Check:

- invite has `packageCode = package_b`
- invite is not expired
- `POST /checkout/create-order` received `intent = event_management_addon`
- transaction verification sets `eventManagementEnabled = true`

Common causes:

- invite mistakenly migrated as Package A
- frontend checkout link missing `inviteId`
- add-on attempt made after expiry

### 3. Invite expired too early or too late

Check:

- stored `validUntil` in database
- server timezone assumptions
- `extendInviteValidity()` math in `packageEntitlements.ts`

Common causes:

- stale backfilled `validUntil`
- unexpected manual DB edits
- frontend showing cached invite data

### 4. RSVP missing on live invite

Check:

- public API response fields:
  - `eventManagementEnabled`
  - `canRenew`
  - `status`
- `LiveInvite.tsx` only passes `inviteId` to the template when event management is enabled

Common causes:

- Package B invite never purchased add-on
- invite is expired
- public API data mapped incorrectly

### 5. Invite operations screen blocked

Check:

- `backend/src/routes/invite-ops.ts`
- `frontend/src/pages/InviteOperations.tsx`
- invite `eventManagementEnabled`
- invite `validUntil`

Common causes:

- Package B invite-only purchase
- expired invite
- stale invite payload cached on client

### 6. Admin page missing package or customer info

Check:

- `frontend/src/admin/services/mappers.ts`
- nested `user` and `invite` objects returned by admin routes

Common causes:

- mapper fallback not reading nested relation data
- admin route response shape changed without mapper update

## Verification Commands

Backend:

```powershell
cd backend
npm run db:generate
npm run build
npm test
```

Frontend:

```powershell
cd frontend
npm test
npm run build
```

## Maintenance Notes

- If pricing changes again, update backend and frontend catalogs in the same branch.
- If package rules change, update both entitlement derivation and UI copy at the same time.
- If renewal should be allowed before expiry in future, change checkout validation and dashboard CTA rules together.
- Keep this file aligned with `TECHNICAL.md`, `CUSTOMER_FEATURES.md`, and `shyara-product-context.md`.
