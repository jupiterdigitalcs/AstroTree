# DECISIONS.md

A log of technical and product decisions — the *why* behind choices, so future sessions don't relitigate them.

---

## React + Vite
**Why:** Fast local dev, minimal setup, Claude Code works with it naturally. Vite's dev server is snappy. Easy Vercel deployment when ready.
**Alternatives considered:** Plain HTML/JS (too limited as app grows), Next.js (overkill until we need a backend/SSR).

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

## Custom JS sun sign logic (no API for MVP 1-2)
**Why:** Sun sign calculation is simple date logic — no external dependency needed. Faster, no API costs, no rate limits.
**When this changes:** MVP 3 — Swiss Ephemeris or AstrologyAPI.com for full chart calculations including Moon, Rising, and house placements.

---

## React state only (no persistence yet)
**Why:** Keeps MVP 1-2 simple. No backend, no auth, no database decisions to make prematurely.
**When this changes:** MVP 5 — user accounts and saved trees will require a backend. Decision not yet made on stack (likely Supabase or Firebase for a solo project).

---

## Celestial dark aesthetic (navy + gold)
**Why:** Matches the JupiterDigital brand and astrology audience expectations. Dark backgrounds make the tree nodes pop visually.
**Do not change** without a deliberate redesign decision.

---

## No mobile-first (yet)
**Why:** Tree visualization is complex on small screens. Desktop-first lets us move faster on the core experience.
**When this changes:** Post-MVP 3, once the core product is stable.
