# CLAUDE.md

## Project Overview
AstroDig — a web app that lets users map cosmic connections between people. Users add family members, friends, and coworkers, see their sun signs, and discover astrological patterns across relationships. Features tree, zodiac wheel, and constellation views. Deployed at astrodig.com via Vercel.

Built by Christina, sole developer and owner of JupiterDigital (Etsy astrology store). This project may eventually connect to or complement existing JupiterDigital products like birthday calendars.

---

## Tech Stack
- **Framework:** React 18 + Vite 6
- **Tree Visualization:** React Flow (@xyflow/react)
- **Layout:** Dagre (auto-positioning nodes)
- **Styling:** Dark celestial aesthetic — CSS custom properties in `/src/styles/base.css`, split across 15 files in `/src/styles/`
- **State:** React hooks (useTreeState, useChartManager, useExport) + localStorage for drafts
- **Backend:** Vercel serverless functions (`/api/chart.js`, `/api/device.js`, `/api/admin.js`) proxying Supabase — 3 functions with `?action=` routing
- **Database:** Supabase (Postgres) — accessed server-side only, never from client
- **Astrology:** Custom sun sign logic in `/src/utils/astrology/` — Celestine package planned for birth chart calculations
- **Code Splitting:** xyflow + dagre chunked separately; ZodiacWheel, ConstellationView, html-to-image lazy-loaded

---

## Current State
MVP 2 complete — live at astrodig.com:
- Add family members with name, birthdate, and relationships (parent/child/spouse/friend/coworker)
- Sun sign + element calculated from birthdate
- Three visualization modes: tree (React Flow), zodiac wheel, constellation (force-directed)
- Insights panel with family signature, element distribution, compatibility
- Chart save/load/rename/duplicate with cloud sync
- Shared chart links via `?view=token`
- PNG export with brand bar (all views + insights)
- Admin panel at `/admin` with server-side auth
- Email capture for cloud backup restore
- Onboarding progress stepper

---

## Rules & Preferences
- Keep components small and single-responsibility
- Don't refactor working code unless asked
- Astrology logic lives in `/src/utils/astrology/` — do not duplicate it elsewhere
- Prefer readable code over clever code — this is a solo project
- Always use named exports, not default exports, for utility functions
- When adding new features, add them in isolation before wiring into the main tree
- **Never add `VITE_` prefixed secrets** — all Supabase/admin keys stay server-side in `/api/` functions
- Environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `ADMIN_PASSWORD`) are set in Vercel dashboard, not committed to code

---

## Folder Structure
```
/api
  _lib/             # Shared server-side helpers (supabase client, admin auth)
  chart.js          # Chart CRUD (?action=save|load|list|delete|public|share|restore)
  device.js         # Device tracking (?action=register|email)
  admin.js          # Admin panel (?action=login|charts|stats|devices|trees-per-day)
/src
  /admin            # Admin panel components + utils
  /components       # UI components (AstroNode, AddMembersForm, EditMemberPanel, etc.)
  /hooks            # useTreeState, useChartManager, useExport, useCloudSync
  /styles           # 15 CSS files (base, layout, sidebar, forms, canvas, etc.)
  /utils
    /astrology      # sunSign.js, elements.js, index.js (barrel) — ready for birthChart.js
    treeHelpers.js  # Shared edge styles, buildNodeData, makeEdge
    cloudStorage.js # Client-side API calls (fetch to /api/ proxy)
    storage.js      # localStorage helpers
    layout.js       # Dagre layout algorithm
    format.js       # formatRelativeTime
    identity.js     # Device ID management
  App.jsx           # Root component (~680 lines) — layout, routing, orchestration
```

---

## What's Next
- **MVP 3:** Birth chart calculations using Celestine package — birth time + place input, planet positions, house placements, aspects between family members' charts
- Celestine drops into `/src/utils/astrology/birthChart.js`, lazy-loaded when birth chart view is active
