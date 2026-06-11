# iOS App Plan

Status: pre-work done, tech DECIDED June 2026: **Capacitor wrap** of the existing
app, with a local test build on Christina's phone as the first milestone before
committing further. Refactors 1 (API base URL) and 3 (kv storage adapter) are
DONE — the codebase no longer assumes same-origin APIs or raw localStorage.
Christina is enrolling in the Apple Developer Program.

## Why Capacitor (decision record, June 2026)
- AstroDig is custom canvas UI (React Flow tree, SVG wheel, constellation, DIG),
  not native-list UI — the usual WebView "jank" (faked native scroll/transitions)
  mostly doesn't apply. Risk areas to test on device: edit-panel keyboard
  behavior, insights scroll feel.
- Solo maintainer: native Swift means every feature ships twice forever; the
  web codebase is where all velocity is.
- Industry norm: existing-web-product teams wrap; mobile-first funded teams use
  React Native/Flutter; full Swift is for teams with dedicated iOS engineers.
- Checkpoint, not forever-commitment: see "Switching to native later" below.

## Switching to native Swift later (Christina asked)
YES — painless from the store side. The App Store identity is the app record +
bundle ID in App Store Connect, not the technology. A Swift rewrite shipped
under the same bundle ID goes through normal review and arrives on users'
phones as a regular update. Keeps: name, reviews, rankings, IAP products,
subscribers/purchasers. No re-registration of anything.
One real caveat: WKWebView localStorage data (drafts, device ID) would not carry
into a native rewrite automatically — keep entitlements and charts account-bound
(they already are) and nudge sign-in, so an update can never strand anyone's data.

## Remaining refactors (do when the iOS build starts)

2. **Auth abstraction.** Google blocks OAuth inside embedded WebViews
   (disallowed_useragent), so the GSI button cannot work in a wrapper as-is.
   Extract "sign in with Google" from useAuth/EmailCapture into one provider
   module; the iOS build swaps in a native plugin or ASWebAuthenticationSession
   producing the same credential /api/auth/gsi already accepts. Magic links
   need a universal link so the email opens the app.
   ALSO REQUIRED: **Sign in with Apple** — App Review guideline 4.8 mandates it
   for any app offering third-party login. Supabase supports the Apple provider;
   /api/auth needs a matching endpoint.
4. **Platform flag + IAP entitlement path.** `isNativeApp()` helper; upgrade
   prompt shows In-App Purchase on iOS (Stripe checkout is not allowed for
   digital unlocks there) and Stripe on web. New server path (RevenueCat
   webhook or /api/iap receipt verification) writing the same tier fields the
   Stripe webhook writes — buy anywhere, unlocked everywhere.
5. **Standalone build entry.** Bundle the SPA (App.jsx barely touches Next.js)
   via a small Vite entry so the shell ships local files (App Review dislikes
   pure remote-URL wrappers). Website stays on Next.js untouched.
   Set NEXT_PUBLIC_API_BASE=https://astrodig.com in that build.
6. **Deep links.** Universal links for /view/[token] (shared charts open the
   app) and checkout/auth return URLs.

## Later, once shipped
- Push notifications — The Current is the use case ("a rare transit is hitting
  your family this week"); retention engine the website can't have.
- Home-screen widget: tonight's moon / next family birthday.
- Android (Google Play $25 one-time) if iOS proves out.

## Costs
- Apple Developer Program: $99/year (required to publish ANY app, regardless of tech).
- Apple commission on IAP: 15% under the Small Business Program (<$1M/yr) —
  $9.99 unlock nets ~$8.49 vs ~$9.40 via Stripe on web.
- RevenueCat (optional IAP management): free below $2.5k/month tracked revenue.
- Capacitor itself: free, open source.

## Pre-work checklist (no code required)
- [ ] Enroll in Apple Developer Program. DECISION: enroll as individual (seller
      shows "Christina Soll") or as Jupiter Digital LLC (needs a free D-U-N-S
      number, takes days to verify; seller shows "Jupiter Digital LLC" — more
      professional, recommended).
- [ ] Reserve the app name in App Store Connect once enrolled — "AstroDig" had
      no conflicts on the App Store as of June 2026 (names are first-come,
      first-served at registration).
- [ ] Pick bundle ID (e.g. com.jupiterdigital.astrodig).
- [ ] Public privacy policy URL (App Store requires one — the About panel's
      privacy section needs a real page, e.g. astrodig.com/privacy).
- [ ] App Privacy "nutrition label" answers: device IDs, email (optional),
      analytics — list what's collected and why.
- [ ] Banking + tax forms in App Store Connect (required before paid IAP).
- [ ] Marketing assets: app icon (1024px), screenshots per device size (Canva).
- [ ] Support URL (astrodig.com/faq works).

## Decisions to make
1. ~~Tech: Capacitor vs native Swift~~ — DECIDED: Capacitor (see decision record above).
2. Individual vs LLC developer account (above) — Christina handling enrollment.
3. RevenueCat vs raw StoreKit for IAP.
4. iPhone-only at launch vs iPad too (iPhone-only recommended initially).
5. Minimum iOS version (iOS 16+ reasonable in 2026).
6. Whether web Celestial purchasers get iOS unlocked via sign-in (yes —
   entitlements are account-bound already; just confirm the flow).


## NEXT SESSION HANDOFF — build the local test version
Goal: AstroDig running on Christina's iPhone (or simulator) so she can judge
the feel with her thumbs. This is a TEST build, not a submission.

Fastest path (recommended for this milestone):
1. Prereq: Xcode installed from the Mac App Store (large download — start it
   first), plus `xcode-select --install` for CLI tools.
2. `npm i -D @capacitor/core @capacitor/cli @capacitor/ios` then `npx cap init`
   (app name "AstroDig", bundle id com.jupiterdigital.astrodig — keep this id,
   it's permanent) and `npx cap add ios`.
3. For the first feel-test ONLY: set `server.url = "https://astrodig.com"` in
   capacitor.config — zero build changes, app loads production in the native
   shell. (Not App Store compliant; the bundled Vite build — refactor #5 — is
   the real path later.)
4. `npx cap open ios`, select her iPhone as target, run. A free Apple ID can
   sideload to her own device (7-day cert); TestFlight needs the paid account.

Expected broken-in-test-build (do NOT debug these, they're known pending work):
- Google sign-in (blocked in WebViews — refactor #2)
- Stripe checkout opens inside the WebView (IAP replaces it — refactor #4)
What should already feel right: canvas views, animations, bottom sheets,
safe areas, swipes, the DIG, share sheet (navigator.share works in WKWebView).

Codebase facts the next session needs: apiUrl() in src/utils/apiBase.js
(NEXT_PUBLIC_API_BASE env), kv adapter in src/utils/kvStore.js, all context in
this file + CLAUDE.md. Dev server runs on port 3001 via `npm run dev` (a
long-running one often already sits on 3000).