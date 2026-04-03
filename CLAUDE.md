# CLAUDE.md

## Project Overview
AstroDig — a web app that lets users map cosmic connections between people. Users add family members, friends, and coworkers, see their sun signs, and discover astrological patterns across relationships. Features tree, zodiac wheel, and constellation views.

Built by Christina, sole developer and owner of JupiterDigital (Etsy astrology store). This project may eventually connect to or complement existing JupiterDigital products like birthday calendars.

---

## Tech Stack
- **Framework:** React + Vite
- **Tree Visualization:** React Flow
- **Layout:** Dagre (auto-positioning nodes)
- **Styling:** Dark celestial aesthetic — deep navy background, gold accents
- **State:** React state only (no backend yet)
- **Astrology Calculations:** Custom JS logic for sun sign from birthdate (no API needed for MVP 1-2)

---

## Current State
MVP 1 is complete and running locally:
- Add family member form (name, birthdate, role)
- Sun sign calculated from birthdate
- Visual tree with React Flow showing name, role, sun sign + emoji
- Dark celestial styling

---

## Rules & Preferences
- Keep components small and single-responsibility
- No backend until explicitly planned — use React state, then local storage, then a real backend
- Don't refactor working code unless asked
- Sun sign logic lives in `/src/utils/astrology.js` — do not duplicate it elsewhere
- Prefer readable code over clever code — this is a solo project
- Always use named exports, not default exports, for utility functions
- When adding new features, add them in isolation before wiring into the main tree

---

## Folder Structure
```
/src
  /components     # UI components (TreeNode, AddMemberForm, etc.)
  /utils          # astrology.js and other pure logic
  /hooks          # custom React hooks if needed
  /styles         # global styles
```

---

## What This Is Not (Yet)
- No birth time or place input yet (coming in MVP 3)
- No chart calculation API yet
- No user accounts or data persistence yet
- No mobile app — web only for now
