# Shyara Template Developer Integration Spec (Frontend + RSVP)

## 1. Purpose
This document defines the non-negotiable technical contract for external teams building invitation templates (including teams using Lovable, Cursor, or Antigravity).

Design can change. Visual style can change.  
Integration contract cannot change.

---

## 2. Who Should Use This
- Template/UI developers
- Frontend integrators
- QA validating new template packs

---

## 3. Non-Negotiable Rules
- Every template must render inside the existing React app and routing.
- Every template must support existing invite publish + live view flow.
- RSVP must use the existing backend contract (no custom RSVP API).
- Template slug/category must match platform records exactly.
- Do not modify core API client behavior in `src/services/api.ts` for template-specific logic.

---

## 4. Required Deliverables Per Template
- `frontend/shareable-moments/src/templates/<category>/<slug>/index.tsx`
- `frontend/shareable-moments/src/templates/<category>/<slug>/config.ts`
- Registry wiring in `frontend/shareable-moments/src/templates/registry.ts`
- Matching template row in backend DB/admin (`slug`, `category`, `priceUsd`, `priceEur`, etc.)

Category folder names (frontend):
- `wedding`
- `engagement`
- `birthday`
- `baby-shower`
- `corporate`
- `anniversary`

---

## 5. Renderer Contract (Mandatory)
Template component must follow this interface:

```tsx
import { TemplateConfig } from "@/types";

interface Props {
  config: TemplateConfig;
  data: Record<string, any>;
  isPreview?: boolean;
  inviteId?: string;
}

const MyTemplate = ({ config, data, isPreview = false, inviteId }: Props) => {
  return <div>...</div>;
};

export default MyTemplate;
```

Behavior requirements:
- Must render correctly for:
  - Template preview page (`isPreview=true`, no `inviteId`)
  - Invite form live preview
  - Live invite page (`inviteId` present)
- If RSVP UI exists, render RSVP form only when `inviteId` is available.

Recommended RSVP guard:

```tsx
{config.supportedSections.includes("rsvp") && inviteId && (
  <InviteRsvpForm inviteId={inviteId} />
)}
```

---

## 6. Config Contract (Mandatory)
Each template `config.ts` must export a valid `TemplateConfig`:

```ts
const config: TemplateConfig = {
  slug: "royal-gold",
  name: "Royal Gold",
  category: "wedding",
  tags: ["luxury", "gold"],
  isPremium: true,
  price: 599,     // legacy (keep)
  priceUsd: 599,  // cents
  priceEur: 549,  // cents
  thumbnail: "/placeholder.svg",
  previewImages: ["/placeholder.svg"],
  supportedSections: ["hero", "story", "schedule", "gallery", "venue", "rsvp"],
  fields: weddingFields, // from shared-fields OR compatible custom fields
  dummyData: { ... }
};

export default config;
```

Notes:
- `priceUsd` and `priceEur` are in cents.
- `price` is legacy; keep it for compatibility.
- `supportedSections` controls what editors and renderers expect.

---

## 7. Data Contract for Template Fields
Invite data is stored as JSON (`Invite.data`) and passed to renderer as `data`.

Field types supported by current form renderer:
- `text`
- `textarea`
- `date`
- `time`
- `image`
- `images`
- `toggle`
- `schedule-list`
- `number`
- `url`

If your template requires new field types, core team must first extend:
- `src/types/index.ts` (`TemplateFieldType`)
- `src/components/InviteForm/FieldRenderer.tsx`

Current shared field sets are in:
- `src/templates/shared-fields.ts`

---

## 8. RSVP Integration Contract (Mandatory)
Use existing component:
- `src/components/InviteRsvpForm.tsx`

Do not call backend directly from template renderer.

Backend endpoints (already implemented):
- `GET /api/public/invites/:slug`
- `POST /api/public/invites/:slug/rsvp`

RSVP request payload:

```json
{
  "name": "Guest Name",
  "email": "guest@example.com", 
  "response": "yes",
  "guestCount": 2,
  "message": "Looking forward"
}
```

Validation currently enforced by backend:
- `name`: required, 1..120 chars
- `email`: optional, must be valid email if provided
- `response`: `yes | no | maybe`
- `guestCount`: integer 1..20
- `message`: optional, max 1000 chars

RSVP submissions feed:
- Customer dashboard RSVP page
- Admin invite/customer analytics
- RSVP email notifications

---

## 9. Routing & Runtime Requirements
- Live invite route: `/i/:slug`
- Template preview route: `/templates/:slug/preview`
- Template checkout route: `/checkout/:slug`

Template renderers are dynamically imported from:
- `src/templates/<category>/<slug>/index.tsx`

If folder path or filename is wrong, lazy loading fails.

---

## 10. Registry Steps (Mandatory)
For each new template:
1. Add config import in `src/templates/registry.ts`.
2. Add config object to `allTemplates`.
3. Ensure `slug` and `category` match folder path exactly.

No manual renderer import is needed for runtime rendering because:
- `registry.ts` uses `import.meta.glob('./*/*/index.tsx')`.

---

## 11. Backend Matching Requirements
A template must also exist in backend Template table with same slug/category, otherwise user flows break.

Required backend fields:
- `slug`
- `name`
- `category` (backend enum uses underscore style, frontend uses hyphen style)
- `isPremium`
- `priceUsd`
- `priceEur`
- `isVisible`
- `isFeatured`

Recommended setup methods:
- Admin UI (`/admin/templates`)
- Prisma seed update (`backend/prisma/seed.ts`) if shipping in default pack

---

## 12. AI Tool Workflow (Lovable / Cursor / Antigravity)

## 12.1 Generation Phase
Generate only the presentational template section first:
- Hero
- Story
- Schedule
- Gallery
- Venue
- RSVP block placeholder
- Footer

Keep generated output as pure React component markup/styles.

## 12.2 Adaptation Phase
Before merge, adapt generated code to Shyara contract:
- Convert to TSX component using required Props interface.
- Replace hardcoded text with `data.<key>` bindings.
- Add `config.supportedSections` guards around sections.
- Replace custom RSVP logic with `<InviteRsvpForm inviteId={inviteId} />`.
- Ensure no framework-locked dependencies (no Next.js-only APIs, no server components).

## 12.3 Integration Phase
- Add `config.ts`
- Wire registry import
- Test in preview + live invite
- Validate RSVP submission path

---

## 13. What External Teams Can Change Freely
- Visual design system
- Typography and spacing
- Animation style
- Section order and layout
- Decorative UI and theming

## 14. What External Teams Must Not Change
- Renderer prop interface
- Route structure
- Core API contracts
- RSVP payload contract
- Slug/category identity
- `TemplateConfig` required fields

---

## 15. Acceptance Checklist (Must Pass)
- Template appears in `/templates`.
- `/templates/<slug>/preview` loads without crash.
- Checkout flow reaches invite creation for purchased/free templates.
- Invite editor preview renders correctly.
- Publish works and creates live URL `/i/<slug>`.
- Live invite renders and RSVP submission works.
- RSVP appears in:
  - user dashboard invite RSVP management
  - admin invite detail
  - admin customer timeline metrics
- Mobile layout works at common widths (360px, 390px, 768px+).
- No console runtime errors in template page.

---

## 16. Common Integration Pitfalls
- Using `Link` outside Router context.
- Missing `inviteId` guard around RSVP form.
- Mismatch between config slug and folder slug.
- New custom field type added in config but not supported in `FieldRenderer`.
- Hardcoded sample data left in production renderer.
- Using unsupported framework APIs from generated code.

---

## 17. Handoff Package Format (Per Template)
Each handoff should include:
- `index.tsx`
- `config.ts`
- short README with:
  - expected data keys
  - optional keys
  - design notes
  - known limitations

---

## 18. Final Rule
If a template is visually excellent but breaks publish, live rendering, or RSVP tracking, it is considered incomplete.

