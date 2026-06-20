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

2. **Auth abstraction.** CODE DONE (June 2026). Native Google + Sign in with
   Apple via `@capgo/capacitor-social-login` (only Cap-8 option, does both).
   Both return an idToken handed to `supabase.auth.signInWithIdToken` — the SAME
   path the web GSI flow uses, so NO new /api/auth endpoint was needed. Files:
   `src/utils/nativeAuth.js`, `useAuth.js` (signInWithGoogleNative /
   signInWithAppleNative), `EmailCapture.jsx` (native branch: Apple button on top
   per 4.8, then Google; web branch untouched), `dialogs.css` (.auth-apple-btn),
   `vite.config.mobile.js` (NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID). Plugin synced into
   SPM. REMAINING (dashboards + Xcode, no code): see **IOS_AUTH_SETUP.md** —
   Google Cloud iOS client + reversed-id URL scheme in Info.plist, Supabase Apple
   provider (add bundle id), Xcode "Sign in with Apple" capability.
   NOTE: magic-link universal link (so the email opens the app vs the website)
   is still a nicety, not done — email sign-in in the app currently round-trips
   through the website redirect. Native Google/Apple are the primary paths.
4. **Platform flag + IAP entitlement path.** CODE DONE (June 18, 2026) — via
   RevenueCat (decision #3 resolved: RevenueCat over raw StoreKit). Files:
   - `src/utils/platform.js` — `isNativeApp()` (window.Capacitor or AstroDigApp UA).
   - `src/utils/revenuecat.js` — dynamic-imports `@revenuecat/purchases-capacitor`
     (v13.2.0); `purchaseCelestial()` / `restorePurchases()`; configured with
     `appUserID = deviceId` and entitlement id `celestial`. No-op off-device.
   - `mobile/entry.jsx` — calls `initRevenueCat()` on launch.
   - `UpgradePrompt.jsx` — native → RevenueCat purchase, web → Stripe (unchanged);
     "Restore purchase" link; native can buy without sign-in (binds to deviceId).
   - `src/app/api/revenuecat-webhook/route.js` — mirrors stripe-webhook: on
     NON_RENEWING_PURCHASE writes tier='premium', on CANCELLATION downgrades, to
     the SAME devices.tier + user_profiles.tier rows (app_user_id === deviceId).
     Auth via `REVENUECAT_WEBHOOK_AUTH` Authorization header (fails closed).
   - `vite.config.mobile.js` injects `NEXT_PUBLIC_REVENUECAT_IOS_KEY`.
   REMAINING (Christina's side, no code): create the App Store Connect IAP product
   `celestial_unlock` + agreements/banking/tax; set up the RevenueCat project,
   entitlement `celestial`, default Offering, webhook; add the In-App Purchase
   capability in Xcode; set the two keys (see SETUP below). Buy-on-web→unlock-on-
   phone works automatically (same tier rows); the only later nicety is pushing a
   device's tier to user_profiles on a fresh sign-in.
5. ~~**Standalone build entry.**~~ DONE (June 17, 2026). The SPA bundles via a
   dedicated Vite config, separate from the test-only vite.config.js and from
   the Next.js website build (both untouched). App.jsx had ZERO next/* imports,
   so this was clean. Files added:
   - `vite.config.mobile.js` — react plugin; replaces the client `process.env.
     NEXT_PUBLIC_*` reads (API base, Supabase URL/anon key, Google client ID)
     at build time; API base defaults to https://astrodig.com. Outputs to
     `cap-shell/` (the Capacitor webDir).
   - `mobile/index.html` — HTML shell mirroring layout.jsx <head> (fonts,
     theme-color, native-ios safe-area script, GSI preload).
   - `mobile/entry.jsx` — mounts App.jsx into #root.
   - scripts: `npm run build:mobile` (build only), `npm run ios:sync`
     (build:mobile + `npx cap sync ios`).
   Verified: builds 405 modules, code-splitting preserved, assets at /assets/*
   (Capacitor serves these from root), favicon/apple-touch-icon copied from
   public/, vitest unaffected.
   TO ACTUALLY USE THE BUNDLE (submission path, not yet done): remove the
   `server` block from capacitor.config.json so the app loads cap-shell locally
   instead of https://astrodig.com, then `npm run ios:sync`. Left as-is for now
   so the remote-URL feel-test still works.
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
- [x] Bundle ID (June 17, 2026): **com.jupiterdigital.astrodigios**.
      GOTCHA: the original `com.jupiterdigital.astrodig` got auto-claimed by
      Christina's PERSONAL Apple ID (free team YY2KT96S7D) during the earlier
      on-device test build, and free accounts can't delete identifiers via the
      portal — so it's stuck on the personal account. Switched to `...astrodigios`
      everywhere (capacitor.config.json root + ios/App/App/, project.pbxproj x2).
      Lesson: set the paid-org Team in Xcode BEFORE the first build next time.
      The Xcode project still has DEVELOPMENT_TEAM = YY2KT96S7D (personal) —
      must be switched to the paid org team in Signing & Capabilities.
- [x] App record created in App Store Connect (June 17, 2026): name "AstroDig"
      reserved, tied to com.jupiterdigital.astrodigios. Status: Prepare for
      Submission (nothing submitted yet).
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

STATUS (June 10, 2026, overnight session): all the Capacitor-side work is DONE.
- Capacitor 8.4.0 installed; `capacitor.config.json` at repo root with
  `server.url = "https://astrodig.com"` (feel-test only, not App Store
  compliant — the bundled Vite build, refactor #5, is the real path later).
- `ios/` project scaffolded with `--packagemanager SPM` (no CocoaPods on this
  Mac, and SPM avoids needing it at all). `cap-shell/` is a placeholder webDir,
  unused at runtime while server.url is set.
- Info.plist locked to `UIUserInterfaceStyle = Dark` (app is dark-only).
- BLOCKER FOUND: the Mac was on macOS 14.2, which caps Xcode at 15.x — too old
  to deploy to a 2026 iPhone and below Capacitor 8's minimum. Xcode 15.4 did
  finish downloading from the App Store that night (it auto-became the active
  toolchain; license unaccepted). Fix: upgrade to macOS Tahoe 26.5.1 (Software
  Update offers it; M2 Air supports it), THEN update Xcode in the App Store.

Remaining steps (need Xcode + Christina present, ~morning after OS upgrade):
1. App Store > Xcode > Update (15.4 -> current; post-upgrade it will offer it).
   Open it once: accept license, let it install the iOS platform component.
2. Xcode > Settings > Accounts > add Apple ID (free ID can sideload 7-day
   builds to her own phone; TestFlight proper needs the paid program).
3. iPhone over cable: Trust This Computer, then enable Developer Mode
   (Settings > Privacy & Security > Developer Mode, phone reboots).
4. `npx cap open ios`, set the signing Team on the App target, select her
   iPhone, Run.

Expected broken-in-test-build (do NOT debug these, they're known pending work):
- Google sign-in (blocked in WebViews — refactor #2)
- Stripe checkout opens inside the WebView (IAP replaces it — refactor #4)
What should already feel right: canvas views, animations, bottom sheets,
safe areas, swipes, the DIG, share sheet (navigator.share works in WKWebView).

Codebase facts the next session needs: apiUrl() in src/utils/apiBase.js
(NEXT_PUBLIC_API_BASE env), kv adapter in src/utils/kvStore.js, all context in
this file + CLAUDE.md. Dev server runs on port 3001 via `npm run dev` (a
long-running one often already sits on 3000).