import { describe, it, expect } from 'vitest'
import { getMoonPhase } from './moonTonight.js'

describe('getMoonPhase', () => {
  it('identifies a known new moon (2024-04-08 eclipse)', () => {
    const m = getMoonPhase(new Date(Date.UTC(2024, 3, 8, 18, 21)))
    expect(m.name).toBe('New Moon')
    expect(m.illumination).toBeLessThan(0.05)
  })

  it('identifies a known full moon (2024-04-23)', () => {
    const m = getMoonPhase(new Date(Date.UTC(2024, 3, 23, 23, 49)))
    expect(m.name).toBe('Full Moon')
    expect(m.illumination).toBeGreaterThan(0.95)
  })

  it('marks the first half of the cycle waxing and the second waning', () => {
    expect(getMoonPhase(new Date(Date.UTC(2024, 3, 15))).waxing).toBe(true)
    expect(getMoonPhase(new Date(Date.UTC(2024, 3, 28))).waxing).toBe(false)
  })

  it('keeps illumination within [0, 1] across a full cycle', () => {
    for (let d = 0; d < 30; d++) {
      const m = getMoonPhase(new Date(Date.UTC(2024, 4, 1 + d)))
      expect(m.illumination).toBeGreaterThanOrEqual(0)
      expect(m.illumination).toBeLessThanOrEqual(1)
      expect(m.name).toBeTruthy()
    }
  })
})
