// Entry point for the bundled iOS build (Capacitor).
//
// The website mounts App.jsx through Next.js (src/app/AppClient.jsx). The iOS
// app has no Next.js server, so this file mounts the same App.jsx into a plain
// HTML shell. Vite (vite.config.mobile.js) bundles this into cap-shell/, which
// Capacitor ships inside the native app as local files. See IOS_PLAN.md #5.
import { createRoot } from 'react-dom/client'
import '../src/styles/index.css'
import App from '../src/App.jsx'
import { Purchases } from '@revenuecat/purchases-capacitor'
import { setRevenueCatSDK, initRevenueCat } from '../src/utils/revenuecat.js'

// Static import avoids a dynamic import at runtime — WKWebView + capacitor://
// scheme hangs on dynamic chunk fetches. Inject the SDK before init.
setRevenueCatSDK(Purchases)

createRoot(document.getElementById('root')).render(<App />)

initRevenueCat().catch(() => {})
