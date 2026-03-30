import { describe, it, expect } from 'vitest'
import { getSunSign, getElement } from './astrology.js'

// ── getSunSign ────────────────────────────────────────────────────────────────

describe('getSunSign — all 12 signs', () => {
  const cases = [
    // Capricorn (Dec 22 – Jan 19) — wraps year
    ['Capricorn', '2000-12-22'],
    ['Capricorn', '2001-01-01'],
    ['Capricorn', '2001-01-19'],
    // Aquarius (Jan 20 – Feb 18)
    ['Aquarius',  '2000-01-20'],
    ['Aquarius',  '2000-02-18'],
    // Pisces (Feb 19 – Mar 20)
    ['Pisces',    '2000-02-19'],
    ['Pisces',    '2000-03-20'],
    // Aries (Mar 21 – Apr 19)
    ['Aries',     '2000-03-21'],
    ['Aries',     '2000-04-19'],
    // Taurus (Apr 20 – May 20)
    ['Taurus',    '2000-04-20'],
    ['Taurus',    '2000-05-20'],
    // Gemini (May 21 – Jun 20)
    ['Gemini',    '2000-05-21'],
    ['Gemini',    '2000-06-20'],
    // Cancer (Jun 21 – Jul 22)
    ['Cancer',    '2000-06-21'],
    ['Cancer',    '2000-07-22'],
    // Leo (Jul 23 – Aug 22)
    ['Leo',       '2000-07-23'],
    ['Leo',       '2000-08-22'],
    // Virgo (Aug 23 – Sep 22)
    ['Virgo',     '2000-08-23'],
    ['Virgo',     '2000-09-22'],
    // Libra (Sep 23 – Oct 22)
    ['Libra',     '2000-09-23'],
    ['Libra',     '2000-10-22'],
    // Scorpio (Oct 23 – Nov 21)
    ['Scorpio',   '2000-10-23'],
    ['Scorpio',   '2000-11-21'],
    // Sagittarius (Nov 22 – Dec 21)
    ['Sagittarius', '2000-11-22'],
    ['Sagittarius', '2000-12-21'],
  ]

  for (const [expected, date] of cases) {
    it(`${date} → ${expected}`, () => {
      expect(getSunSign(date).sign).toBe(expected)
    })
  }
})

describe('getSunSign — cusp boundaries', () => {
  it('Dec 21 is Sagittarius (last day)', () => {
    expect(getSunSign('2000-12-21').sign).toBe('Sagittarius')
  })

  it('Dec 22 is Capricorn (first day)', () => {
    expect(getSunSign('2000-12-22').sign).toBe('Capricorn')
  })

  it('Jan 19 is Capricorn (last day, wraps into new year)', () => {
    expect(getSunSign('2001-01-19').sign).toBe('Capricorn')
  })

  it('Jan 20 is Aquarius (first day)', () => {
    expect(getSunSign('2001-01-20').sign).toBe('Aquarius')
  })

  it('Feb 18 is Aquarius (last day)', () => {
    expect(getSunSign('2001-02-18').sign).toBe('Aquarius')
  })

  it('Feb 19 is Pisces (first day)', () => {
    expect(getSunSign('2001-02-19').sign).toBe('Pisces')
  })
})

describe('getSunSign — leap year edge cases', () => {
  it('Feb 29 on a leap year is Pisces', () => {
    expect(getSunSign('2000-02-29').sign).toBe('Pisces')
    expect(getSunSign('1996-02-29').sign).toBe('Pisces')
    expect(getSunSign('2004-02-29').sign).toBe('Pisces')
  })
})

describe('getSunSign — symbols are returned', () => {
  it('returns the symbol for each sign', () => {
    const symbolMap = {
      Capricorn: '♑', Aquarius: '♒', Pisces: '♓', Aries: '♈',
      Taurus: '♉', Gemini: '♊', Cancer: '♋', Leo: '♌',
      Virgo: '♍', Libra: '♎', Scorpio: '♏', Sagittarius: '♐',
    }
    for (const [sign, symbol] of Object.entries(symbolMap)) {
      // Use a known mid-sign date for each
      const midDates = {
        Capricorn: '2001-01-05', Aquarius: '2001-02-05', Pisces: '2001-03-05',
        Aries: '2001-04-01', Taurus: '2001-05-01', Gemini: '2001-06-01',
        Cancer: '2001-07-01', Leo: '2001-08-01', Virgo: '2001-09-01',
        Libra: '2001-10-01', Scorpio: '2001-11-01', Sagittarius: '2001-12-01',
      }
      const result = getSunSign(midDates[sign])
      expect(result.sign).toBe(sign)
      expect(result.symbol).toBe(symbol)
    }
  })
})

// ── getElement ────────────────────────────────────────────────────────────────

describe('getElement', () => {
  it('Fire signs', () => {
    expect(getElement('Aries').element).toBe('Fire')
    expect(getElement('Leo').element).toBe('Fire')
    expect(getElement('Sagittarius').element).toBe('Fire')
  })

  it('Earth signs', () => {
    expect(getElement('Taurus').element).toBe('Earth')
    expect(getElement('Virgo').element).toBe('Earth')
    expect(getElement('Capricorn').element).toBe('Earth')
  })

  it('Air signs', () => {
    expect(getElement('Gemini').element).toBe('Air')
    expect(getElement('Libra').element).toBe('Air')
    expect(getElement('Aquarius').element).toBe('Air')
  })

  it('Water signs', () => {
    expect(getElement('Cancer').element).toBe('Water')
    expect(getElement('Scorpio').element).toBe('Water')
    expect(getElement('Pisces').element).toBe('Water')
  })

  it('returns "Unknown" element for unrecognized sign', () => {
    expect(getElement('Unknown').element).toBe('Unknown')
    expect(getElement('').element).toBe('Unknown')
  })

  it('returns element color for each element', () => {
    expect(getElement('Aries').color).toBe('#ff6b35')   // Fire
    expect(getElement('Taurus').color).toBe('#7ec845')  // Earth
    expect(getElement('Gemini').color).toBe('#5bc8f5')  // Air
    expect(getElement('Cancer').color).toBe('#9b5de5')  // Water
  })

  it('returns fallback gold color for unknown sign', () => {
    expect(getElement('Unknown').color).toBe('#c9a84c')
  })
})
