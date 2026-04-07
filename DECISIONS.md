# DECISIONS.md

A log of technical and product decisions — the *why* behind choices, so future sessions don't relitigate them.

---

## Next.js App Router (migrated from Vite SPA — April 2026)
**Why:** The app outgrew the client-side SPA architecture. Upcoming features (birth time reconciliation, transit calculations) need server-side computation. Ad-hoc routing via `window.location.pathname` and query params was getting fragile. Admin code was shipping in the same bundle as the main app. Next.js gives us file-based routing, server components for heavy computation, automatic code splitting per route, and server-rendered SEO metadata — all on the same Vercel deployment.
**What changed:** React 18 → 19, Vite → Next.js 16 (Turbopack), `index.html` + `main.jsx` → `src/app/layout.jsx` + `src/app/page.jsx`, Vercel serverless functions → Next.js route handlers in `src/app/api/`.
**What stayed:** All React components, hooks, CSS, Supabase, localStorage patterns. The existing App.jsx renders client-side via `dynamic(..., { ssr: false })`.
**Alternatives considered:** Staying with Vite + adding a router (doesn't solve server computation), Remix (less Vercel-native), Astro (better for content sites, not interactive apps).

### Previous: React + Vite (MVP 1–2)
Fast local dev, minimal setup. Outgrown once server-side computation and proper routing became necessary.

---

## React Flow for tree visualization
**Why:** Handles node/edge rendering and interaction well out of the box. Good documentation. Avoids building a custom canvas from scratch.
**Alternatives considered:** D3 (more powerful but much more code to write and maintain for this use case).

---

## Dagre for layout
**Why:** Auto-positions nodes in a tree/DAG layout. Pairs cleanly with React Flow. No manual coordinate math.

---

## Sun sign from birthdate only (MVP 1-2)
**Why:** Most people don't know their relatives' birth times. Starting with sun sign only removes friction and lets us validate the core concept before adding complexity.
**When this changes:** MVP 3 — expand form to collect birth time + place, integrate a chart API.

---

## Celestine for astrology calculations
**Why:** Started with custom date-range logic for sun signs (MVP 1–2). Now using the Celestine package for ephemeris calculations — gives us Moon, Mercury, Venus, Mars signs plus ingress warnings from birth date/time. Runs client-side currently; will move to server-side (Next.js server actions or API routes) for heavier features like transit calculations.
**When this changes:** Birth time reconciliation and transits will require server-side computation to avoid blocking the UI thread.

---

## Supabase for persistence (device-based, no user accounts)
**Why:** Supabase gives us Postgres + RPC functions with minimal setup. All access is server-side through API routes — no Supabase keys exposed to the client. Device IDs (localStorage UUIDs) serve as the identity model instead of user accounts.
**When this changes:** User accounts would unlock multi-device sync and per-user billing, but device-based auth is good enough for now.

---

## Celestial dark aesthetic (navy + gold)
**Why:** Matches the JupiterDigital brand and astrology audience expectations. Dark backgrounds make the tree nodes pop visually.
**Do not change** without a deliberate redesign decision.

---

## No mobile-first (yet)
**Why:** Tree visualization is complex on small screens. Desktop-first lets us move faster on the core experience.
**When this changes:** Post-MVP 3, once the core product is stable.
