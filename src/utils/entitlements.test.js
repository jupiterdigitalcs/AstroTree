import { describe, it, expect, beforeEach } from 'vitest'
import {
  isPaywallEnabled,
  isFeatureGated,
  canAccess,
  getChartLimit,
  canAccessFeature,
  isPremium,
  setCachedEntitlements,
} from './entitlements.js'

beforeEach(() => {
  setCachedEntitlements(null)
})

describe('isPaywallEnabled', () => {
  it('defaults to enabled when config is missing', () => {
    expect(isPaywallEnabled(undefined)).toBe(true)
    expect(isPaywallEnabled(null)).toBe(true)
    expect(isPaywallEnabled({})).toBe(true)
  })

  it('is disabled only when explicitly set to false', () => {
    expect(isPaywallEnabled({ paywall_enabled: false })).toBe(false)
    expect(isPaywallEnabled({ paywall_enabled: true })).toBe(true)
  })
})

describe('isFeatureGated', () => {
  it('gates nothing when paywall is disabled', () => {
    const config = { paywall_enabled: false }
    expect(isFeatureGated('zodiac_view', config)).toBe(false)
    expect(isFeatureGated('full_dig', config)).toBe(false)
  })

  it('fails closed: uses default gated list when config is missing', () => {
    expect(isFeatureGated('zodiac_view', undefined)).toBe(true)
    expect(isFeatureGated('tables_view', undefined)).toBe(true)
    expect(isFeatureGated('constellation_view', undefined)).toBe(true)
    expect(isFeatureGated('advanced_insights', undefined)).toBe(true)
    expect(isFeatureGated('full_dig', undefined)).toBe(true)
    expect(isFeatureGated('unlimited_charts', undefined)).toBe(true)
  })

  it('never gates features outside the list (tree view, share links)', () => {
    expect(isFeatureGated('tree_view', undefined)).toBe(false)
    expect(isFeatureGated('share_links', undefined)).toBe(false)
  })

  it('uses the server list when present and non-empty', () => {
    const config = { gated_features: ['pdf_export'] }
    expect(isFeatureGated('pdf_export', config)).toBe(true)
    expect(isFeatureGated('zodiac_view', config)).toBe(false)
  })

  it('falls back to defaults when server list is empty or invalid', () => {
    expect(isFeatureGated('zodiac_view', { gated_features: [] })).toBe(true)
    expect(isFeatureGated('zodiac_view', { gated_features: 'oops' })).toBe(true)
  })
})

describe('canAccess', () => {
  it('allows ungated features for any tier', () => {
    expect(canAccess('tree_view', 'free', undefined)).toBe(true)
    expect(canAccess('tree_view', undefined, undefined)).toBe(true)
  })

  it('allows gated features only for premium', () => {
    expect(canAccess('zodiac_view', 'premium', undefined)).toBe(true)
    expect(canAccess('zodiac_view', 'free', undefined)).toBe(false)
    expect(canAccess('zodiac_view', undefined, undefined)).toBe(false)
  })

  it('allows everything when paywall is disabled', () => {
    expect(canAccess('zodiac_view', 'free', { paywall_enabled: false })).toBe(true)
  })
})

describe('getChartLimit', () => {
  it('is unlimited when paywall is disabled', () => {
    expect(getChartLimit('free', { paywall_enabled: false })).toBe(Infinity)
  })

  it('defaults to 3 for free and 50 for premium', () => {
    expect(getChartLimit('free', {})).toBe(3)
    expect(getChartLimit('premium', {})).toBe(50)
    expect(getChartLimit(undefined, undefined)).toBe(3)
  })

  it('honours config overrides', () => {
    const config = { chart_limit_free: 5, chart_limit_premium: 100 }
    expect(getChartLimit('free', config)).toBe(5)
    expect(getChartLimit('premium', config)).toBe(100)
  })
})

describe('canAccessFeature (cached entitlements)', () => {
  it('does not block before entitlements load', () => {
    expect(canAccessFeature('zodiac_view')).toBe(true)
  })

  it('gates by cached tier once loaded', () => {
    setCachedEntitlements({ tier: 'free', config: {} })
    expect(canAccessFeature('zodiac_view')).toBe(false)
    expect(canAccessFeature('tree_view')).toBe(true)

    setCachedEntitlements({ tier: 'premium', config: {} })
    expect(canAccessFeature('zodiac_view')).toBe(true)
  })
})

describe('isPremium', () => {
  it('is false when entitlements are not loaded', () => {
    expect(isPremium()).toBe(false)
  })

  it('reflects the cached tier', () => {
    setCachedEntitlements({ tier: 'premium', config: {} })
    expect(isPremium()).toBe(true)
    setCachedEntitlements({ tier: 'free', config: {} })
    expect(isPremium()).toBe(false)
  })
})
