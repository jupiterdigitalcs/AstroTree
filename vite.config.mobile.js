import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// Bundled iOS build config — SEPARATE from vite.config.js (which is test-only)
// and from the Next.js website build. Produces a static SPA in cap-shell/ that
// Capacitor ships as local files inside the native app. See IOS_PLAN.md #5.
//
//   npm run build:mobile   -> writes cap-shell/
//   npx cap sync ios       -> copies cap-shell/ into the iOS project
//
// process.env.NEXT_PUBLIC_* reads in the client code (apiBase, supabaseClient,
// useAuth) are replaced at build time below. The website's API lives at
// astrodig.com, so the bundle defaults its API base there.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'NEXT_PUBLIC_')
  const apiBase = env.NEXT_PUBLIC_API_BASE || 'https://astrodig.com'

  return {
    root: fileURLToPath(new URL('./mobile', import.meta.url)),
    // Reuse the website's static assets (favicon, apple-touch-icon, etc.)
    publicDir: fileURLToPath(new URL('./public', import.meta.url)),
    plugins: [react()],
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.NEXT_PUBLIC_API_BASE': JSON.stringify(apiBase),
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_URL || ''),
      'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''),
      'process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID': JSON.stringify(env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''),
      // RevenueCat public Apple SDK key — client-safe, drives In-App Purchase (src/utils/revenuecat.js)
      'process.env.NEXT_PUBLIC_REVENUECAT_IOS_KEY': JSON.stringify(env.NEXT_PUBLIC_REVENUECAT_IOS_KEY || ''),
      // Google iOS OAuth client id — native Google sign-in (src/utils/nativeAuth.js)
      'process.env.NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID': JSON.stringify(env.NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID || ''),
    },
    build: {
      outDir: fileURLToPath(new URL('./cap-shell', import.meta.url)),
      emptyOutDir: true,
      modulePreload: false,
    },
  }
})
