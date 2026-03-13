# Shyara Invite - Frontend

Customer-facing and admin frontend for [invite.shyara.co.in](https://invite.shyara.co.in) - a premium digital e-invitation platform.

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS** + **shadcn/ui** (design system)
- **Framer Motion** (animations)
- **React Router v6** (routing)
- **React Hook Form** + **Zod** (forms and validation)
- **TanStack React Query** (data fetching)

## Getting Started

```bash
npm install
npm run dev
```

App runs at `http://localhost:8080`

## Project Structure

```text
src/
|- pages/          Customer-facing pages
|- components/     Shared UI components
|- templates/      Invite template registry and renderer
|- services/       API layer
|- contexts/       Auth contexts (customer + admin)
|- admin/          Admin portal (pages, components, services)
`- types/          Shared TypeScript types
```

## Admin Portal

Access at `/admin/login`

- **Admin:** `admin@shyara.co.in / admin123`
- **Support:** `support@shyara.co.in / support123`

## Connecting to Backend

All API calls are in `src/services/api.ts` (customer) and `src/admin/services/api.ts` (admin).

Set the backend base URL via environment variables:

```bash
VITE_API_URL=https://api.invitesbyshyara.com
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## Build for Production

```bash
npm run build
```

Output goes to `dist/`.
