import { describe, it, expect } from 'vitest'
import {
  RISING_FIRST_IMPRESSIONS,
  MOON_STYLES,
  candidateSigns,
  buildQuestions,
  MAX_QUESTIONS,
  MAX_RISING_CARDS,
} from './hourQuestions.js'

const seg = (sign, startMinute, endMinute, share) => ({
  sign, symbol: '', startMinute, endMinute, share,
})

describe('copy tables', () => {
  it('cover all 12 signs and contain no em dashes', () => {
    for (const table of [RISING_FIRST_IMPRESSIONS, MOON_STYLES]) {
      expect(Object.keys(table)).toHaveLength(12)
      for (const copy of Object.values(table)) {
        expect(copy).not.toMatch(/—/)
        expect(copy.length).toBeGreaterThan(40)
      }
    }
  })

  it('keep the hedged voice (tends/may/often) in every blurb', () => {
    for (const copy of [...Object.values(RISING_FIRST_IMPRESSIONS), ...Object.values(MOON_STYLES)]) {
      expect(copy).toMatch(/tend|may|often/)
    }
  })
})

describe('candidateSigns', () => {
  it('aggregates split segments of the same sign and sorts by share', () => {
    const candidates = candidateSigns([
      seg('Aries', 0, 60, 0.2),
      seg('Taurus', 60, 200, 0.5),
      seg('Aries', 200, 290, 0.3),
    ])
    expect(candidates[0]).toMatchObject({ sign: 'Aries', share: 0.5 })
    expect(candidates[1].sign).toBe('Taurus')
  })

  it('drops slivers below both share and minute thresholds', () => {
    const candidates = candidateSigns([
      seg('Aries', 0, 10, 0.02),
      seg('Taurus', 10, 400, 0.98),
    ])
    expect(candidates.map(c => c.sign)).toEqual(['Taurus'])
  })
})

describe('buildQuestions', () => {
  const threeSigns = [
    seg('Leo', 0, 120, 0.4),
    seg('Virgo', 120, 260, 0.45),
    seg('Libra', 260, 300, 0.15),
  ]

  it('asks only about signs present in the window', () => {
    const { questions } = buildQuestions({ segments: threeSigns, moonBoundary: null })
    const risingSigns = questions.filter(q => q.kind === 'risingFit').map(q => q.sign)
    expect(risingSigns.sort()).toEqual(['Leo', 'Libra', 'Virgo'])
  })

  it('orders rising cards by segment share, biggest first', () => {
    const { questions } = buildQuestions({ segments: threeSigns, moonBoundary: null })
    expect(questions[0].sign).toBe('Virgo')
  })

  it('caps rising cards and total questions', () => {
    const many = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo']
      .map((s, i) => seg(s, i * 100, (i + 1) * 100, 1 / 6))
    const { questions } = buildQuestions({
      segments: many,
      moonBoundary: { beforeSign: 'Cancer', afterSign: 'Leo', boundaryMinute: 300 },
    })
    expect(questions.filter(q => q.kind === 'risingFit')).toHaveLength(MAX_RISING_CARDS)
    expect(questions.length).toBeLessThanOrEqual(MAX_QUESTIONS)
  })

  it('skips rising cards entirely when one sign fills the window', () => {
    const { questions, singleSign } = buildQuestions({
      segments: [seg('Scorpio', 0, 240, 1)],
      moonBoundary: null,
    })
    expect(singleSign).toBe('Scorpio')
    expect(questions.filter(q => q.kind === 'risingFit')).toHaveLength(0)
  })

  it('adds a moon question only when a boundary exists', () => {
    const withMoon = buildQuestions({
      segments: threeSigns,
      moonBoundary: { beforeSign: 'Cancer', afterSign: 'Leo', boundaryMinute: 150 },
    })
    const moonQ = withMoon.questions.find(q => q.kind === 'moon')
    expect(moonQ.options[0].label).toBe(MOON_STYLES.Cancer)
    expect(moonQ.boundaryMinute).toBe(150)
    const without = buildQuestions({ segments: threeSigns, moonBoundary: null })
    expect(without.questions.find(q => q.kind === 'moon')).toBeUndefined()
  })

  it('always ends with the life events step', () => {
    const { questions } = buildQuestions({ segments: threeSigns, moonBoundary: null })
    expect(questions[questions.length - 1].kind).toBe('events')
  })
})
