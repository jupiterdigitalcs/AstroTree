const SIGNS = [
  { sign: 'Capricorn',   symbol: '♑', start: [12, 22], end: [1,  19] },
  { sign: 'Aquarius',    symbol: '♒', start: [1,  20], end: [2,  18] },
  { sign: 'Pisces',      symbol: '♓', start: [2,  19], end: [3,  20] },
  { sign: 'Aries',       symbol: '♈', start: [3,  21], end: [4,  19] },
  { sign: 'Taurus',      symbol: '♉', start: [4,  20], end: [5,  20] },
  { sign: 'Gemini',      symbol: '♊', start: [5,  21], end: [6,  20] },
  { sign: 'Cancer',      symbol: '♋', start: [6,  21], end: [7,  22] },
  { sign: 'Leo',         symbol: '♌', start: [7,  23], end: [8,  22] },
  { sign: 'Virgo',       symbol: '♍', start: [8,  23], end: [9,  22] },
  { sign: 'Libra',       symbol: '♎', start: [9,  23], end: [10, 22] },
  { sign: 'Scorpio',     symbol: '♏', start: [10, 23], end: [11, 21] },
  { sign: 'Sagittarius', symbol: '♐', start: [11, 22], end: [12, 21] },
]

export function getSunSign(birthdate) {
  const date = new Date(birthdate + 'T12:00:00')
  const month = date.getMonth() + 1
  const day   = date.getDate()

  for (const entry of SIGNS) {
    const [sm, sd] = entry.start
    const [em, ed] = entry.end

    if (sm <= em) {
      if ((month === sm && day >= sd) || (month === em && day <= ed)) return entry
      if (month > sm && month < em) return entry
    } else {
      // wraps year (Capricorn: Dec 22 – Jan 19)
      if ((month === sm && day >= sd) || (month === em && day <= ed)) return entry
      if (month > sm || month < em) return entry
    }
  }

  return { sign: 'Unknown', symbol: '✦' }
}

// ─── Element data ────────────────────────────────────────────────────────────

const SIGN_ELEMENT = {
  Aries:       'Fire',
  Leo:         'Fire',
  Sagittarius: 'Fire',
  Taurus:      'Earth',
  Virgo:       'Earth',
  Capricorn:   'Earth',
  Gemini:      'Air',
  Libra:       'Air',
  Aquarius:    'Air',
  Cancer:      'Water',
  Scorpio:     'Water',
  Pisces:      'Water',
}

export const ELEMENT_COLORS = {
  Fire:  '#ff6b35',
  Earth: '#7ec845',
  Air:   '#5bc8f5',
  Water: '#9b5de5',
}

export function getElement(sign) {
  const element = SIGN_ELEMENT[sign] ?? 'Unknown'
  const color   = ELEMENT_COLORS[element] ?? '#c9a84c'
  return { element, color }
}

