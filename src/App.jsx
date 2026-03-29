import { useState, useCallback, useEffect, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import AddMemberForm   from './components/AddMemberForm.jsx'
import BulkAddForm     from './components/BulkAddForm.jsx'
import AstroNode       from './components/AstroNode.jsx'
import EditMemberPanel from './components/EditMemberPanel.jsx'
import ChartsPanel     from './components/ChartsPanel.jsx'
import InsightsPanel   from './components/InsightsPanel.jsx'
import { getSunSign, getElement } from './utils/astrology.js'
import { applyDagreLayout }       from './utils/layout.js'

const NODE_TYPES = { astro: AstroNode }

const EDGE_STYLE   = { stroke: '#c9a84c', strokeWidth: 1.5 }
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
function IgIcon()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg> }
function MailIcon()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> }
function EtsyIcon()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> }
function XIcon()      { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg> }
function TikTokIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/></svg> }

// ── Auto-fitView after layout ─────────────────────────────────────────────────
function FitViewOnLayout({ layoutTick }) {
  const { fitView } = useReactFlow()
  useEffect(() => {
    if (layoutTick === 0) return
    const t = setTimeout(() => fitView({ padding: 0.3, duration: 400 }), 60)
    return () => clearTimeout(t)
  }, [layoutTick, fitView])
  return null
}

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [counter,        setCounter]        = useState(1)
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [mode,           setMode]           = useState('add') // 'add' | 'bulk' | 'charts' | 'insights'
  const [layoutTick,     setLayoutTick]     = useState(0)
  const [sidebarOpen,    setSidebarOpen]    = useState(true)

  // ── Auto-layout on edge changes OR node count changes ────────────────────
  useEffect(() => {
    if (nodes.length === 0) return
    setNodes(prev => applyDagreLayout(prev, edges))
    setLayoutTick(t => t + 1)
  }, [edges, nodes.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Spouse edges: route straight across using side handles ───────────────
  // Derive display edges so spouse lines go left→right between side handles
  const edgesForDisplay = useMemo(() =>
    edges.map(edge => {
      if (edge.data?.relationType !== 'spouse') return edge
      const src = nodes.find(n => n.id === edge.source)
      const tgt = nodes.find(n => n.id === edge.target)
      if (!src || !tgt) return edge
      const srcLeft = src.position.x <= tgt.position.x
      return {
        ...edge,
        type:         'straight',
        sourceHandle: srcLeft ? 'right' : 'left',
        targetHandle: srcLeft ? 'left'  : 'right',
      }
    }),
    [edges, nodes]
  )

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
    setSidebarOpen(true)
  }, [])

  const onConnect = useCallback(
    (params) => setEdges(eds => addEdge({ ...params, animated: true, style: EDGE_STYLE, type: 'smoothstep' }, eds)),
    [setEdges],
  )

  // ── Charts: load / new ───────────────────────────────────────────────────
  const handleLoadChart = useCallback((chart) => {
    setNodes(chart.nodes)
    setEdges(chart.edges)
    setCounter(chart.counter)
    setSelectedNodeId(null)
    setMode('add')
  }, [setNodes, setEdges])

  const handleNewChart = useCallback(() => {
    setNodes([])
    setEdges([])
    setCounter(1)
    setSelectedNodeId(null)
    setMode('add')
  }, [setNodes, setEdges])

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

      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        {/* ── Drag handle (mobile) ─────────────────────────────────────── */}
        <div className="sidebar-drag-handle" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle panel" />

        {/* ── Brand header ────────────────────────────────────────────── */}
        <div className="brand-header">
          <div className="brand-logo">🪐</div>
          <div className="brand-text">
            <p className="brand-name">Jupiter Digital</p>
            <h1 className="brand-app">AstroTree</h1>
            <p className="brand-sub">Family Celestial Chart</p>
          </div>
        </div>

        {/* ── Scrollable content ──────────────────────────────────────── */}
        <div className="sidebar-content">
          {!selectedNode && (
            <div className="mode-tabs">
              {[['add','Add One'],['bulk','Bulk'],['charts','Charts'],['insights','Insights']].map(([k, label]) => (
                <button key={k} type="button"
                  className={`mode-tab ${mode === k ? 'active' : ''}`}
                  onClick={() => setMode(k)}
                >{label}</button>
              ))}
            </div>
          )}

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
          ) : mode === 'charts' ? (
            <ChartsPanel
              nodes={nodes} edges={edges} counter={counter}
              onLoad={handleLoadChart} onNew={handleNewChart}
            />
          ) : mode === 'insights' ? (
            <InsightsPanel nodes={nodes} edges={edges} />
          ) : (
            <AddMemberForm onAdd={handleAdd} existingNodes={nodes} />
          )}

          {nodes.length > 0 && !selectedNode && mode === 'add' && (
            <div className="member-list">
              <h3>Members</h3>
              {nodes.map(n => (
                <div key={n.id} className="member-pill"
                  style={{ borderColor: `${n.data.elementColor}66`, cursor: 'pointer' }}
                  onClick={() => { setSelectedNodeId(n.id); setSidebarOpen(true) }}
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
            <a href="https://instagram.com/jupiterdigital" className="social-link" target="_blank" rel="noopener noreferrer" title="Instagram"><IgIcon /><span>Instagram</span></a>
            <a href="https://www.tiktok.com/@jupiterdigital" className="social-link" target="_blank" rel="noopener noreferrer" title="TikTok"><TikTokIcon /><span>TikTok</span></a>
            <a href="https://x.com/jupiterdigital" className="social-link" target="_blank" rel="noopener noreferrer" title="X (Twitter)"><XIcon /><span>X</span></a>
            <a href="https://etsy.com/shop/jupiterdigital" className="social-link" target="_blank" rel="noopener noreferrer" title="Etsy"><EtsyIcon /><span>Etsy</span></a>
            <a href="mailto:hello@jupiterdigital.com" className="social-link" title="Email"><MailIcon /><span>Email</span></a>
          </div>
        </footer>
      </aside>

      {/* Mobile toggle button */}
      <button
        type="button"
        className="sidebar-toggle-btn"
        onClick={() => setSidebarOpen(o => !o)}
        aria-label={sidebarOpen ? 'Close panel' : 'Open panel'}
      >
        {sidebarOpen ? '✕ Close' : '🪐 Menu'}
      </button>

      <main className="canvas">
        {nodes.length === 0 && (
          <div className="empty-state">
            <div className="empty-symbol">🪐</div>
            <p>Add your first family member to begin charting the stars.</p>
          </div>
        )}
        <ReactFlow
          nodes={nodes}
          edges={edgesForDisplay}
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
          <FitViewOnLayout layoutTick={layoutTick} />
          <Background color="#1e2a4a" gap={32} size={1} />
          <Controls style={{ background: '#0d1b3e', border: '1px solid #c9a84c33' }} />
          <MiniMap
            nodeColor={n => n.data?.elementColor ?? '#c9a84c'}
            maskColor="rgba(5, 10, 30, 0.7)"
            style={{ background: '#0d1b3e', border: '1px solid #c9a84c33' }}
          />
          <Panel position="top-right">
            <button type="button" className="relayout-btn"
              onClick={() => { setNodes(prev => applyDagreLayout(prev, edges)); setLayoutTick(t => t + 1) }}
            >⟳ Re-layout</button>
          </Panel>
        </ReactFlow>
      </main>
    </div>
  )
}
