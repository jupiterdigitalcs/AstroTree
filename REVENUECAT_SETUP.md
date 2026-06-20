# RevenueCat / IAP Setup — AstroDig iOS

The code is done. This is the account/dashboard side. Do it in order — Apple's
agreements step can take a day to clear, so start there.

Two identifiers the code expects EXACTLY (don't rename):
- Entitlement id: **`celestial`**
- Product id: **`celestial_unlock`** ($9.99, non-consumable)

---

## 1. App Store Connect — agreements + the product

1. **Paid Apps agreement + banking + tax.** App Store Connect → Business →
   Agreements, Tax, and Banking. Sign the Paid Applications agreement and fill
   banking + tax. **Nothing IAP works until this is "Active."** (Can take a day.)

2. **Create the In-App Purchase.** Your app → In-App Purchases → (+):
   - Type: **Non-Consumable**
   - Reference Name: `Celestial Unlock`
   - Product ID: **`celestial_unlock`**  ← must match
   - Price: **$9.99**
   - Add a localization: Display Name `Celestial`, a short description.
   - Add the review screenshot + review notes (required, reviewed with the app).
   - Save. Status will sit at "Ready to Submit" — it's reviewed alongside the
     app's first submission. That's expected.

3. **In-App Purchase Key (for RevenueCat receipt validation).**
   Users and Access → Integrations → In-App Purchase → generate a key →
   download the **`.p8`** file. Note the Key ID and your Issuer ID.
   → This file goes into RevenueCat (step 2 below), NOT into our code.

---

## 2. RevenueCat dashboard (free account at revenuecat.com)

1. Create a **Project**: "AstroDig".
2. **Add app** → Apple App Store → bundle ID **`com.jupiterdigital.astrodigios`**.
   Upload the `.p8` In-App Purchase Key + Key ID + Issuer ID from Apple step 3.
3. **Products** → add product, App Store product ID **`celestial_unlock`**.
4. **Entitlements** → new entitlement, identifier **`celestial`** → attach the
   `celestial_unlock` product.  ← identifier must be exactly `celestial`.
5. **Offerings** → create an offering, mark it **Current**, add a Package that
   contains the product. (The app reads the current offering's first package.)
6. **API key** → Project Settings → API Keys → copy the **Apple public SDK key**
   (starts with `appl_`). ← this is a CLIENT key (step 3 below).
7. **Webhook** → Project Settings → Integrations → Webhooks → Add:
   - URL: `https://astrodig.com/api/revenuecat-webhook`
   - Authorization header: invent a long random secret string, paste it here.
     ← the SAME string goes in Vercel (step 3 below).

---

## 3. The two keys — where each goes

| Key | Value | Where it goes | Why it's safe there |
|---|---|---|---|
| RevenueCat **public SDK key** (`appl_...`) | from RC step 6 | repo root **`.env`** as `NEXT_PUBLIC_REVENUECAT_IOS_KEY=appl_xxx`, then rebuild | Public client key, baked into the local mobile bundle (like the Supabase anon key). NOT secret. |
| **Webhook secret** (you invent it) | the string from RC step 7 | **Vercel** env var `REVENUECAT_WEBHOOK_AUTH` (Production) | Server-only; the webhook route rejects any call whose Authorization header doesn't match. |

- The mobile build reads `.env` locally on your Mac at `npm run build:mobile` —
  this key is NOT set in Vercel.
- After adding `REVENUECAT_WEBHOOK_AUTH` in Vercel, redeploy the site so the
  route picks it up.

---

## 4. Xcode + rebuild

1. Rebuild and sync the native project:  `npm run ios:sync`
   (this is `build:mobile` + `cap sync ios`; RevenueCat's native package links
   automatically.)
2. `npx cap open ios` → App target → Signing & Capabilities →
   **+ Capability → In-App Purchase**. (StoreKit needs this.)
   - Signing Team is already the paid org (XTC2NB6CTW).

---

## 5. Test before submitting

1. App Store Connect → Users and Access → Sandbox → add a **Sandbox tester**
   (use an email you don't already use for Apple).
2. Run the app on your iPhone from Xcode. Open the upgrade prompt → tap
   **Unlock Celestial**. A sandbox StoreKit sheet appears (free — no real charge).
   Sign in with the sandbox tester when prompted.
3. Confirm: Celestial unlocks in the app, and the `devices` row's `tier` flips to
   `premium` (check Supabase / Vercel function logs for `[rc] NON_RENEWING_PURCHASE`).
4. Test **Restore purchase** after deleting + reinstalling the app.

---

## Notes
- "Buy on web → unlock on phone" already works: both webhooks write the same
  `devices.tier` / `user_profiles.tier`, keyed by deviceId/auth_user_id.
- Sign in with Apple (guideline 4.8) is SEPARATE and still pending — only needed
  if the native app keeps the Google button. Recommended: hide Google in native,
  keep email magic-link, skip Apple login. Decide before submission.
