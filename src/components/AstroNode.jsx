import { Handle, Position } from '@xyflow/react'
import { PlanetSign } from './PlanetSign.jsx'

const EL_COLORS = { Fire: '#e8634a', Earth: '#7ab648', Air: '#5bc8f5', Water: '#6b8dd6' }
const SIGN_ELEMENTS = { Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire', Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth', Gemini: 'Air', Libra: 'Air', Aquarius: 'Air', Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water' }

function elementCounts(d) {
  const signs = { Fire: ['Aries','Leo','Sagittarius'], Earth: ['Taurus','Virgo','Capricorn'], Air: ['Gemini','Libra','Aquarius'], Water: ['Cancer','Scorpio','Pisces'] }
  const counts = { Fire: 0, Earth: 0, Air: 0, Water: 0 }
  const check = s => { for (const [el, ss] of Object.entries(signs)) if (ss.includes(s)) counts[el]++ }
  if (d.sign) check(d.sign)
  if (d.moonSign && d.moonSign !== 'Unknown') check(d.moonSign)
  const ip = d.innerPlanets
  if (ip?.mercury?.sign) check(ip.mercury.sign)
  if (ip?.venus?.sign) check(ip.venus.sign)
  if (ip?.mars?.sign) check(ip.mars.sign)
  const op = d.outerPlanets
  if (op?.jupiter?.sign) check(op.jupiter.sign)
  if (op?.saturn?.sign) check(op.saturn.sign)
  return counts
}

export default function AstroNode({ data, selected }) {
  const { name, sign, symbol, element, elementColor, moonSign, moonSymbol } = data

  const glow   = elementColor ?? '#c9a84c'
  const border = selected
    ? `#fff`
    : `${glow}55`

  return (
    <div
      className="astro-node"
      style={{
        borderColor: border,
        background: `linear-gradient(155deg,
          ${glow}18 0%,
          rgba(26,18,52,0.96) 35%,
          rgba(10,7,22,0.98) 100%)`,
        boxShadow: selected
          ? `0 0 0 2px #fff8, 0 0 32px ${glow}88, 0 6px 28px rgba(0,0,0,0.7)`
          : `0 0 22px ${glow}28, 0 0 6px ${glow}14, 0 4px 22px rgba(0,0,0,0.55)`,
      }}
    >
      <Handle type="target" position={Position.Top}    className="node-handle" />
      <Handle type="source" position={Position.Bottom} className="node-handle" />
      {/* Side handles need both source+target so spouse edges work in either direction */}
      <Handle type="source" position={Position.Right}  className="node-handle node-handle--side" id="right-src" />
      <Handle type="target" position={Position.Right}  className="node-handle node-handle--side" id="right-tgt" />
      <Handle type="source" position={Position.Left}   className="node-handle node-handle--side" id="left-src" />
      <Handle type="target" position={Position.Left}   className="node-handle node-handle--side" id="left-tgt" />

      <div className="node-symbol" style={{ color: glow, filter: `drop-shadow(0 0 10px ${glow}99)` }}>
        {symbol}
      </div>
      <div className="node-name">{name}</div>
      <div className="node-sign-row">
        <span className="node-sign" style={{ color: glow }}>{sign}</span>
        {element && (
          <span className="node-element-badge" style={{ background: `${glow}22`, borderColor: `${glow}44`, color: glow }}>{element}</span>
        )}
      </div>
      {moonSign && moonSign !== 'Unknown' && (() => {
        const moonEl = SIGN_ELEMENTS[moonSign]
        const moonColor = moonEl ? EL_COLORS[moonEl] : null
        return (
          <div className="node-moon" style={moonColor ? {
            background: `${moonColor}28`,
            borderColor: `${moonColor}88`,
          } : undefined}>
            <PlanetSign planet="moon" symbol={moonSymbol} sign={moonSign} />
          </div>
        )
      })()}
      {data.innerPlanets && (
        <div className="node-element-dots">
          {['Fire', 'Earth', 'Air', 'Water'].map(el => {
            const c = elementCounts(data)[el]
            return c > 0 ? (
              <span key={el} className="node-el-dot" style={{ background: EL_COLORS[el], opacity: c >= 3 ? 1 : c === 2 ? 0.7 : 0.4 }} title={`${el}: ${c}`} />
            ) : null
          })}
        </div>
      )}
      {data.siblingGroupSymbol && (
        <div className="node-sibling-badge" style={{ color: data.siblingGroupColor }} title="Sibling group — shares same parent(s)">
          {data.siblingGroupSymbol}
        </div>
      )}
    </div>
  )
}
