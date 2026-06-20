# iOS Sign-In Setup — Google + Sign in with Apple

The CODE is done (June 2026). The native app shows **Sign in with Apple** and a
native **Google** sheet instead of the web GSI button (which Google blocks inside
WebViews). Both hand an idToken to Supabase's `signInWithIdToken` — the same path
the website already uses. Sign in with Apple is also required by App Review 4.8
because the app offers Google login.

Plugin: `@capgo/capacitor-social-login` (the only Capacitor-8 option; handles
both providers). Already installed and synced into the iOS project.

You need to wire up THREE dashboards + two small Xcode/Info.plist edits below.
Identifiers the code expects: bundle id **`com.jupiterdigital.astrodigios`**.

---

## 1. Google Cloud Console — iOS OAuth client

1. https://console.cloud.google.com → the project that owns your existing
   **Web** OAuth client (the one in `NEXT_PUBLIC_GOOGLE_CLIENT_ID`).
2. APIs & Services → Credentials → Create Credentials → **OAuth client ID** →
   Application type **iOS**.
3. Bundle ID: **`com.jupiterdigital.astrodigios`**. Create.
4. You now have:
   - an **iOS client ID** like `1234-abcd.apps.googleusercontent.com`
   - a **reversed client ID** like `com.googleusercontent.apps.1234-abcd`
5. Put the iOS client ID in repo **`.env.local`**:
   ```
   NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID=1234-abcd.apps.googleusercontent.com
   ```
   (The code sets the token's audience to your existing WEB client via
   iOSServerClientId, so Supabase's Google provider already trusts it — no
   Supabase change needed for Google.)

---

## 2. Apple Developer + Supabase — Sign in with Apple

**Apple Developer (capability):**
1. The App ID `com.jupiterdigital.astrodigios` needs the **Sign in with Apple**
   capability. Easiest path: add it in Xcode (step 4 below) — Xcode registers it
   on the App ID automatically.

**Supabase (verifies the Apple token):**
2. Supabase Dashboard → Authentication → Providers → **Apple** → enable.
3. In the Apple provider's **Client IDs** (authorized client IDs) field, add:
   **`com.jupiterdigital.astrodigios`**  ← the bundle id. This is what lets
   Supabase accept the native Apple identity token. (The OAuth Secret Key /
   Services ID fields are only needed for the *web* Apple flow, which we are not
   using — native token verification just needs the bundle id here.)

---

## 3. Xcode + Info.plist edits

4. `npx cap open ios` → App target → **Signing & Capabilities** →
   **+ Capability → Sign in with Apple**.
5. **Info.plist** — add the Google reversed client ID as a URL scheme so the
   native Google sheet can return to the app. Add this block (use YOUR reversed
   client ID from step 1.4):
   ```xml
   <key>CFBundleURLTypes</key>
   <array>
     <dict>
       <key>CFBundleURLSchemes</key>
       <array>
         <string>com.googleusercontent.apps.1234-abcd</string>
       </array>
     </dict>
   </array>
   ```
6. Rebuild: `npm run ios:sync`.

(AppDelegate: the Capacitor template already routes URLs through
ApplicationDelegateProxy, which @capgo/capacitor-social-login hooks into — no
AppDelegate edit needed. If Google sign-in ever returns but doesn't complete,
that's the first thing to re-check.)

---

## 4. Test on device (sandbox)

1. Run on your iPhone from Xcode.
2. Trigger the sign-in dialog (save a chart / hit the auth prompt). You should
   see **Sign in with Apple** on top and **Continue with Google** below.
3. Tap each — native sheets should appear and, on success, the dialog closes and
   the ✓ "signed in" dot shows. Confirm in Supabase → Authentication → Users.
4. Celestial bought on web (same email/account) should unlock after signing in.

---

## Code reference
- `src/utils/nativeAuth.js` — plugin init + `nativeGoogleToken()` / `nativeAppleToken()`.
- `src/hooks/useAuth.js` — `signInWithGoogleNative()` / `signInWithAppleNative()`
  (exchange token via `supabase.auth.signInWithIdToken`).
- `src/components/EmailCapture.jsx` — native branch shows Apple + Google sheets;
  web branch unchanged.
- `vite.config.mobile.js` — injects `NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID`.
