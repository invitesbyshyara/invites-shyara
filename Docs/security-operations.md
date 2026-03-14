# Security Operations Runbook

## Production Edge
- Put Cloudflare in front of both `invitesbyshyara.com` and `api.invitesbyshyara.com`.
- Enable:
  - Managed WAF rules
  - Bot fight mode or bot management
  - Rate limiting rules on `/api/v1/auth/*`, `/api/v1/admin/auth/*`, `/api/v1/public/*`, `/api/v1/checkout/*`, and `/api/v1/invites/upload-image`
  - Always Use HTTPS
- Keep Render origin locked behind Cloudflare proxying in production.

## Error-Handling Policy
- Every response carries `X-Request-ID`.
- Public API errors must only expose:
  - `success: false`
  - `error`
  - `code`
  - `requestId`
  - `fields` for validation failures only
- Never expose stack traces, Prisma metadata, upstream provider payloads, cookies, auth headers, or raw exception messages in production.
- Unknown errors should always return `500 Internal server error`.

## Logging Policy
- Logs are structured JSON in production.
- Redact:
  - cookies
  - auth headers
  - CSRF tokens
  - passwords
  - OTPs
  - refresh tokens
  - access tokens
  - email addresses
  - payment IDs and signatures
- Security-sensitive events should be stored in `SecurityEvent` and monitored:
  - failed login
  - successful login
  - MFA setup, disable, and recovery rotation
  - password reset request and completion
  - email verification request and completion
  - rate-limit hits

## MFA Rollout
- Admin and support users must complete MFA setup before receiving a session.
- Customer MFA is self-service and should be encouraged in account settings.
- Keep recovery codes offline and rotate them after any suspected compromise.

## Password Reset and Email Verification
- Password reset uses dedicated challenge records with:
  - hashed OTP
  - expiry timestamp
  - attempt counter
  - request IP
  - one active challenge per account
- Email verification uses dedicated challenge records with hashed tokens and expiry.

## Dependency Hygiene
- Run weekly:
  - `backend/npm run audit:prod`
  - `frontend/npm run audit:prod`
  - `backend/npm outdated`
  - `frontend/npm outdated`
- Keep CI security guard green before deploy.

## Incident Response
1. Use `requestId` from the client report.
2. Search structured logs by `requestId`.
3. Cross-check `SecurityEvent` records for the actor and IP.
4. If abuse is active, tighten Cloudflare rules first.
5. Revoke sessions by deleting refresh tokens or rotating admin cookies if needed.
