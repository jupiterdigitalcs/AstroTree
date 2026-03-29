import { useState, useCallback, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import AddMemberForm    from './components/AddMemberForm.jsx'
import AstroNode        from './components/AstroNode.jsx'
import EditMemberPanel  from './components/EditMemberPanel.jsx'
import { getSunSign, getElement } from './utils/astrology.js'
import { applyDagreLayout }       from './utils/layout.js'

const NODE_TYPES = { astro: AstroNode }

function buildNodeData(member) {
  const { sign, symbol }   = getSunSign(member.birthdate)
  const { element, color } = getElement(sign)
  return {
    name:         member.name,
    birthdate:    member.birthdate,
    sign,
    symbol,
    element,
    elementColor: color,
  }
}

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [counter,        setCounter]        = useState(1)
  const [selectedNodeId, setSelectedNodeId] = useState(null)

  // ── Auto-layout whenever edges change (edges are set last in handleAdd) ──
  useEffect(() => {
    if (nodes.length === 0) return
    setNodes(prev => applyDagreLayout(prev, edges))
  }, [edges]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Add ──────────────────────────────────────────────────────────────────
  function handleAdd(member) {
    const id   = `node-${counter}`
    const node = {
      id,
      type: 'astro',
      position: { x: 0, y: 0 }, // dagre will set real position
      data: buildNodeData(member),
    }

    const makeEdge = (source, target, relationType = 'parent-child') => ({
      id:       `e-${source}-${target}`,
      source,   target,
      data:     { relationType },
      animated: relationType !== 'spouse',
      style:    relationType === 'spouse'
        ? { stroke: '#e879a8', strokeWidth: 1.5, strokeDasharray: '5,4' }
        : { stroke: '#c9a84c', strokeWidth: 1.5 },
      type: 'smoothstep',
    })

    const parentEdges = (member.parentIds ?? []).map(p  => makeEdge(p,   id))
    const childEdges  = (member.childIds  ?? []).map(c  => makeEdge(id,  c))
    const spouseEdges = (member.spouseIds ?? []).map(s  => makeEdge(id,  s,  'spouse'))

    setNodes(prev => [...prev, node])
    setEdges(prev => [...prev, ...parentEdges, ...childEdges, ...spouseEdges])
    setCounter(c => c + 1)
  }

  // ── Update (edit panel) ───────────────────────────────────────────────────
  const handleUpdate = useCallback((id, patch) => {
    setNodes(prev => prev.map(n => {
      if (n.id !== id) return n
      const updated = { ...n.data, ...patch }
      // Recalculate sign & element if birthdate changed
      if (patch.birthdate && patch.birthdate !== n.data.birthdate) {
        const { sign, symbol }   = getSunSign(patch.birthdate)
        const { element, color } = getElement(sign)
        Object.assign(updated, { sign, symbol, element, elementColor: color })
      }
      return { ...n, data: updated }
    }))
    setSelectedNodeId(null)
  }, [setNodes])

  // ── Add / remove individual edges ────────────────────────────────────────
  const handleAddEdge = useCallback((source, target, relationType = 'parent-child') => {
    setEdges(prev => {
      if (source === target) return prev
      // Deduplicate — for spouse check both directions
      const dup = relationType === 'spouse'
        ? prev.some(e => (e.source === source && e.target === target) || (e.source === target && e.target === source))
        : prev.some(e =>  e.source === source && e.target === target)
      if (dup) return prev
      // Block direct reverse for hierarchical edges
      if (relationType !== 'spouse' && prev.some(e => e.source === target && e.target === source)) return prev

      const isSpouse = relationType === 'spouse'
      return [...prev, {
        id: `e-${source}-${target}`, source, target,
        data:     { relationType },
        animated: !isSpouse,
        style:    isSpouse
          ? { stroke: '#e879a8', strokeWidth: 1.5, strokeDasharray: '5,4' }
          : { stroke: '#c9a84c', strokeWidth: 1.5 },
        type: 'smoothstep',
      }]
    })
  }, [setEdges])

  const handleRemoveEdge = useCallback((edgeId) => {
    setEdges(prev => prev.filter(e => e.id !== edgeId))
  }, [setEdges])

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = useCallback((id) => {
    setNodes(prev => prev.filter(n => n.id !== id))
    setEdges(prev => prev.filter(e => e.source !== id && e.target !== id))
    setSelectedNodeId(null)
  }, [setNodes, setEdges])

  // ── Node click → open edit panel ─────────────────────────────────────────
  const onNodeClick = useCallback((_event, node) => {
    setSelectedNodeId(id => id === node.id ? null : node.id)
  }, [])

  const onConnect = useCallback(
    (params) => setEdges(eds =>
      addEdge({ ...params, animated: true, style: { stroke: '#c9a84c', strokeWidth: 1.5 }, type: 'smoothstep' }, eds)
    ),
    [setEdges],
  )

  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null

  return (
    <div className="app">
      {/* Starfield */}
      <div className="stars" aria-hidden="true">
        {Array.from({ length: 120 }).map((_, i) => (
          <span
            key={i}
            className="star"
            style={{
              left:              `${Math.random() * 100}%`,
              top:               `${Math.random() * 100}%`,
              width:             `${Math.random() * 2 + 1}px`,
              height:            `${Math.random() * 2 + 1}px`,
              animationDelay:    `${Math.random() * 4}s`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          />
        ))}
      </div>

      <aside className="sidebar">
        <div className="logo">
          <span className="logo-symbol">✦</span>
          <h1>AstroTree</h1>
          <p className="logo-sub">Family Celestial Chart</p>
        </div>

        {selectedNode ? (
          <EditMemberPanel
            key={selectedNode.id}
            node={selectedNode}
            allNodes={nodes}
            edges={edges}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onAddEdge={handleAddEdge}
            onRemoveEdge={handleRemoveEdge}
            onCancel={() => setSelectedNodeId(null)}
          />
        ) : (
          <AddMemberForm onAdd={handleAdd} existingNodes={nodes} />
        )}

        {nodes.length > 0 && !selectedNode && (
          <div className="member-list">
            <h3>Members</h3>
            {nodes.map(n => (
              <div
                key={n.id}
                className="member-pill"
                style={{ borderColor: n.data.elementColor + '66', cursor: 'pointer' }}
                onClick={() => setSelectedNodeId(n.id)}
              >
                <span>{n.data.symbol}</span>
                <span>{n.data.name}</span>
                <span className="pill-sign" style={{ color: n.data.elementColor }}>{n.data.sign}</span>
              </div>
            ))}
          </div>
        )}
      </aside>

      <main className="canvas">
        {nodes.length === 0 && (
          <div className="empty-state">
            <div className="empty-symbol">✦</div>
            <p>Add your first family member to begin charting the stars.</p>
          </div>
        )}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={NODE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.3}
          colorMode="dark"
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#1e2a4a" gap={32} size={1} />
          <Controls style={{ background: '#0d1b3e', border: '1px solid #c9a84c33' }} />
          <MiniMap
            nodeColor={n => n.data?.elementColor ?? '#c9a84c'}
            maskColor="rgba(5, 10, 30, 0.7)"
            style={{ background: '#0d1b3e', border: '1px solid #c9a84c33' }}
          />
        </ReactFlow>
      </main>
    </div>
  )
}
