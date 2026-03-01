# Shyara Invite — Frontend

Customer-facing and admin frontend for [invite.shyara.co.in](https://invite.shyara.co.in) — a premium digital e-invitation platform for weddings, engagements, birthdays, and more.

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS** + **shadcn/ui** (design system)
- **Framer Motion** (animations)
- **React Router v6** (routing)
- **React Hook Form** + **Zod** (forms & validation)
- **TanStack React Query** (data fetching)

## Getting Started

```bash
npm install
npm run dev
```

App runs at `http://localhost:8080`

## Project Structure

```
src/
├── pages/          Customer-facing pages (16)
├── components/     Shared UI components
├── templates/      Invite template renderers (15 templates)
├── services/       API layer (swap mock for real backend calls)
├── contexts/       Auth contexts (customer + admin)
├── admin/          Admin portal (pages, components, services)
└── types/          Shared TypeScript types
```

## Admin Portal

Access at `/admin/login`

- **Admin:** admin@shyara.co.in / admin123
- **Support:** support@shyara.co.in / support123

## Connecting to Backend

All API calls are in `src/services/api.ts` (customer) and `src/admin/services/api.ts` (admin).
Replace the mock implementations with real fetch/axios calls pointing to the backend.

Set the backend base URL via environment variable:

```
VITE_API_URL=https://api.invite.shyara.co.in
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

## Build for Production

```bash
npm run build
```

Output goes to `dist/`. Deploy to any static host (Vercel, Netlify, Nginx).
