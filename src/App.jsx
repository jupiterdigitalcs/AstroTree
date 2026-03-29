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

import AddMemberForm   from './components/AddMemberForm.jsx'
import BulkAddForm     from './components/BulkAddForm.jsx'
import AstroNode       from './components/AstroNode.jsx'
import EditMemberPanel from './components/EditMemberPanel.jsx'
import { getSunSign, getElement } from './utils/astrology.js'
import { applyDagreLayout }       from './utils/layout.js'

const NODE_TYPES = { astro: AstroNode }

const EDGE_STYLE  = { stroke: '#c9a84c', strokeWidth: 1.5 }
const SPOUSE_STYLE = { stroke: '#e879a8', strokeWidth: 1.5, strokeDasharray: '5,4' }

function makeEdge(source, target, relationType = 'parent-child') {
  const isSpouse = relationType === 'spouse'
  return {
    id: `e-${source}-${target}`,
    source, target,
    data:     { relationType },
    animated: !isSpouse,
    style:    isSpouse ? SPOUSE_STYLE : EDGE_STYLE,
    type:     'smoothstep',
  }
}

function buildNodeData(member) {
  const { sign, symbol }   = getSunSign(member.birthdate)
  const { element, color } = getElement(sign)
  return { name: member.name, birthdate: member.birthdate, sign, symbol, element, elementColor: color }
}

// ── Social link icons ─────────────────────────────────────────────────────────
function IgIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg> }
function MailIcon()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> }
function EtsyIcon()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> }

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [counter,        setCounter]        = useState(1)
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [mode,           setMode]           = useState('add') // 'add' | 'bulk'

  // ── Auto-layout on edge changes OR node count changes (bulk add) ──────────
  useEffect(() => {
    if (nodes.length === 0) return
    setNodes(prev => applyDagreLayout(prev, edges))
  }, [edges, nodes.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Add single ───────────────────────────────────────────────────────────
  function handleAdd(member) {
    const id   = `node-${counter}`
    const node = { id, type: 'astro', position: { x: 0, y: 0 }, data: buildNodeData(member) }

    const newEdges = [
      ...(member.parentIds ?? []).map(p => makeEdge(p,  id)),
      ...(member.childIds  ?? []).map(c => makeEdge(id, c)),
      ...(member.spouseIds ?? []).map(s => makeEdge(id, s, 'spouse')),
    ]

    setNodes(prev => [...prev, node])
    setEdges(prev => [...prev, ...newEdges])
    setCounter(c => c + 1)
  }

  // ── Bulk add ─────────────────────────────────────────────────────────────
  function handleBulkAdd(members) {
    const newNodes = members.map((m, i) => ({
      id:       `node-${counter + i}`,
      type:     'astro',
      position: { x: 0, y: 0 },
      data:     buildNodeData(m),
    }))
    setNodes(prev => [...prev, ...newNodes])
    setCounter(c => c + members.length)
    setMode('add')
  }

  // ── Update ────────────────────────────────────────────────────────────────
  const handleUpdate = useCallback((id, patch) => {
    setNodes(prev => prev.map(n => {
      if (n.id !== id) return n
      const updated = { ...n.data, ...patch }
      if (patch.birthdate && patch.birthdate !== n.data.birthdate) {
        const { sign, symbol }   = getSunSign(patch.birthdate)
        const { element, color } = getElement(sign)
        Object.assign(updated, { sign, symbol, element, elementColor: color })
      }
      return { ...n, data: updated }
    }))
    setSelectedNodeId(null)
  }, [setNodes])

  // ── Add / remove edges ────────────────────────────────────────────────────
  const handleAddEdge = useCallback((source, target, relationType = 'parent-child') => {
    setEdges(prev => {
      if (source === target) return prev
      const isSpouse = relationType === 'spouse'
      const dup = isSpouse
        ? prev.some(e => (e.source === source && e.target === target) || (e.source === target && e.target === source))
        : prev.some(e =>  e.source === source && e.target === target)
      if (dup) return prev
      if (!isSpouse && prev.some(e => e.source === target && e.target === source)) return prev
      return [...prev, makeEdge(source, target, relationType)]
    })
  }, [setEdges])

  const handleRemoveEdge = useCallback((edgeId) => {
    setEdges(prev => prev.filter(e => e.id !== edgeId))
  }, [setEdges])

  // ── Delete node ───────────────────────────────────────────────────────────
  const handleDelete = useCallback((id) => {
    setNodes(prev => prev.filter(n => n.id !== id))
    setEdges(prev => prev.filter(e => e.source !== id && e.target !== id))
    setSelectedNodeId(null)
  }, [setNodes, setEdges])

  const onNodeClick = useCallback((_e, node) => {
    setSelectedNodeId(id => id === node.id ? null : node.id)
  }, [])

  const onConnect = useCallback(
    (params) => setEdges(eds => addEdge({ ...params, animated: true, style: EDGE_STYLE, type: 'smoothstep' }, eds)),
    [setEdges],
  )

  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null

  return (
    <div className="app">
      {/* Starfield */}
      <div className="stars" aria-hidden="true">
        {Array.from({ length: 120 }).map((_, i) => (
          <span key={i} className="star" style={{
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            width: `${Math.random() * 2 + 1}px`, height: `${Math.random() * 2 + 1}px`,
            animationDelay: `${Math.random() * 4}s`, animationDuration: `${Math.random() * 3 + 2}s`,
          }} />
        ))}
      </div>

      <aside className="sidebar">
        {/* ── Brand header ────────────────────────────────────────────── */}
        <div className="brand-header">
          <div className="brand-logo">
            {/* Replace with <img src="/logo.png" alt="Jupiter Digital" /> for your actual logo */}
            🪐
          </div>
          <div className="brand-text">
            <p className="brand-name">Jupiter Digital</p>
            <h1 className="brand-app">AstroTree</h1>
            <p className="brand-sub">Family Celestial Chart</p>
          </div>
        </div>

        {/* ── Scrollable content ──────────────────────────────────────── */}
        <div className="sidebar-content">
          {/* Mode tabs — hide when editing a node */}
          {!selectedNode && (
            <div className="mode-tabs">
              <button
                type="button"
                className={`mode-tab ${mode === 'add' ? 'active' : ''}`}
                onClick={() => setMode('add')}
              >Add One</button>
              <button
                type="button"
                className={`mode-tab ${mode === 'bulk' ? 'active' : ''}`}
                onClick={() => setMode('bulk')}
              >Bulk Add</button>
            </div>
          )}

          {/* Form panel */}
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
          ) : mode === 'bulk' ? (
            <BulkAddForm onBulkAdd={handleBulkAdd} onCancel={() => setMode('add')} />
          ) : (
            <AddMemberForm onAdd={handleAdd} existingNodes={nodes} />
          )}

          {/* Member list */}
          {nodes.length > 0 && !selectedNode && mode === 'add' && (
            <div className="member-list">
              <h3>Members</h3>
              {nodes.map(n => (
                <div
                  key={n.id}
                  className="member-pill"
                  style={{ borderColor: `${n.data.elementColor}66`, cursor: 'pointer' }}
                  onClick={() => setSelectedNodeId(n.id)}
                >
                  <span>{n.data.symbol}</span>
                  <span>{n.data.name}</span>
                  <span className="pill-sign" style={{ color: n.data.elementColor }}>{n.data.sign}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer / social links ────────────────────────────────────── */}
        <footer className="sidebar-footer">
          <div className="social-links">
            {/* TODO: replace href values with your actual links */}
            <a href="https://instagram.com/jupiterdigital" className="social-link" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <IgIcon />
              <span>Instagram</span>
            </a>
            <a href="https://etsy.com/shop/jupiterdigital" className="social-link" target="_blank" rel="noopener noreferrer" aria-label="Etsy">
              <EtsyIcon />
              <span>Etsy</span>
            </a>
            <a href="mailto:hello@jupiterdigital.com" className="social-link" aria-label="Email">
              <MailIcon />
              <span>Email</span>
            </a>
          </div>
        </footer>
      </aside>

      <main className="canvas">
        {nodes.length === 0 && (
          <div className="empty-state">
            <div className="empty-symbol">🪐</div>
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
