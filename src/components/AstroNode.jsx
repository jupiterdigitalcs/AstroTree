import { Handle, Position } from '@xyflow/react'

export default function AstroNode({ data, selected }) {
  const { name, sign, symbol, element, elementColor } = data

  const glowColor   = elementColor ?? '#c9a84c'
  const borderColor = selected ? '#ffffff' : `${glowColor}99`

  return (
    <div
      className="astro-node"
      style={{
        borderColor,
        background: `linear-gradient(135deg, ${glowColor}28 0%, ${glowColor}0e 45%, #0a1628 100%)`,
        boxShadow: selected
          ? `0 0 0 2px #fff, 0 0 28px ${glowColor}aa, 0 4px 24px rgba(0,0,0,0.6)`
          : `0 0 18px ${glowColor}44, 0 0 6px ${glowColor}22, 0 4px 20px rgba(0,0,0,0.5)`,
      }}
    >
      <Handle type="target" position={Position.Top}    className="node-handle" />
      <Handle type="source" position={Position.Bottom} className="node-handle" />
      <Handle type="source" position={Position.Right}  className="node-handle node-handle--side" id="right" />
      <Handle type="target" position={Position.Left}   className="node-handle node-handle--side" id="left" />

      <div className="node-symbol" style={{ color: glowColor, textShadow: `0 0 16px ${glowColor}cc` }}>
        {symbol}
      </div>
      <div className="node-name">{name}</div>
      <div className="node-sign" style={{ color: glowColor }}>{sign}</div>
      {element && <div className="node-element" style={{ color: `${glowColor}bb` }}>{element}</div>}
    </div>
  )
}
