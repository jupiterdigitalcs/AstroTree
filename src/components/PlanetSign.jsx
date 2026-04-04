// Planet display metadata — designed for the dark celestial palette.
// Add Mercury, Venus, Mars entries here when MVP 3 planet calculations land.
export const PLANET_META = {
  sun:     { glyph: '☀', color: '#c9a84c', label: 'Sun'     },  // gold
  moon:    { glyph: '☽', color: '#9dbbd4', label: 'Moon'    },  // silver-blue
  mercury: { glyph: '☿', color: '#8ecfcf', label: 'Mercury' },  // teal-aqua
  venus:   { glyph: '♀', color: '#d4a0bc', label: 'Venus'   },  // rose-mauve (matches --rose)
  mars:    { glyph: '♂', color: '#d4826a', label: 'Mars'    },  // rust-terracotta
}

// Inline planet+sign display — color comes from PLANET_META, layout from parent.
// symbol = zodiac glyph (♋ etc.), sign = sign name (Cancer etc.)
export function PlanetSign({ planet, symbol, sign }) {
  const meta = PLANET_META[planet] ?? { glyph: '★', color: '#c9a84c' }
  return (
    <span className="planet-sign" style={{ color: meta.color }}>
      <span className="planet-sign-glyph">{meta.glyph}</span>
      {symbol && <span className="planet-sign-zodiac">{symbol}</span>}
      {sign   && <span className="planet-sign-name">{sign}</span>}
    </span>
  )
}
