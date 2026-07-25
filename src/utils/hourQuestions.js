/**
 * hourQuestions.js — narrowing questions for The Hour
 *
 * Builds the question list from the computed rising-sign segments and
 * moon boundary. Only signs actually possible in the person's window are
 * asked about. All copy follows the voice guide: hedged, warm, planets
 * mirror rather than cause, no em dashes.
 */

// ── Copy tables ──────────────────────────────────────────────────────────────

/** How each rising sign tends to land on people at first meeting */
export const RISING_FIRST_IMPRESSIONS = {
  Aries: 'People who meet you often read you as direct and quick to start. You may come across as someone who moves first and explains later.',
  Taurus: 'First impressions of you tend toward steady and unhurried. New people may find you calm, grounded, and a little hard to rush.',
  Gemini: 'You often come across as curious and quick with words. New people tend to notice you asking questions and connecting threads.',
  Cancer: 'People may read you as warm but a little guarded at first. You tend to open up once a place or a person feels safe.',
  Leo: 'You often register as warm and hard to miss. New people tend to remember meeting you, even in a crowded room.',
  Virgo: 'First impressions of you often lean precise and observant. You may come across as the person quietly noticing the details.',
  Libra: 'You tend to come across as easygoing and socially smooth. New people often find you agreeable and quick to put others at ease.',
  Scorpio: 'People often read you as private and a little intense at first. You may give the sense of noticing more than you say.',
  Sagittarius: 'You often come across as open, candid, and a little restless. New people tend to notice your humor and honesty early.',
  Capricorn: 'First impressions of you tend toward reserved and capable. You may have seemed older than your years when you were young.',
  Aquarius: 'You often register as friendly but a step removed. New people tend to notice an original angle in how you see things.',
  Pisces: 'People may read you as gentle and a little dreamy at first. You tend to absorb the mood of a room without trying.',
}

/** How each moon sign tends to process feelings (for boundary days) */
export const MOON_STYLES = {
  Aries: 'Feelings tend to arrive fast and pass fast. You often react in the moment and move on.',
  Taurus: 'Feelings tend to build slowly and settle in. Comfort and routine often steady you.',
  Gemini: 'You often process feelings by talking or thinking them through, sometimes out loud.',
  Cancer: 'Feelings tend to run deep and attach to home and familiar people.',
  Leo: 'Feelings often want to be seen. Being appreciated tends to steady you.',
  Virgo: 'You often process feelings by getting useful, sorting or fixing something nearby.',
  Libra: 'Your mood often tracks the people around you. Conflict tends to unsettle you more than most.',
  Scorpio: 'Feelings tend to run deep and private. You often guard them until trust is solid.',
  Sagittarius: 'Moods tend to lift with movement and possibility. Feeling fenced in often wears on you.',
  Capricorn: 'You tend to keep feelings contained and work through them privately.',
  Aquarius: 'You often need a step back before you can name what you feel.',
  Pisces: 'You tend to soak up the feelings around you, sometimes without knowing whose they are.',
}

export const RISING_FIT_OPTIONS = [
  { value: 'yes',      label: 'That sounds like me' },
  { value: 'somewhat', label: 'Somewhat' },
  { value: 'no',       label: 'Not really me' },
  { value: 'skip',     label: 'Not sure' },
]

// ── Builder rules ────────────────────────────────────────────────────────────

export const MAX_QUESTIONS       = 7
export const MAX_RISING_CARDS    = 4
export const MIN_SEGMENT_SHARE   = 0.05
export const MIN_SEGMENT_MINUTES = 15

/**
 * Aggregate segments by sign and drop slivers too small to ask about.
 * Returns [{ sign, symbol, share, minutes }] sorted by share descending.
 */
export function candidateSigns(segments) {
  const bySign = new Map()
  for (const seg of segments ?? []) {
    const minutes = seg.endMinute - seg.startMinute
    const entry = bySign.get(seg.sign) ?? { sign: seg.sign, symbol: seg.symbol, share: 0, minutes: 0 }
    entry.share   += seg.share
    entry.minutes += minutes
    bySign.set(seg.sign, entry)
  }
  return [...bySign.values()]
    .filter(c => c.share >= MIN_SEGMENT_SHARE || c.minutes >= MIN_SEGMENT_MINUTES)
    .sort((a, b) => b.share - a.share)
}

/**
 * Build the question list for a prepared window.
 * Returns { questions, singleSign } where singleSign is the settled rising
 * sign when the whole window rises under one sign (no rising cards needed).
 */
export function buildQuestions({ segments, moonBoundary }) {
  const candidates = candidateSigns(segments)
  const questions = []
  const singleSign = candidates.length === 1 ? candidates[0].sign : null

  if (!singleSign) {
    for (const c of candidates.slice(0, MAX_RISING_CARDS)) {
      questions.push({
        id:      `rising-${c.sign.toLowerCase()}`,
        kind:    'risingFit',
        sign:    c.sign,
        symbol:  c.symbol,
        prompt:  'When people first meet you, how do you tend to come across?',
        copy:    RISING_FIRST_IMPRESSIONS[c.sign],
        options: RISING_FIT_OPTIONS,
      })
    }
  }

  if (moonBoundary) {
    questions.push({
      id:   'moon',
      kind: 'moon',
      prompt: 'Feelings move differently in different people. Which of these sounds more like you?',
      boundaryMinute: moonBoundary.boundaryMinute,
      options: [
        { value: 'before', sign: moonBoundary.beforeSign, label: MOON_STYLES[moonBoundary.beforeSign] },
        { value: 'after',  sign: moonBoundary.afterSign,  label: MOON_STYLES[moonBoundary.afterSign] },
        { value: 'skip',   label: 'Not sure' },
      ],
    })
  }

  questions.push({
    id:   'events',
    kind: 'events',
    prompt: 'Big turning points can help narrow things further. Add one to three if any come to mind, or skip this.',
  })

  return { questions: questions.slice(0, MAX_QUESTIONS), singleSign }
}
