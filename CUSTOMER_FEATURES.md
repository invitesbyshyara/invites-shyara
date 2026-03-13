# Invites by Shyara — Customer Feature Reference

> **Purpose**: Complete end-to-end customer feature reference for Invites by Shyara. This document covers every screen, section, interaction, and feature a customer encounters — from first visit to managing a live invitation. No technical knowledge required to read this document.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Public Website — Before Sign-Up](#2-public-website--before-sign-up)
   - 2.1 Home Page
   - 2.2 Template Gallery
   - 2.3 Template Preview Studio
   - 2.4 Live Sample Invites
   - 2.5 Pricing Page
3. [Authentication — Accounts](#3-authentication--accounts)
   - 3.1 Sign Up
   - 3.2 Sign In
   - 3.3 Forgot Password / Reset via OTP
4. [Checkout & Payment](#4-checkout--payment)
5. [Customer Dashboard](#5-customer-dashboard)
6. [Invite Builder — Creating & Editing Invitations](#6-invite-builder--creating--editing-invitations)
   - 6.1 Step 1 — Event Details
   - 6.2 Step 2 — Venue & Story
   - 6.3 Step 3 — Media, Schedule & RSVP Settings
   - 6.4 Step 4 — Review & Publish
   - 6.5 Autosave
   - 6.6 Live Preview Panel
7. [The Live Invite — Guest Experience](#7-the-live-invite--guest-experience)
8. [RSVP Form — Guest Submission](#8-rsvp-form--guest-submission)
9. [RSVP Management — Organiser View](#9-rsvp-management--organiser-view)
10. [Sharing Tools](#10-sharing-tools)
11. [Account Settings](#11-account-settings)
12. [Emails Sent to Customers & Guests](#12-emails-sent-to-customers--guests)
13. [Pricing Model](#13-pricing-model)
14. [Navigation & Global UI](#14-navigation--global-ui)
15. [Mobile Experience](#15-mobile-experience)

---

## 1. Product Overview

**Invites by Shyara** is an online platform for creating beautiful, animated digital invitations for weddings, engagements, birthdays, baby showers, corporate events, and anniversaries.

### How it works — end to end

| Step | What happens |
|------|-------------|
| **Browse** | Customer explores templates on the gallery page or home page |
| **Preview** | Customer views any template in the Preview Studio (mobile/desktop view) or opens a Live Sample with demo data — no sign-up required |
| **Purchase** | Customer pays a one-time fee of **$99 / €119** per template — no subscription |
| **Personalize** | After payment, the invite builder unlocks — customer fills in all event details, uploads photos, configures sections |
| **Publish** | Customer publishes their invite; a unique shareable link is generated |
| **Share** | Customer shares the link via WhatsApp, Email, QR code, or by copying the URL |
| **Guests RSVP** | Guests open the link, experience the animated invite, and submit their RSVP |
| **Track** | Customer monitors RSVPs in real time from their dashboard and can export guest data as CSV |

---

## 2. Public Website — Before Sign-Up

No account is needed to browse templates, preview designs, or view live samples. Only purchasing requires an account.

---

### 2.1 Home Page

The landing page introduces the product and guides visitors toward browsing templates.

**Hero Section**
- Headline: "Invitations as beautiful as your celebrations"
- Phone mockup showing a rendered invitation (Royal Gold template)
- Two buttons: **Browse Templates** and **Open Live Sample**

**Statistics Banner**
- Animated counters showing platform activity: 5,000+ invites created · 50,000+ guests RSVP'd · 4.9-star average rating

**How It Works (5-step guide)**
1. Browse Templates
2. Preview Live
3. Buy Your Design
4. Add Your Details
5. Publish & Share

**Featured Templates Carousel**
- 8 popular templates displayed
- Desktop: 4-column grid · Mobile: swipeable carousel with dot navigation
- Each card shows: preview image, category badge, price badge, template name, and three action buttons — **Preview**, **Live Sample**, **Buy**

**Guest Experience Highlight**
- Section explaining what guests experience when they open an invite (animations, gallery, schedule, RSVP form, venue, story)
- **Open Live Sample** CTA button

**Why Shyara Section**
- Three value props: Design-Led · Easy to Share · RSVP Dashboard
- Category tiles showing template counts by event type: Wedding, Engagement, Birthday, Baby Shower, Corporate, Anniversary

**FAQ (4 questions)**
- Can I preview before buying?
- When can I personalise?
- Can I edit after publishing?
- Do guests need an app?

**Footer**
- Links: Templates · Pricing · FAQ · Dashboard · Privacy Policy · Terms of Service
- Back-to-top button

---

### 2.2 Template Gallery

**URL**: `/templates`

Full template browsing experience with filtering and search.

**Filter Bar**
- Category buttons: All · Wedding · Engagement · Birthday · Baby Shower · Corporate · Anniversary
- Search box: real-time search across template names and tags
- Sort dropdown: Most Popular · Newest · Price: Low to High

**Template Grid**
- Responsive: 1 column on mobile → 4 columns on wide screens
- Each card shows:
  - Large preview image
  - Category badge and price badge
  - Template name and event-type tags
  - Special "Popular" badge on top templates
  - Four action buttons: **Quick Look**, **Preview**, **Live Sample**, **Buy & Customize**

**Quick Look Modal**
- Opens an overlay preview of the template without leaving the gallery page

**Empty State**
- If no templates match the search/filter, shows a "No results" message with a **View All Templates** reset button

**Results Counter**
- Shows how many templates are being displayed, e.g. "Showing 5 Wedding templates"

---

### 2.3 Template Preview Studio

**URL**: `/templates/:template-name/preview`

A dedicated page for closely inspecting a template before purchasing.

**Sticky Header**
- Back button (returns to previous page — no new tab)
- Template name, category, price
- **Buy & Customize** button (always visible)
- Mobile / Desktop toggle (always visible, even on small screens — icon-only on very small screens)

**Mobile View**
- Template rendered inside a realistic phone mockup with bezels
- Scrollable — full invite content visible within the phone frame
- Shows the invitation exactly as guests will see it on a mobile device

**Desktop View**
- Template rendered in a bounded browser-chrome mockup
- Scrollable container — does not take over the full screen
- Back button and toggle remain accessible

**Right Sidebar**
- "What happens next" — 4-step guide: Preview → Purchase → Personalise → Publish
- "Included Sections" — badges showing which sections this template supports (Story, Venue, Gallery, Schedule, RSVP, etc.)
- Action links: Open Live Sample · View Pricing · Buy & Customize

**Not Found**
- If the template slug doesn't exist, shows an error with a link to browse all templates

---

### 2.4 Live Sample Invites

**URL**: `/samples/:template-name`

A fully functional demo of any template with realistic fictional data. Guests and prospective customers can experience the complete invitation flow — no account or payment required.

**Info Header** (shows above the invite)
- Back button
- Badges: "Live Sample" · Category · Price
- Template name as heading
- Explanation text: "This sample shows the full guest-facing experience with demo details. Personalisation unlocks after payment."
- Two buttons: **Studio Preview** · **Customize This Invite**

**Sidebar / Floating Panel**
- "What you are seeing" explanation card
- "Included Sections" — all sections this template contains
- "Sample Event" card with fictional event title, date, time, address, and two buttons: **Add to Calendar** · **Get Directions**

**Main Content**
- The full template rendered with demo data — opening animation, story, gallery, schedule, venue, RSVP form, all sections present

---

### 2.5 Pricing Page

**URL**: `/pricing`

**Headline**: "Simple, Transparent Pricing"
**Tagline**: "No hidden fees. No subscriptions. Preview first, then pay once per template."

**Pricing Card** (single, centered)
- "One-Time Payment" badge
- Heading: "Pay Per Template"
- Price: **$99** (USD) or **€119** (EUR) — switches based on currency selection in the navbar
- Tagline: "Per template · Pay once, personalise, publish, and edit later"
- What's included (8 items):
  - Full template preview before purchase
  - Premium designer template with animations
  - Personalised invite link
  - Opening animations
  - Photo gallery and story section
  - Full RSVP tracking dashboard
  - Mobile-optimised shareable link
  - Unlimited sharing and edits after purchase
- **Browse Templates** CTA button

**FAQ (5 questions)**
- Can I preview before paying?
- Can I edit my invite after publishing?
- How does RSVP tracking work?
- Do guests need an app?
- Is this a subscription?

**Bottom CTA**
- "Ready to get started?" with **Browse Templates** and **Live Sample** buttons

---

## 3. Authentication — Accounts

An account is required only to purchase a template. Browsing, previewing, and viewing samples are always free and open.

If a customer tries to buy while not signed in, they are taken to sign in / sign up first, and automatically returned to checkout after authenticating.

---

### 3.1 Sign Up

**URL**: `/register`

**Fields**
- Full Name (required)
- Email (required)
- Password (required, minimum 8 characters)
- Confirm Password (required, must match)

**Behaviour**
- Client-side password match validation before submission
- "Create Account" button shows "Creating account..." while loading
- On success: redirected to dashboard, or back to checkout if the purchase flow was interrupted
- If coming from checkout: page shows "Create your account to continue your template purchase"
- Error messages shown as toast notifications with specific details

**Already have an account?** Link to Sign In at the bottom.

---

### 3.2 Sign In

**URL**: `/login`

**Fields**
- Email
- Password
- "Forgot password?" link (opens password reset flow)

**Behaviour**
- "Sign In" button shows "Signing in..." while loading
- On success: redirected to dashboard, back to checkout, or another specified page
- If coming from checkout: page shows "Sign in to continue your template purchase"
- Error messages shown as toast notifications

**Don't have an account?** Link to Register at the bottom.

---

### 3.3 Forgot Password / Reset via OTP

**URL**: `/forgot-password`

Three-step flow — no link is emailed; a 6-character code is sent to the email address.

**Step 1 — Enter Email**
- Heading: "Reset your password"
- Email input
- "Send Reset Code" button
- "← Back to Login" link
- For security, the page never confirms whether the email exists

**Step 2 — Enter Code & New Password**
- Heading: "Enter reset code"
- Shows the email address the code was sent to
- Reset Code input (6 characters, displayed in uppercase)
- New Password input (minimum 8 characters)
- Confirm New Password input
- "Reset Password" button
- "Didn't receive it? Resend code" link

**Step 3 — Success**
- Checkmark icon in a circular badge
- "Password reset!" heading
- "Back to Login" button

---

## 4. Checkout & Payment

**URL**: `/checkout/:template-name`

After choosing a template to purchase, the customer lands on the checkout page.

**Page Layout**
Two-column on desktop (main content left, order summary right), single column on mobile.

---

**Left Column — Purchase Details**

**Template Summary Card**
- Template thumbnail image
- Template name and category
- Price displayed prominently in gold
- Tagline: "Pay once. Personalise and publish after purchase."

**Personalise Your Preview (expandable)**
- A collapsible section the customer can expand to try out their details before paying
- Shows up to 4 editable fields (names, date, etc.) depending on the template
- A live preview of the template renders below with the entered data
- "PREVIEW" watermark overlays the live preview to indicate it's not yet purchased

**Before You Pay (informational card)**
- Reminder tips: use studio preview or live sample to confirm the design, payment unlocks personalisation, you can edit after publishing, guests use the same link
- Buttons to **Studio Preview** and **Live Sample**

---

**Right Column — Sticky Order Summary**

**Sign In Required (if not logged in)**
- Lock icon with "Sign in to continue"
- Explanation that purchase requires an account
- **Log In** and **Create Account** buttons

**Promo Code**
- "Have a promo code?" expandable link
- When expanded: input field and **Apply** button
- If a valid code is entered: code shown as a badge (with × to remove), discount description shown
- Invalid codes show an error message

**Order Summary**
- Template name and base price
- If a promo is applied: discount line shown in red (negative amount)
- Tax: $0.00
- **Total** shown prominently in gold
- Note: "Secure payment via Razorpay. Cards and UPI accepted."

**Pay Button**
- If not signed in: disabled, labelled "Sign in to unlock purchase"
- While processing: shows "Processing..."
- Normal state: "Pay $99" (or appropriate amount)
- Full-width button

---

**Payment Flow (Razorpay)**

When the customer clicks Pay:
1. Razorpay modal opens in a gold-themed overlay
2. Customer's name and email are pre-filled
3. Customer completes payment (cards or UPI accepted)
4. On success: payment is verified, a new invite is created, customer is redirected to the invite builder
5. On failure: error message shown on the checkout page, customer can try again
6. If the modal is dismissed: loading state clears, customer can retry

---

## 5. Customer Dashboard

**URL**: `/dashboard`

The home base for all invites after logging in.

**Welcome Section**
- Personalised greeting: "Welcome, [First Name]"
- Subtitle: "Create, publish, share, and manage your live invite links in one place"
- Two buttons: **Preview More Templates** · **Create New Invite**

**Statistics Cards** (3 cards, responsive grid)
- Total Invites — all drafts and published combined
- Published — number of live links currently active
- Total RSVPs — total guest responses across all invites

**Getting Started Checklist** (4 steps)
Tracks onboarding progress visually with checkmarks:
1. Choose a template
2. Start your first draft
3. Publish your invite
4. Share and collect RSVPs

Each step shows a checkmark once completed, an empty circle otherwise.

**Filter & Search**
- Search box: find invites by event name, invite URL, or template
- Status filter dropdown: All / Drafts / Published / Expired / Taken Down
- Sort dropdown: Recently Updated · Recently Created · Name · Most RSVPs

**Invites Grid**
Responsive: 1 column mobile → 3 columns desktop.

Each invite card shows:
- Template preview image (or "Preview unavailable" placeholder)
- Event title (truncated if long)
- Template name
- Status badge — colour-coded: **Published** (gold) · **Draft** (gray) · **Expired** · **Taken Down** (red)
- "···" more menu → Edit / Share / Delete
- Event date (if set)
- RSVP count
- Shareable URL path
- Action buttons:
  - **Edit** and **View RSVPs** (if published)
  - **Edit** and **Continue** (if draft)
  - If published: **Open Invite** (new tab) and **Share**

**Empty State**
- If no invites exist: celebration icon, "No invites yet", **Browse Templates** button

---

**Share Dialog** (modal — opened from dashboard card)
- Full invite URL displayed
- Copy Link button (shows "Copied!" feedback for 2 seconds)
- Share on WhatsApp (opens WhatsApp with pre-filled message including event details and link)
- Share via Email (opens email client with pre-filled subject and body)
- Open Invite (new tab)
- QR Code — scannable QR linking to the invite, with the slug label below

**Delete Confirmation Dialog** (modal)
- Warning: "This will permanently delete this invitation and all its RSVPs. This action cannot be undone."
- Cancel and **Delete** (red) buttons

---

## 6. Invite Builder — Creating & Editing Invitations

**URL**: `/create/:inviteId` (new) or `/dashboard/invites/:inviteId/edit` (edit)

The full-featured invite editor, available after purchase. All changes autosave continuously.

**Layout**
- Left column: form steps with all input fields
- Right column: live preview panel + save status + completion progress
- Navbar shows "Creating: [Template Name]" or "Editing: [Template Name]" and a Dashboard link

The builder is divided into **4 steps**. Each step is validated before allowing the customer to proceed.

---

### 6.1 Step 1 — Event Details

The core event information:

- **Couple / Host Name(s)** — e.g., "Kirty & Shashwat" for weddings, or organiser name for other event types
- **Event Type** — Wedding · Engagement · Birthday · Baby Shower · Corporate · Anniversary
- **Event Date** — date picker (must be a future date for new invites; past dates allowed when editing)
- **Event Time** — time picker
- **Shareable Link / Invite Slug** — a custom URL path the customer chooses (e.g., `invitesbyshyara.com/i/kirty-and-shashwat`). The builder:
  - Auto-suggests a slug based on the names and event type
  - Checks availability in real time
  - Shows a preview of the full URL

---

### 6.2 Step 2 — Venue & Story

**Venue section** (togglable on/off)
- Venue Name
- Venue Address
- Optional: map/directions link (opens Google Maps for guests)

**Story / Description section** (togglable on/off)
- Text area for a personal message, couple's love story, event description, or any narrative content

**Video section** (togglable on/off)
- YouTube or Vimeo URL input
- Embedded as a "Watch Our Story" section on the live invite

**Gift Registry / Wishlist** (up to 5 entries)
- Each entry: Title (e.g., "Amazon Wishlist") + URL
- Add more button (up to 5 registries)
- Delete button for each

**Accommodations / Lodging** (up to 5 entries)
- Each entry: Name · Address · Optional Group Booking Code · Optional link · Optional description
- For multi-day events, helps guests find nearby accommodation

---

### 6.3 Step 3 — Media, Schedule & RSVP Settings

**Photo Gallery** (togglable on/off)
- Image uploader — multiple photos can be uploaded
- Gallery appears as a scrollable/swipeable section on the live invite

**Background Music** (togglable on/off)
- URL input for a music track
- Music auto-plays on first guest interaction (tap/click) to comply with browser rules
- Guest can mute/unmute with a floating button on the live invite

**Event Schedule / Timeline** (togglable on/off)
- Timeline builder: add events with time and description
- Each entry: time + label (e.g., "6:00 PM — Ceremony Begins")
- Add more / delete entries

**RSVP Settings** (togglable on/off)
- RSVP Deadline — date picker (must be before the event date)
- Meal Options — customisable meal choices guests can select when they RSVP (e.g., "Vegetarian", "Non-Veg", "Vegan")
- If RSVP is toggled off, the RSVP form is hidden from guests

---

### 6.4 Step 4 — Review & Publish

The final step shows a summary of the invite before publishing.

**Publish Readiness Checklist** (3 checks)
1. Required details added — shows count of completed required fields
2. Shareable link selected — shows the chosen URL or a reminder to set one
3. Sections configured — shows how many optional sections are enabled

**Save Draft** — saves without making the invite publicly visible

**Publish** — makes the invite live at the chosen URL. Shows a confirmation dialog before publishing.

**Publish Confirmation Dialog**
- Displays the same 3 readiness checks with current status
- Cancel and **Publish** buttons

After first publish: customer is taken to the **Publish Success** page.

---

### 6.5 Autosave

- All field changes are automatically saved with a short delay (~1.2 seconds after the last keystroke)
- Save status badge in the preview panel shows:
  - "Saving changes..." — while saving
  - "Saved [time]" — when last saved successfully (e.g., "Saved 2 minutes ago")
  - "Autosave failed" — if save fails (e.g., network error), shown in red
  - "Unsaved changes" — if there are pending changes not yet saved

---

### 6.6 Live Preview Panel (right column)

- **Mobile / Desktop toggle** — switch between phone mockup and full-width preview
- **Mobile view** — template rendered inside a phone mockup frame, scrollable
- **Desktop view** — template rendered full-width in a scrollable container
- Preview updates in near-real time as the customer fills in fields (short debounce of ~300ms)
- **Completion progress** — shows a percentage and "Required details added: X of Y ready"

---

## 7. The Live Invite — Guest Experience

**URL**: `/i/:slug`

The page guests open when they receive the invite link. No account is required; guests just open the link.

**Opening Animation**
- Each template has an animated cover/intro screen that guests interact with (tap or click to open)
- Opening reveals the full invitation with a smooth animation

**Invite Content (customer-configured sections)**
Every section below is individually togglable by the organiser in the builder.

| Section | What guests see |
|---------|----------------|
| **Story** | Text written by the organiser — love story, event description, personal message |
| **Photo Gallery** | Swipeable/scrollable photos uploaded by the organiser |
| **Video** | Embedded "Watch Our Story" video (YouTube or Vimeo) |
| **Schedule / Timeline** | Day-of timeline with times and event descriptions |
| **Venue** | Venue name and address |
| **RSVP Form** | Guest response form (see Section 8) |
| **Gift Registry** | Clickable links to gift registries or wishlists |
| **Accommodations** | Nearby lodging options with names, addresses, booking codes |

**Fixed Action Buttons** (always visible at the bottom)
- **Add to Calendar** — opens the device's calendar app with all event details pre-filled (title, date, time, location, description)
- **Get Directions** — opens Google Maps with the venue address
- **Music Toggle** (if music is enabled) — mute/unmute the background music; shows 🎵 when playing, 🔇 when muted

**Post-Event Mode**
If the organiser has enabled post-event mode:
- RSVP form is hidden
- A "Thank You" message is displayed instead
- All other event details remain visible

---

**Error States for Guests**

| Situation | What guests see |
|-----------|----------------|
| Invalid or deleted invite link | "Invitation Not Found" with explanation |
| Invite taken down by organiser | "This Invitation Is No Longer Available" |
| Template issue | "Template Unavailable — please contact the host" |

---

## 8. RSVP Form — Guest Submission

Embedded inside the live invite's RSVP section.

**Fields**

| Field | Type | Required? | Notes |
|-------|------|-----------|-------|
| Your Name | Text | Yes | Required to submit |
| Email Address | Email | No | Optional |
| Response | Toggle buttons | Yes | Attending / Regret / Maybe |
| Number of Guests | Number | Conditional | Only shown when "Attending" is selected; max 10 |
| Meal Preference | Dropdown | No | Only shown if organiser configured meal options |
| Message | Text area | No | Optional personal note to the organiser |
| Dietary Restrictions | Text area | No | Optional |

**Submit**
- "Send RSVP" button (disabled if name is empty)
- Changes to "Sending..." while submitting
- Spam protection: hidden honeypot field to block bots

**Success State** (after submission)
- Party emoji
- "Thank You!" heading
- Personalised message based on response:
  - Attending: "We're thrilled you'll be joining us!"
  - Maybe: "We hope you can make it!"
  - Regret: "We'll miss you! Thanks for letting us know."

**RSVP Closed State**
If the RSVP deadline has passed:
- Lock icon
- "RSVPs Closed" heading
- "The RSVP deadline for this event has passed. Please contact the organiser directly."

**Error State**
If submission fails (e.g., network issue), an error message is shown and the form remains filled so the guest can retry.

---

## 9. RSVP Management — Organiser View

**URL**: `/dashboard/invites/:inviteId/rsvps`

The organiser's real-time view of all guest responses.

**Header**
- Event title
- Subtitle: "Review guest responses, messages, and headcount in one place"
- **Open Live Invite** button (only if published, opens in new tab)
- **Export CSV** button — downloads all RSVP data as a spreadsheet

**CSV Export columns**: Name · Response · Guests · Message · Date

---

**Statistics Cards** (5 cards)

| Card | Shows |
|------|-------|
| Total | Total number of RSVP submissions |
| Attending | Count of "Attending" responses |
| Not Attending | Count of "Regret" responses |
| Maybe | Count of "Maybe" responses |
| Guests | Total headcount from all "Attending" responses |

---

**Filter Bar**
- Search: "Search by guest name..."
- Response filter buttons: All · Attending · Not Attending · Maybe

**RSVP List**

On mobile — card layout per guest:
- Guest name (large) and submission date
- Response badge (colour-coded)
- Guest count: "Guests: X"
- Message (if provided)

On desktop — table layout:
- Columns: Name · Response (badge) · Guests · Message · Date
- Messages truncated; full message readable on hover or tap

**Empty States**
- "No RSVPs yet" with "Share your invite link to start receiving responses"
- "No matching results" (if search/filter applied) with "Try a different search or filter"

---

## 10. Sharing Tools

Sharing tools appear in three places: the Dashboard invite card, the Publish Success page, and the RSVP management page.

**Share Methods**

| Method | What it does |
|--------|-------------|
| **Copy Link** | Copies the full invite URL; button shows "Copied!" for 2 seconds |
| **WhatsApp** | Opens WhatsApp with a pre-written message including event details and invite link |
| **Email** | Opens the device's email client with pre-filled subject "You're Invited" and a message containing event info and link |
| **Open Invite** | Opens the live invite in a new browser tab |

**Share Message Content** (auto-generated)
- Organiser/couple names
- Event type (wedding, birthday, etc.)
- Event date and location
- Direct link to the invite
- Formatted naturally for chat and email contexts

**QR Code**
- Displayed on: Publish Success page · Dashboard share dialog
- Scannable QR code linking directly to the invite URL
- Slug label shown below the QR code
- Can be screenshotted and shared physically or digitally

---

## 11. Account Settings

**URL**: `/account`

**Profile Section**
- Full Name (editable)
- Email (read-only — cannot be changed; labelled "Email cannot be changed")
- Phone Number (editable)
- Profile Photo: circular avatar (shows first initial if no photo uploaded). "Upload Photo" button lets the customer choose an image from their device.
- **Save Changes** button (shows "Saving..." while processing)

**Change Password**
- Current Password
- New Password (minimum 8 characters)
- Confirm New Password (must match)
- Real-time validation errors under each field
- **Update Password** button
- On success: fields are cleared and a confirmation toast is shown

**Notification Preferences**
- "Email on new RSVP" toggle — receive an email each time a guest submits a response
- "Weekly summary" toggle — receive a weekly digest of invite activity
- These preferences are saved on the device

**Danger Zone**
- Section with a red border at the bottom of the page
- Warning: "Permanently delete your account and all associated data. This action cannot be undone."
- **Delete Account** button (red)

**Delete Account Confirmation Dialog**
- Emphasises that deletion is permanent and all data will be lost
- Cancel and **"Yes, Delete Everything"** (red) buttons
- On confirmation: account deleted, customer logged out, redirected to home page, success toast shown

---

## 12. Emails Sent to Customers & Guests

The platform sends the following emails automatically:

| Email | When it's sent | Recipient |
|-------|---------------|-----------|
| **Welcome Email** | When a new account is created | Customer |
| **OTP / Verification Code** | When password reset is requested | Customer |
| **RSVP Confirmation** | When a guest submits an RSVP | Guest |
| **RSVP Notification** | When a guest submits an RSVP | Customer (organiser) |
| **Invite Published** | When the customer publishes their invite | Customer |
| **RSVP Deadline Reminder** | Before the RSVP deadline approaches | Customer |
| **Post-Event / Thank You** | After the event date passes | Customer |
| **Order Confirmation** | Immediately after successful payment | Customer |
| **Payment Failed** | If a payment attempt fails | Customer |
| **Announcement** | Platform announcements (when applicable) | Customer |

**RSVP Notification email** (sent to organiser) includes:
- Guest name
- Response (Attending / Regret / Maybe)
- Guest count (if attending)
- Guest message (if provided)
- Link back to the RSVP management dashboard

**Order Confirmation email** includes:
- Template name and price paid
- Link to begin building the invite
- Payment reference

---

## 13. Pricing Model

| | Detail |
|--|--------|
| **Model** | One-time payment per template |
| **Price** | $99 USD or €119 EUR |
| **What's included** | Full preview before purchase · Premium animated template · Personalised invite link · Opening animations · Photo gallery & story section · Full RSVP tracking dashboard · Mobile-optimised shareable link · Unlimited sharing · Unlimited edits after purchase |
| **Subscriptions** | None — one payment, no recurring charges |
| **Promo codes** | Supported at checkout — percentage or flat discounts |
| **Payment methods** | Cards and UPI via Razorpay |
| **Number of templates** | Purchase as many templates as needed; each is a separate one-time payment |
| **Post-purchase editing** | Unlimited — invite can be updated at any time after publishing |

---

## 14. Navigation & Global UI

### Navbar (appears on all pages)

**Logo** — "Shyara" with heart icon; clicking goes to the home page

**Desktop navigation links** (hidden on mobile, shown in hamburger menu):
- Templates
- How It Works
- Live Sample
- Pricing
- FAQ
- Dashboard (if logged in)

**Right side of navbar:**
- **Theme Toggle** — switch between light and dark mode
- **Currency Selector** — USD ($99) or EUR (€119); updates all displayed prices site-wide
- If **not logged in**: Log In link · "Start Exploring" button
- If **logged in**: Account button · Dashboard button · Log Out button

**Scroll behaviour**
- Navbar becomes more opaque and gains a shadow when the page is scrolled down

---

### Theme Support

- **Light Mode and Dark Mode** — toggled from the navbar; preference persisted across sessions
- All pages, cards, forms, and the invite builder fully support both modes

### Currency Selection

- Toggle between **USD** and **EUR** in the navbar
- All prices on the site (gallery, preview, pricing, checkout) update to the selected currency
- Selected currency is remembered across the session

---

## 15. Mobile Experience

Every page and feature is fully responsive and touch-friendly.

**Navigation**
- Desktop navbar collapses into a hamburger menu on mobile
- Menu opens as a vertical list with touch-friendly targets
- Currency and theme toggles accessible within the mobile menu

**Template Gallery**
- Grid adjusts to 1 or 2 columns on small screens
- Filter bar and sort controls reflow for small screens
- Quick preview, preview, and buy buttons remain fully accessible

**Invite Builder**
- Form and preview stack vertically (form first, preview below)
- Mobile preview via phone mockup sheet; desktop preview via full-width panel
- All inputs are large and easy to tap

**Live Invite**
- Designed primarily for mobile — all templates are mobile-first
- Floating action buttons (calendar, directions, music) positioned at the bottom of the screen
- Gallery is swipeable
- RSVP form fully touch-friendly

**RSVP Management**
- Card-based layout on mobile (table on desktop)
- Stats cards stack to a 2-column grid

**Dashboard**
- Invite cards stack to a single column
- All action buttons remain fully accessible

**Share & QR**
- WhatsApp sharing uses the native mobile WhatsApp app
- QR code is easily scannable on physical printouts

---

*Last updated: March 2026 | Invites by Shyara*
