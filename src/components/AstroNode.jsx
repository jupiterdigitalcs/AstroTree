import { Handle, Position } from '@xyflow/react'

export default function AstroNode({ data, selected }) {
  const { name, sign, symbol, element, elementColor } = data

  const glowColor   = elementColor ?? '#c9a84c'
  const borderColor = selected ? '#ffffff' : (elementColor ? elementColor + 'aa' : '#c9a84c55')

  return (
    <div
      className="astro-node"
      style={{
        borderColor,
        boxShadow: selected
          ? `0 0 0 2px #fff, 0 0 24px ${glowColor}99, 0 4px 20px rgba(0,0,0,0.5)`
          : `0 0 18px ${glowColor}55, 0 0 6px ${glowColor}33, 0 4px 20px rgba(0,0,0,0.5)`,
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
      {element && <div className="node-element" style={{ color: glowColor + 'cc' }}>{element}</div>}
    </div>
  )
}
