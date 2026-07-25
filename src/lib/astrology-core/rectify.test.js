import { describe, it, expect } from 'vitest'
import {
  SIGN_NAMES,
  signOfLon,
  signNameOfLon,
  minuteToHHMM,
  windowFromTimeKnowledge,
  binSizeFor,
  buildBins,
  buildSegments,
  refineSignBoundary,
  detectMoonBoundary,
  applyAnswer,
  leakageTrust,
  scoreLifeEvents,
  normalizeWeights,
  extractWindow,
  signShares,
  confidenceTier,
  RISING_FIT_FACTORS,
  MOON_FACTORS,
  MAX_EVENT_FACTOR,
} from './rectify.js'
import { calcMoon } from './natal.js'

// Synthetic bin builder: ascLon sweeps linearly, moon fixed unless given
function makeBins({ count, binMinutes = 10, ascStart = 0, ascStep = 3, moonLon = 100, weights = null }) {
  return Array.from({ length: count }, (_, i) => ({
    startMinute: i * binMinutes,
    ascLon:  (ascStart + i * ascStep) % 360,
    mcLon:   (ascStart + 250 + i * ascStep) % 360,
    moonLon: typeof moonLon === 'function' ? moonLon(i) : moonLon,
    weight:  weights ? weights[i] : 1,
  }))
}

describe('signOfLon / signNameOfLon / minuteToHHMM', () => {
  it('maps longitudes to sign indices', () => {
    expect(signOfLon(0)).toBe(0)
    expect(signOfLon(29.99)).toBe(0)
    expect(signOfLon(30)).toBe(1)
    expect(signOfLon(359.9)).toBe(11)
    expect(signOfLon(-10)).toBe(11)
    expect(signNameOfLon(45)).toBe('Taurus')
  })

  it('formats minutes past midnight', () => {
    expect(minuteToHHMM(0)).toBe('00:00')
    expect(minuteToHHMM(605)).toBe('10:05')
    expect(minuteToHHMM(1439)).toBe('23:59')
  })
})

describe('windowFromTimeKnowledge', () => {
  it('builds an exact window with uncertainty, clamped to the day', () => {
    expect(windowFromTimeKnowledge({ kind: 'exact', time: '10:30', uncertaintyMinutes: 60 }))
      .toEqual({ startMinute: 570, endMinute: 690 })
    expect(windowFromTimeKnowledge({ kind: 'exact', time: '00:20', uncertaintyMinutes: 120 }))
      .toEqual({ startMinute: 0, endMinute: 140 })
  })

  it('pads part-of-day blocks by 30 minutes', () => {
    expect(windowFromTimeKnowledge({ kind: 'partOfDay', part: 'morning' }))
      .toEqual({ startMinute: 330, endMinute: 750 })
    expect(windowFromTimeKnowledge({ kind: 'partOfDay', part: 'night' }))
      .toEqual({ startMinute: 0, endMinute: 390 })
  })

  it('falls back to the full day for unknown or malformed input', () => {
    expect(windowFromTimeKnowledge({ kind: 'unknown' })).toEqual({ startMinute: 0, endMinute: 1440 })
    expect(windowFromTimeKnowledge(null)).toEqual({ startMinute: 0, endMinute: 1440 })
    expect(windowFromTimeKnowledge({ kind: 'exact', time: 'nope' })).toEqual({ startMinute: 0, endMinute: 1440 })
  })
})

describe('binSizeFor', () => {
  it('uses 5-minute bins for short windows, 10 for long', () => {
    expect(binSizeFor(0, 360)).toBe(5)
    expect(binSizeFor(0, 361)).toBe(10)
    expect(binSizeFor(0, 1440)).toBe(10)
  })
})

describe('buildSegments', () => {
  it('groups consecutive bins by rising sign with shares', () => {
    // 20 bins, asc advances 3°/bin from 20° → crosses 30° (Taurus) at bin 4
    const bins = makeBins({ count: 20, ascStart: 20, ascStep: 3 })
    const segments = buildSegments(bins, 10)
    expect(segments[0].sign).toBe('Aries')
    expect(segments[1].sign).toBe('Taurus')
    expect(segments[0].endMinute).toBe(segments[1].startMinute)
    const totalShare = segments.reduce((s, seg) => s + seg.share, 0)
    expect(totalShare).toBeCloseTo(1)
  })

  it('returns empty for no bins', () => {
    expect(buildSegments([], 10)).toEqual([])
  })
})

describe('refineSignBoundary', () => {
  it('finds the exact crossing minute of a monotone longitude', () => {
    // Longitude rises 0.069°/min from 25°; crosses 30° (Aries→Taurus) at minute 73
    const lonAt = minute => 25 + minute * 0.069
    expect(refineSignBoundary(0, 120, lonAt)).toBe(73)
  })
})

describe('detectMoonBoundary', () => {
  it('returns null when the moon stays in one sign', () => {
    const bins = makeBins({ count: 10, moonLon: 100 })
    expect(detectMoonBoundary(bins, () => 100)).toBeNull()
  })

  it('finds the boundary when the moon changes sign', () => {
    // Moon crosses 120° (Cancer→Leo) mid-window
    const moonLonAt = minute => 119 + minute / 60
    const bins = makeBins({ count: 13, binMinutes: 10, moonLon: i => 119 + (i * 10) / 60 })
    const boundary = detectMoonBoundary(bins, moonLonAt)
    expect(boundary.beforeSign).toBe('Cancer')
    expect(boundary.afterSign).toBe('Leo')
    expect(boundary.boundaryMinute).toBe(60)
  })
})

describe('applyAnswer', () => {
  it('reweights only the named rising sign', () => {
    const bins = makeBins({ count: 20, ascStart: 20, ascStep: 3 }) // Aries then Taurus
    const after = applyAnswer(bins, { kind: 'risingFit', sign: 'Taurus', response: 'yes' })
    expect(after[0].weight).toBe(1)                                // Aries untouched
    expect(after[10].weight).toBe(RISING_FIT_FACTORS.yes)          // Taurus boosted
    const denied = applyAnswer(bins, { kind: 'risingFit', sign: 'Aries', response: 'no' })
    expect(denied[0].weight).toBe(RISING_FIT_FACTORS.no)
  })

  it('splits the window on a moon answer', () => {
    const bins = makeBins({ count: 10 })
    const after = applyAnswer(bins, { kind: 'moon', boundaryMinute: 50, side: 'after' })
    expect(after[0].weight).toBe(MOON_FACTORS.other)
    expect(after[9].weight).toBe(MOON_FACTORS.matched)
  })

  it('leaves weights alone on skip and does not mutate input', () => {
    const bins = makeBins({ count: 5 })
    const after = applyAnswer(bins, { kind: 'risingFit', sign: 'Aries', response: 'skip' })
    expect(after.every(b => b.weight === 1)).toBe(true)
    applyAnswer(bins, { kind: 'risingFit', sign: 'Aries', response: 'yes' })
    expect(bins.every(b => b.weight === 1)).toBe(true)
  })
})

describe('leakageTrust and sun-sign discounting', () => {
  it('discounts same sign fully, same element partially, unrelated not at all', () => {
    expect(leakageTrust('Aries', 'Aries')).toBe(0.5)
    expect(leakageTrust('Aries', 'Leo')).toBe(0.75)      // both fire
    expect(leakageTrust('Aries', 'Cancer')).toBe(1)
    expect(leakageTrust('Aries', null)).toBe(1)
  })

  it('damps a "yes" on the sun sign and sharpens a "no"', () => {
    const bins = makeBins({ count: 20, ascStart: 20, ascStep: 3 }) // Aries then Taurus
    const plainYes = applyAnswer(bins, { kind: 'risingFit', sign: 'Aries', response: 'yes' })
    const leakyYes = applyAnswer(bins, { kind: 'risingFit', sign: 'Aries', response: 'yes' }, { sunSign: 'Aries' })
    expect(leakyYes[0].weight).toBeCloseTo(1.5)              // 1 + (2.0 − 1) × 0.5
    expect(leakyYes[0].weight).toBeLessThan(plainYes[0].weight)

    const plainNo = applyAnswer(bins, { kind: 'risingFit', sign: 'Aries', response: 'no' })
    const leakyNo = applyAnswer(bins, { kind: 'risingFit', sign: 'Aries', response: 'no' }, { sunSign: 'Aries' })
    expect(leakyNo[0].weight).toBeCloseTo(0.4 ** 1.5)        // rejection counts more
    expect(leakyNo[0].weight).toBeLessThan(plainNo[0].weight)
  })

  it('leaves unrelated signs untouched', () => {
    const bins = makeBins({ count: 20, ascStart: 20, ascStep: 3 })
    const answered = applyAnswer(bins, { kind: 'risingFit', sign: 'Aries', response: 'yes' }, { sunSign: 'Cancer' })
    expect(answered[0].weight).toBe(RISING_FIT_FACTORS.yes)
  })
})

describe('scoreLifeEvents', () => {
  it('boosts bins whose ASC receives a tight transit', () => {
    // Bin 0 has ascLon 100; Saturn at 100 = exact conjunction
    const bins = makeBins({ count: 10, ascStart: 100, ascStep: 5 })
    const scored = scoreLifeEvents(bins, [{ planets: { Saturn: 100 } }])
    expect(scored[0].weight).toBeGreaterThan(scored[5].weight)
    expect(scored[0].weight).toBeCloseTo(1.9) // 1 + 0.9 × (1 − 0)
  })

  it('caps the per-event factor', () => {
    // Every outer planet exactly conjunct both angles would exceed the cap
    const bins = [{ startMinute: 0, ascLon: 100, mcLon: 100, moonLon: 0, weight: 1 }]
    const planets = { Jupiter: 100, Saturn: 100, Uranus: 100, Neptune: 100, Pluto: 100 }
    const scored = scoreLifeEvents(bins, [{ planets }])
    expect(scored[0].weight).toBeCloseTo(MAX_EVENT_FACTOR)
  })

  it('is a no-op with no events', () => {
    const bins = makeBins({ count: 3 })
    expect(scoreLifeEvents(bins, []).every(b => b.weight === 1)).toBe(true)
  })
})

describe('extractWindow', () => {
  it('returns the whole window for a uniform distribution', () => {
    const bins = makeBins({ count: 10 })
    const win = extractWindow(bins, 10, 0.7)
    // Uniform: needs 7 of 10 bins
    expect(win.endMinute - win.startMinute).toBe(70)
  })

  it('collapses onto a spike', () => {
    const weights = [0.01, 0.01, 0.01, 10, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01]
    const bins = makeBins({ count: 10, weights })
    const win = extractWindow(bins, 10, 0.7)
    expect(win.startMinute).toBe(30)
    expect(win.endMinute).toBe(40)
  })

  it('spans both peaks of a bimodal distribution', () => {
    const weights = [5, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 5]
    const bins = makeBins({ count: 10, weights })
    const win = extractWindow(bins, 10, 0.7)
    expect(win.startMinute).toBe(0)
    expect(win.endMinute).toBe(100)
  })
})

describe('signShares', () => {
  it('sums mass per sign, sorted descending', () => {
    const bins = makeBins({ count: 20, ascStart: 20, ascStep: 3, weights: Array(20).fill(1) })
    const boosted = applyAnswer(bins, { kind: 'risingFit', sign: 'Taurus', response: 'yes' })
    const shares = signShares(boosted)
    expect(shares[0].sign).toBe('Taurus')
    expect(shares.reduce((s, x) => s + x.share, 0)).toBeCloseTo(1)
  })
})

describe('confidenceTier', () => {
  it('grades strong, moderate, light', () => {
    expect(confidenceTier({ topSignShare: 0.85, windowMinutes: 45, originalMinutes: 1440 })).toBe('strong')
    expect(confidenceTier({ topSignShare: 0.65, windowMinutes: 300, originalMinutes: 1440 })).toBe('moderate')
    expect(confidenceTier({ topSignShare: 0.5, windowMinutes: 1440, originalMinutes: 1440 })).toBe('light')
  })
})

describe('buildBins with real Celestine (1990-05-15, New York)', () => {
  const params = {
    birthdate: '1990-05-15',
    lat: 40.71,
    lon: -74.01,
    startMinute: 0,
    endMinute: 1440,
    offsetAt: () => -4, // EDT
  }

  it('sweeps the full day into 144 ten-minute bins', () => {
    const { binMinutes, bins } = buildBins(params)
    expect(binMinutes).toBe(10)
    expect(bins).toHaveLength(144)
  })

  it('advances the ascendant a full 360° across the day, hitting all 12 signs', () => {
    const { bins, binMinutes } = buildBins(params)
    let advance = 0
    for (let i = 1; i < bins.length; i++) {
      advance += ((bins[i].ascLon - bins[i - 1].ascLon) % 360 + 360) % 360
    }
    // ~361° per sidereal day; sampling bin centers covers slightly less
    expect(advance).toBeGreaterThan(345)
    expect(advance).toBeLessThan(375)
    const segments = buildSegments(bins, binMinutes)
    const signsSeen = new Set(segments.map(s => s.sign))
    expect(signsSeen.size).toBe(12)
    expect(SIGN_NAMES.every(s => signsSeen.has(s))).toBe(true)
  })

  it('moon longitude agrees with the existing calcMoon path', () => {
    const { bins } = buildBins(params)
    const noonBin = bins.find(b => b.startMinute === 720)
    expect(signNameOfLon(noonBin.moonLon)).toBe(calcMoon('1990-05-15', '12:05', -4).moonSign)
  })

  it('moon moves roughly its daily motion across the day', () => {
    const { bins } = buildBins(params)
    const motion = ((bins[143].moonLon - bins[0].moonLon) % 360 + 360) % 360
    expect(motion).toBeGreaterThan(10)
    expect(motion).toBeLessThan(16)
  })
})
