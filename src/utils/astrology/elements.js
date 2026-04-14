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

export const SIGN_MODALITY = {
  Aries: 'Cardinal', Cancer: 'Cardinal', Libra: 'Cardinal', Capricorn: 'Cardinal',
  Taurus: 'Fixed',   Leo: 'Fixed',       Scorpio: 'Fixed',  Aquarius: 'Fixed',
  Gemini: 'Mutable', Virgo: 'Mutable',   Sagittarius: 'Mutable', Pisces: 'Mutable',
}

export const POLARITY_GROUP = {
  Fire: 'Masculine', Air: 'Masculine', Earth: 'Feminine', Water: 'Feminine',
}

export const FAMILY_SIGNATURE_DESCRIPTIONS = {
  Fire: {
    Cardinal: 'leads with bold, pioneering energy. A family of starters and spark-setters.',
    Fixed:    'burns with fierce loyalty and unstoppable will. A family of champions.',
    Mutable:  'blazes with adaptable passion. A family of adventurers and seekers.',
  },
  Earth: {
    Cardinal: 'builds with purposeful ambition. A family of founders and architects.',
    Fixed:    'stands with immovable strength. A family of providers and guardians.',
    Mutable:  'flows with practical wisdom. A family of craftspeople and healers.',
  },
  Air: {
    Cardinal: 'leads through ideas and connection. A family of visionaries and communicators.',
    Fixed:    'holds to intellectual convictions. A family of thinkers and idealists.',
    Mutable:  'moves with wit and curiosity. A family of learners and connectors.',
  },
  Water: {
    Cardinal: 'leads with deep emotional intelligence. A family of nurturers and protectors.',
    Fixed:    'runs deep with resilient feeling. A family of keepers and loyal hearts.',
    Mutable:  'flows with empathy and openness. A family of dreamers and sensitives.',
  },
}

export const ELEMENT_ROLE_BLURB = {
  Fire:  'energizes and initiates',
  Earth: 'grounds and provides stability',
  Air:   'connects and brings perspective',
  Water: 'nurtures and holds emotional depth',
}

export const MODALITY_MODIFIER = {
  Cardinal: 'a natural leader who',
  Fixed:    'a steadfast anchor who',
  Mutable:  'a fluid adapter who',
}
