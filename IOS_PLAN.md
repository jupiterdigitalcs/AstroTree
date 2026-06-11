# iOS App Plan

Status: pre-work. Refactors 1 (API base URL) and 3 (kv storage adapter) are DONE
(June 2026) — the codebase no longer assumes same-origin APIs or raw localStorage.
Tech approach (Capacitor wrap vs native Swift) not yet decided — see Decisions.

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
1. **Tech: Capacitor wrap vs native Swift vs React Native** (see discussion
   June 2026; recommendation was Capacitor — one codebase, ~95% reuse — but
   Christina wants to weigh "real" native).
2. Individual vs LLC developer account (above).
3. RevenueCat vs raw StoreKit for IAP.
4. iPhone-only at launch vs iPad too (iPhone-only recommended initially).
5. Minimum iOS version (iOS 16+ reasonable in 2026).
6. Whether web Celestial purchasers get iOS unlocked via sign-in (yes —
   entitlements are account-bound already; just confirm the flow).
