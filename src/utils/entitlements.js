// Client-side entitlement checking.
// Entitlements are fetched once per session from the server and cached in memory.

let _cached = null

export function getCachedEntitlements() {
  return _cached
}

export function setCachedEntitlements(ent) {
  _cached = ent
}

// Default gated feature list — used when the server config is missing,
// empty, or hasn't loaded yet. The system FAILS CLOSED: celestial features
// are always gated unless an admin has explicitly turned the paywall off
// via paywall_enabled: false in paywall_config. Without this default, a
// missing config row meant free users could access everything.
const DEFAULT_GATED_FEATURES = [
  'zodiac_view',
  'tables_view',
  'constellation_view',
  'advanced_insights',
  'full_dig',
  'full_compatibility',
  'zodiac_export',
  'pdf_export',
  'unlimited_charts',
]

// Is the paywall in effect? True unless an admin explicitly disabled it.
// (Old behavior was the inverse — required explicit paywall_enabled: true,
// which silently broke gating any time the config row wasn't loaded.)
export function isPaywallEnabled(config) {
  return config?.paywall_enabled !== false
}

// Is a specific feature gated (requires premium)?
export function isFeatureGated(featureKey, config) {
  if (!isPaywallEnabled(config)) return false
  // Use server-configured list if present and non-empty, otherwise the baked-in default.
  const serverList = config?.gated_features
  const gated = Array.isArray(serverList) && serverList.length > 0 ? serverList : DEFAULT_GATED_FEATURES
  return gated.includes(featureKey)
}

// Can this device access a feature? (not gated, or gated + premium tier)
export function canAccess(featureKey, tier, config) {
  if (!isFeatureGated(featureKey, config)) return true
  return tier === 'premium'
}

// Get chart limit for the given tier
export function getChartLimit(tier, config) {
  if (!isPaywallEnabled(config)) return Infinity
  if (tier === 'premium') return config?.chart_limit_premium ?? 50
  return config?.chart_limit_free ?? 3
}

// Well-known gatable feature keys (used in admin panel checkboxes)
// Grouped by category for the admin UI
export const FEATURE_KEYS = [
  // Views
  { key: 'zodiac_view',        label: 'Zodiac Wheel View', group: 'Views' },
  { key: 'tables_view',        label: 'Tables View — sortable planet grid + aspects', group: 'Views' },
  { key: 'constellation_view', label: 'Constellation View', group: 'Views' },
  // Insights
  { key: 'advanced_insights',  label: 'Celestial Insights — Notable Bonds, Venus/Mars, Partner Compatibility, Sign Threads, Zodiac Threads, Family Roles, Arrivals, Sign Concentration, Pluto Generations', group: 'Insights' },
  { key: 'full_dig',           label: 'The Full DIG — all slides (free users see first 3)', group: 'Insights' },
  { key: 'full_compatibility', label: 'Full Compatibility Report — all pair breakdowns', group: 'Insights' },
  // Export & Limits
  { key: 'zodiac_export',      label: 'Zodiac Wheel Export — PNG download', group: 'Export & Limits' },
  { key: 'pdf_export',         label: 'PDF Export', group: 'Export & Limits' },
  { key: 'unlimited_charts',   label: 'Unlimited Charts — beyond free tier limit', group: 'Export & Limits' },
]

// Helper: quick check using cached entitlements
export function canAccessFeature(featureKey) {
  const ent = getCachedEntitlements()
  if (!ent) return true // not loaded yet — don't block
  return canAccess(featureKey, ent.tier, ent.config)
}

export function isPremium() {
  return getCachedEntitlements()?.tier === 'premium'
}
