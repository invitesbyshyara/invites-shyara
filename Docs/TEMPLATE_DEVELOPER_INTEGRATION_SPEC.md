# Shyara Template Developer Integration Spec

## 1. Purpose

This document is the single authoritative technical contract for every team building invitation templates for Shyara (including Lovable, Cursor, or any external team).

**Design is yours. Everything in this document is not.**

Read this fully before writing any code. Every heading is a technical constraint, not a suggestion.

---

## 2. What You Deliver Per Template

| File | Required |
|---|---|
| `frontend/src/templates/<category>/<slug>/index.tsx` | Yes |
| `frontend/src/templates/<category>/<slug>/config.ts` | Yes |
| One entry in `frontend/src/templates/registry.ts` | Yes |
| Matching row in backend DB (via admin UI or seed file) | Yes |

Category folder names are fixed — use exactly these strings:

```
wedding
engagement
birthday
baby-shower
corporate
anniversary
```

---

## 3. TypeScript Interfaces (Do Not Deviate)

### 3.1 `TemplateConfig` — what your `config.ts` must export

```ts
interface TemplateConfig {
  slug: string;           // must match folder name exactly, e.g. "royal-gold"
  name: string;           // display name, e.g. "Royal Gold"
  category: EventCategory; // must match folder name exactly
  tags: string[];
  isPremium: boolean;
  price: number;          // legacy — keep for compatibility, same value as priceUsd
  priceUsd: number;       // in cents, e.g. 599 = $5.99. Use 0 for free.
  priceEur: number;       // in cents, e.g. 549 = €5.49. Use 0 for free.
  thumbnail: string;      // use "/placeholder.svg" if no custom thumbnail
  previewImages: string[]; // use ["/placeholder.svg"] if none
  supportedSections: string[]; // see Section 5
  fields: TemplateField[]; // see Section 4
  dummyData: Record<string, any>; // see Section 7
}

type EventCategory = 'wedding' | 'engagement' | 'birthday' | 'baby-shower' | 'corporate' | 'anniversary';
```

### 3.2 `TemplateField` — each field in your `config.ts` fields array

```ts
interface TemplateField {
  key: string;       // MUST match the key names from Section 6 for your category
  label: string;     // shown in the form editor
  type: TemplateFieldType;
  required: boolean;
  section?: 'basic' | 'venue' | 'story' | 'schedule' | 'gallery' | 'rsvp' | 'settings';
  maxLength?: number; // for text/textarea
  max?: number;       // for images (max count) or number fields
  placeholder?: string;
}

type TemplateFieldType =
  | 'text'
  | 'textarea'
  | 'date'
  | 'time'
  | 'image'      // single image URL string
  | 'images'     // array of image URL strings
  | 'toggle'     // boolean
  | 'schedule-list' // array of { time, title, description? }
  | 'number'
  | 'url';
```

**`section` values are fixed strings.** Using any value outside the list above means the field will not appear in the invite editor at all.

---

## 4. Field Section → Form Step Mapping

The invite editor is a 4-step wizard. Fields are placed into steps based on their `section` value. **This mapping is hardcoded in the platform — you cannot change it.**

| `field.section` value | Appears in step |
|---|---|
| `'basic'` | Step 1 — Event Details |
| `'venue'` or `'story'` | Step 2 — Venue & Story |
| `'gallery'`, `'schedule'`, `'rsvp'`, or `'settings'` | Step 3 — Media & Schedule |
| *(no section / undefined)* | Step 1 — treated as `'basic'` |

Fields with any other `section` value will be silently ignored by the editor.

### Section → `supportedSections` Key Mapping

`field.section` and `supportedSections` use different key names for the hero/cover section. This mapping is fixed:

| `field.section` | Corresponding `supportedSections` key |
|---|---|
| `'basic'` | `'hero'` |
| `'venue'` | `'venue'` |
| `'story'` | `'story'` |
| `'schedule'` | `'schedule'` |
| `'gallery'` | `'gallery'` |
| `'rsvp'` | `'rsvp'` |
| `'settings'` | *(no entry in supportedSections — always shown)* |

---

## 5. Section Visibility System

### How It Works

Customers toggle individual sections on/off when editing their invite. The platform handles this entirely — **templates never change**.

1. `config.supportedSections` = full list of sections your template *can* render.
2. The customer's choices are saved as `enabledSections` in `invite.data`.
3. At runtime, the platform pre-filters `config.supportedSections` to only the enabled ones before passing `config` to your template.
4. Your template checks `config.supportedSections.includes('sectionName')` — exactly as it always would.

### Rules

```tsx
// ✅ Correct
{config.supportedSections.includes('story') && (
  <section>...</section>
)}

// ❌ Wrong — never read data.enabledSections in template code
{data.enabledSections?.includes('story') && (
  <section>...</section>
)}
```

- `'hero'` is always present in `config.supportedSections` at runtime — it is locked on and cannot be toggled off.
- `'footer'` is not a `supportedSection` — render footer unconditionally in every template.
- `'settings'` has no corresponding `supportedSection` — settings fields are always shown in the editor but do not map to a rendered section.

### Recommended `supportedSections` Per Category

| Category | Recommended |
|---|---|
| `wedding` | `['hero','story','schedule','gallery','venue','rsvp']` |
| `engagement` | `['hero','story','schedule','venue','rsvp']` |
| `birthday` | `['hero','schedule','gallery','venue','rsvp']` |
| `baby-shower` | `['hero','story','schedule','venue','rsvp']` |
| `corporate` | `['hero','story','schedule','venue','rsvp']` |
| `anniversary` | `['hero','story','schedule','gallery','venue','rsvp']` |

If your template does not support `gallery` (e.g. your design has no photo grid), omit `'gallery'` from `supportedSections`. Customers will not see a gallery toggle.

---

## 6. Exact Field Keys Per Category

**You must use these exact key names.** The template renderer reads `data.<key>` directly, and the same keys are written by the editor. Using different key names means the customer's input never reaches the template.

Use the shared field sets from `frontend/src/templates/shared-fields.ts` — import directly rather than re-defining:

```ts
import { weddingFields } from '@/templates/shared-fields';
```

### wedding (`weddingFields`)

| Key | Type | section | Required |
|---|---|---|---|
| `brideName` | text | basic | yes |
| `groomName` | text | basic | yes |
| `weddingDate` | date | basic | yes |
| `weddingTime` | time | basic | yes |
| `venueName` | text | venue | yes |
| `venueAddress` | textarea | venue | yes |
| `loveStory` | textarea | story | no |
| `coverPhoto` | image | gallery | no |
| `galleryPhotos` | images | gallery | no (max 10) |
| `schedule` | schedule-list | schedule | no |
| `rsvpDeadline` | date | rsvp | no |
| `enableMusic` | toggle | settings | no |

### engagement (`engagementFields`)

| Key | Type | section | Required |
|---|---|---|---|
| `partnerOneName` | text | basic | yes |
| `partnerTwoName` | text | basic | yes |
| `engagementDate` | date | basic | yes |
| `engagementTime` | time | basic | yes |
| `venueName` | text | venue | yes |
| `venueAddress` | textarea | venue | yes |
| `ourStory` | textarea | story | no |
| `coverPhoto` | image | gallery | no |
| `galleryPhotos` | images | gallery | no (max 10) |
| `schedule` | schedule-list | schedule | no |
| `rsvpDeadline` | date | rsvp | no |
| `enableMusic` | toggle | settings | no |

### birthday (`birthdayFields`)

| Key | Type | section | Required |
|---|---|---|---|
| `celebrantName` | text | basic | yes |
| `age` | number | basic | no |
| `eventDate` | date | basic | yes |
| `eventTime` | time | basic | yes |
| `venueName` | text | venue | yes |
| `venueAddress` | textarea | venue | yes |
| `welcomeMessage` | textarea | story | no |
| `coverPhoto` | image | gallery | no |
| `galleryPhotos` | images | gallery | no (max 10) |
| `schedule` | schedule-list | schedule | no |
| `rsvpDeadline` | date | rsvp | no |

### baby-shower (`babyShowerFields`)

| Key | Type | section | Required |
|---|---|---|---|
| `parentNames` | text | basic | yes |
| `babyName` | text | basic | no |
| `eventDate` | date | basic | yes |
| `eventTime` | time | basic | yes |
| `theme` | text | basic | no |
| `venueName` | text | venue | yes |
| `venueAddress` | textarea | venue | yes |
| `welcomeMessage` | textarea | story | no |
| `coverPhoto` | image | gallery | no |
| `galleryPhotos` | images | gallery | no (max 10) |
| `registryLink` | url | settings | no |
| `rsvpDeadline` | date | rsvp | no |

### corporate (`corporateFields`)

| Key | Type | section | Required |
|---|---|---|---|
| `eventName` | text | basic | yes |
| `organizerName` | text | basic | yes |
| `companyName` | text | basic | no |
| `eventDate` | date | basic | yes |
| `eventTime` | time | basic | yes |
| `venueName` | text | venue | yes |
| `venueAddress` | textarea | venue | yes |
| `description` | textarea | story | no |
| `coverPhoto` | image | gallery | no |
| `schedule` | schedule-list | schedule | no |
| `rsvpDeadline` | date | rsvp | no |

### anniversary (`anniversaryFields`)

| Key | Type | section | Required |
|---|---|---|---|
| `coupleNames` | text | basic | yes |
| `years` | number | basic | no |
| `anniversaryDate` | date | basic | yes |
| `anniversaryTime` | time | basic | yes |
| `venueName` | text | venue | yes |
| `venueAddress` | textarea | venue | yes |
| `ourJourney` | textarea | story | no |
| `coverPhoto` | image | gallery | no |
| `galleryPhotos` | images | gallery | no (max 10) |
| `schedule` | schedule-list | schedule | no |
| `rsvpDeadline` | date | rsvp | no |
| `enableMusic` | toggle | settings | no |

---

## 7. Data Shapes Passed to Template

The template receives `data: Record<string, any>`. The following keys have non-primitive shapes:

### `data.schedule`
```ts
// Array of schedule items. May be empty or undefined.
type ScheduleItem = {
  time: string;      // e.g. "4:00 PM"
  title: string;     // e.g. "Wedding Ceremony"
  description?: string; // optional
};
// Access as:
data.schedule as ScheduleItem[] | undefined
```

### `data.galleryPhotos`
```ts
// Array of image URL strings. May be empty or undefined.
data.galleryPhotos as string[] | undefined
```

### `data.coverPhoto`
```ts
// Single image URL string. May be undefined.
data.coverPhoto as string | undefined
```

### `data.slug`
The invite's public slug is always injected into `data` at runtime — you can read it as `data.slug`. Useful when passing to `InviteCover`.

### Date/time fields
Date fields are ISO strings: `"2026-06-15"`. Time fields are `"HH:MM"` strings: `"16:00"` or `"4:00 PM"` depending on how the user typed it. Render them as-is; do not attempt parsing or reformatting.

### Absent data
The template must render gracefully when optional fields are absent. Always use a fallback:

```tsx
// ✅ Correct
{data.loveStory && <p>{data.loveStory}</p>}

// Or with a placeholder for preview
<h1>{data.brideName || 'Bride'}</h1>
```

---

## 8. Renderer Contract (`index.tsx`)

```tsx
import { TemplateConfig } from '@/types';
import InviteCover from '@/components/InviteCover';
import InviteRsvpForm from '@/components/InviteRsvpForm';

interface Props {
  config: TemplateConfig;
  data: Record<string, any>;
  isPreview?: boolean;
  inviteId?: string;
}

const MyTemplate = ({ config, data, isPreview = false, inviteId }: Props) => {
  // ...
};

export default MyTemplate;
```

### Opening Cover (InviteCover)

Every template must use `InviteCover` as the animated entry screen. The main invite content is gated behind `isOpened` state:

```tsx
const [isOpened, setIsOpened] = useState(false);

return (
  <>
    <InviteCover
      title="..."         // required — headline shown on cover
      subtitle="..."      // optional — small text above title
      date={data.weddingDate || ''}
      time={data.weddingTime || ''}
      slug={data.slug || 'preview'}
      isPreview={isPreview}
      theme="gold"        // choose one theme from Section 9
      onOpen={() => setIsOpened(true)}
    />

    {isOpened && (
      <div>
        {/* Hero, Story, Venue, Schedule, Gallery, RSVP, Footer */}
      </div>
    )}
  </>
);
```

**Why**: `InviteCover` handles the animated open/skip intro UX and localStorage "already seen" persistence. Without it, guests get no opening animation. The `isOpened` gate ensures the main content doesn't flash before the cover has been dismissed.

In preview mode (`isPreview=true`), the cover dismisses automatically without saving to localStorage.

### InviteCover Props

| Prop | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | Main heading shown on cover |
| `subtitle` | string | no | Small text above title |
| `date` | string | no | Shown below title |
| `time` | string | no | Shown below date |
| `slug` | string | yes | Used for localStorage key — pass `data.slug \|\| 'preview'` |
| `isPreview` | boolean | no | Skips localStorage persistence |
| `theme` | string | no | See Section 9 for valid values |
| `onOpen` | () => void | yes | Called when guest opens the invite |

### Section Guards

Wrap every optional section with a `config.supportedSections.includes()` check:

```tsx
{config.supportedSections.includes('hero') && (
  <section>{/* hero content */}</section>
)}

{config.supportedSections.includes('story') && data.loveStory && (
  <section>{data.loveStory}</section>
)}

{config.supportedSections.includes('schedule') && data.schedule?.length > 0 && (
  <section>{/* render data.schedule items */}</section>
)}

{config.supportedSections.includes('venue') && (data.venueName || data.venueAddress) && (
  <section>{/* venue */}</section>
)}

{config.supportedSections.includes('gallery') && (
  <section>{/* render data.galleryPhotos */}</section>
)}

{/* RSVP — must also check inviteId */}
{config.supportedSections.includes('rsvp') && inviteId && (
  <InviteRsvpForm inviteId={inviteId} />
)}

{/* Footer — always, no guard needed */}
<footer>...</footer>
```

---

## 9. Platform Imports Available

These packages are installed and importable. Do not add new npm packages.

| Package | Import path | Notes |
|---|---|---|
| React | `react` | useState, useEffect, useRef, useMemo, useCallback |
| framer-motion | `framer-motion` | motion, AnimatePresence, useScroll, useTransform, useInView |
| InviteCover | `@/components/InviteCover` | Required cover animation component |
| InviteRsvpForm | `@/components/InviteRsvpForm` | Required RSVP component |
| TemplateConfig | `@/types` | Type import only |
| lucide-react | `lucide-react` | Icons |

The `@/` alias maps to `frontend/src/`. All imports in templates must use `@/` not relative `../../`.

Do not import from `react-router-dom`, `next/*`, or any server-side framework.

### InviteCover `theme` Values

Pick one that matches your template's visual mood:

```
'gold'             'dark-floral'      'confetti'
'pastel-floral'    'ivory-classic'    'rustic-warm'
'celestial-navy'   'golden-warm'      'rose-pink'
'neon-dark'        'star-blue'        'sweet-pink'
'corporate-dark'   'corporate-light'  'anniversary-warm'
'default'
```

Each theme controls the cover screen background, text, and button colors. The template body is entirely your own design.

---

## 10. CSS & Styling Constraints

- Use **Tailwind CSS utility classes** for all styling.
- Two font family classes are available — use them consistently:
  - `font-display` — headings, names, large text
  - `font-body` — body text, labels, captions
- Inline `style={{}}` props are allowed for template-specific colors that Tailwind cannot express (e.g. custom HSL values, box shadows, gradients).
- Do not use CSS Modules, styled-components, or emotion.
- A `<style>` tag with `@keyframes` for custom animations is acceptable inside the component return.

---

## 11. Config Contract (`config.ts`)

```ts
import { TemplateConfig } from '@/types';
import { weddingFields } from '@/templates/shared-fields'; // use your category's field set

const config: TemplateConfig = {
  slug: 'my-template',         // matches folder name
  name: 'My Template',
  category: 'wedding',         // matches folder name
  tags: ['modern', 'minimal'],
  isPremium: true,
  price: 499,                  // same as priceUsd
  priceUsd: 499,               // cents
  priceEur: 449,               // cents
  thumbnail: '/placeholder.svg',
  previewImages: ['/placeholder.svg'],
  supportedSections: ['hero', 'story', 'schedule', 'venue', 'rsvp'],
  fields: weddingFields,
  dummyData: {
    // Must contain a realistic value for every key your template reads from data.*
    // This data is used in the gallery preview and template preview page.
    // If dummyData is incomplete, the preview will look broken.
    brideName: 'Priya',
    groomName: 'Rahul',
    weddingDate: '2026-10-12',
    weddingTime: '5:00 PM',
    venueName: 'The Leela Palace',
    venueAddress: '23 Airport Road, Bengaluru 560008',
    loveStory: 'We met at a rooftop party in 2022...',
    schedule: [
      { time: '4:00 PM', title: 'Ceremony', description: 'Garden ceremony' },
      { time: '7:00 PM', title: 'Reception', description: 'Dinner and dancing' },
    ],
    rsvpDeadline: '2026-09-30',
  },
};

export default config;
```

### dummyData Completeness Rule

Every `data.<key>` reference in your `index.tsx` must have a matching entry in `dummyData`. The template preview page passes `dummyData` as the `data` prop — if a key is missing the preview will render empty or broken sections.

---

## 12. RSVP Integration

Use the existing component. Do not build a custom RSVP form.

```tsx
import InviteRsvpForm from '@/components/InviteRsvpForm';

// Inside your RSVP section:
{config.supportedSections.includes('rsvp') && inviteId && (
  <InviteRsvpForm inviteId={inviteId} />
)}
```

**The `inviteId` guard is mandatory.** `inviteId` is undefined on the template preview page and on the invite form preview. The RSVP form must never render without it.

`InviteRsvpForm` accepts optional props for theming:
```tsx
<InviteRsvpForm
  inviteId={inviteId}
  accentColor="#b8860b"   // optional — not used by current form styles but reserved
  className="my-custom-wrapper-class" // optional wrapper class
/>
```

The component handles all state, submission, and the thank-you screen internally. Do not wrap it in any form tag.

---

## 13. Registry Wiring

After creating your template files, add one config import and one array entry to `frontend/src/templates/registry.ts`:

```ts
// 1. Add import at top (with other config imports):
import myTemplate from './wedding/my-template/config';

// 2. Add to allTemplates array:
export const allTemplates: TemplateConfig[] = [
  // ...existing entries...
  myTemplate,
];
```

No renderer import is needed. The platform uses `import.meta.glob('./*/*/index.tsx')` to load renderers dynamically at runtime. The renderer is found by matching `category/slug` to the folder path.

**The `slug` in your config and the folder name must match exactly, character for character.** A mismatch causes a runtime error: `Template renderer not found: wedding/my-template`.

---

## 14. Routing & Render Contexts

Your template is rendered in three different contexts. It must work correctly in all three:

| Context | `isPreview` | `inviteId` | `data` source |
|---|---|---|---|
| Gallery / template preview page | `true` | `undefined` | `config.dummyData` |
| Invite editor live preview | `false` | `undefined` | Customer's in-progress form data |
| Live invite at `/i/:slug` | `false` | invite ID string | Published invite data |

- Routes: `/templates/:slug/preview`, `/i/:slug`
- Do not use `useParams`, `useNavigate`, or `Link` inside a template renderer. Templates are rendered as components, not as route-level pages.

---

## 15. Backend Matching

The template must have a matching row in the backend `Template` table. Without it, checkout and invite creation break.

Required fields:
- `slug` — exact match to frontend slug
- `name`
- `category` — backend enum uses **underscore** style: `baby_shower`, `corporate`, etc.
- `isPremium`
- `priceUsd` (cents)
- `priceEur` (cents)
- `isVisible: true`
- `isFeatured: false` (unless discussed)

Setup: use the admin UI at `/admin/templates` or add to `backend/prisma/seed.ts`.

---

## 16. Acceptance Checklist

Before handoff, verify:

- [ ] `/templates/<slug>/preview` loads without console errors
- [ ] All sections render in preview using `dummyData`
- [ ] Invite editor (step 1–4) works — fields appear in correct steps
- [ ] Toggling a section off in editor → section absent in review preview
- [ ] Toggling a section off → that section's required fields do not block next step
- [ ] `InviteCover` opens and transitions to the template body
- [ ] Publish creates live URL `/i/<slug>`
- [ ] Live invite renders only enabled sections
- [ ] RSVP form appears on live invite only (not in preview or editor preview)
- [ ] RSVP submission succeeds and appears in customer dashboard
- [ ] Template renders correctly at 360px, 390px, and 768px widths
- [ ] No hardcoded sample names or placeholder text left in production renderer
- [ ] `slug` in `config.ts` exactly matches folder name
- [ ] `category` in `config.ts` exactly matches folder name

---

## 17. Common Integration Errors

| Error | Cause |
|---|---|
| Field doesn't appear in editor | `field.section` is misspelled or not one of the 7 allowed values |
| Template renderer not found (runtime crash) | Slug in `config.ts` doesn't match folder name, or registry import is missing |
| RSVP form appears in preview | Missing `&& inviteId` guard |
| Section not toggled off in live invite | Template reads `data.enabledSections` directly instead of `config.supportedSections` |
| Preview page renders empty | `dummyData` is missing keys that the template reads |
| `Link` component crash | `react-router-dom` components cannot be used inside template renderers |
| Cover never shows | `InviteCover` not used, or `{isOpened && ...}` gate missing |
| New field type silently ignored | Custom field type not in `TemplateFieldType` — must be added to core types by the platform team |

---

## 18. Final Rule

A template is **incomplete** if any of these are true:
- The template preview page crashes
- Publish fails
- The live invite does not reflect enabled sections correctly
- RSVP submissions do not reach the dashboard
