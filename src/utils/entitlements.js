// Client-side entitlement checking.
// Entitlements are fetched once per session from the server and cached in memory.

let _cached = null

export function getCachedEntitlements() {
  return _cached
}

export function setCachedEntitlements(ent) {
  _cached = ent
}

// Is the paywall globally enabled?
export function isPaywallEnabled(config) {
  return config?.paywall_enabled === true
}

// Is a specific feature gated (requires premium)?
export function isFeatureGated(featureKey, config) {
  if (!isPaywallEnabled(config)) return false
  const gated = config?.gated_features ?? []
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
export const FEATURE_KEYS = [
  { key: 'pdf_export',         label: 'PDF Export' },
  { key: 'advanced_insights',  label: 'Advanced Insights' },
  { key: 'constellation_view', label: 'Constellation View' },
  { key: 'zodiac_export',      label: 'Zodiac Wheel Export' },
  { key: 'unlimited_charts',   label: 'Unlimited Charts' },
]
