import { Handle, Position } from '@xyflow/react'

export default function AstroNode({ data, selected }) {
  const { name, sign, symbol, element, elementColor } = data

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
      <Handle type="source" position={Position.Right}  className="node-handle node-handle--side" id="right" />
      <Handle type="target" position={Position.Left}   className="node-handle node-handle--side" id="left" />

      <div className="node-symbol" style={{ color: glow, filter: `drop-shadow(0 0 10px ${glow}99)` }}>
        {symbol}
      </div>
      <div className="node-name">{name}</div>
      <div className="node-sign" style={{ color: glow }}>{sign}</div>
      {element && (
        <div className="node-element" style={{ color: `${glow}99` }}>{element}</div>
      )}
    </div>
  )
}
