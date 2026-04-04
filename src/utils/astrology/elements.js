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
    Cardinal: 'leads with bold, pioneering energy — a family of starters and spark-setters',
    Fixed:    'burns with fierce loyalty and unstoppable will — a family of champions',
    Mutable:  'blazes with adaptable passion — a family of adventurers and seekers',
  },
  Earth: {
    Cardinal: 'builds with purposeful ambition — a family of founders and architects',
    Fixed:    'stands with immovable strength — a family of providers and guardians',
    Mutable:  'flows with practical wisdom — a family of craftspeople and healers',
  },
  Air: {
    Cardinal: 'leads through ideas and connection — a family of visionaries and communicators',
    Fixed:    'holds to intellectual convictions — a family of thinkers and idealists',
    Mutable:  'dances with wit and curiosity — a family of learners and connectors',
  },
  Water: {
    Cardinal: 'leads with deep emotional intelligence — a family of nurturers and protectors',
    Fixed:    'runs deep with resilient feeling — a family of keepers and loyal hearts',
    Mutable:  'flows with empathy and openness — a family of dreamers and sensitives',
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
