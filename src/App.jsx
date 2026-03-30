import { useState, useCallback, useEffect, useMemo } from 'react'
import { toPng } from 'html-to-image'
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import AddMembersForm  from './components/AddMembersForm.jsx'
import AstroNode       from './components/AstroNode.jsx'
import EditMemberPanel from './components/EditMemberPanel.jsx'
import ChartsPanel     from './components/ChartsPanel.jsx'
import InsightsPanel   from './components/InsightsPanel.jsx'
import { getSunSign, getElement } from './utils/astrology.js'
import { applyDagreLayout }      from './utils/layout.js'
import { saveDraft, loadDraft }  from './utils/storage.js'

const NODE_TYPES = { astro: AstroNode }

const EDGE_STYLE   = { stroke: '#c9a84c', strokeWidth: 1.5 }
const SPOUSE_STYLE = { stroke: '#d4a0bc', strokeWidth: 1.5, strokeDasharray: '6,4' }

function makeEdge(source, target, relationType = 'parent-child') {
  const isSpouse = relationType === 'spouse'
  return {
    id: `e-${source}-${target}`, source, target,
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

// ── Social icons ──────────────────────────────────────────────────────────────
function IgIcon()     { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg> }
function MailIcon()   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> }
function EtsyIcon()   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> }
function XIcon()      { return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg> }
function TikTokIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/></svg> }

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
  const [editingNodeId,  setEditingNodeId]  = useState(null)
  const [chartsOpen,     setChartsOpen]     = useState(false)
  const [insightsOpen,   setInsightsOpen]   = useState(false)
  const [layoutTick,     setLayoutTick]     = useState(0)
  const [sidebarOpen,    setSidebarOpen]    = useState(true)
  const [exporting,      setExporting]      = useState(false)
  const [exportError,    setExportError]    = useState(null)

  // ── Restore draft on first load ───────────────────────────────────────────
  useEffect(() => {
    const draft = loadDraft()
    if (draft?.nodes?.length > 0) {
      setNodes(draft.nodes)
      setEdges(draft.edges)
      setCounter(draft.counter ?? 1)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Autosave draft on every change (debounced 600ms) ─────────────────────
  useEffect(() => {
    const t = setTimeout(() => saveDraft(nodes, edges, counter), 600)
    return () => clearTimeout(t)
  }, [nodes, edges, counter])

  // ── Layout on edge / node count changes ──────────────────────────────────
  useEffect(() => {
    if (nodes.length === 0) return
    setNodes(prev => applyDagreLayout(prev, edges))
    setLayoutTick(t => t + 1)
  }, [edges, nodes.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Spouse edges: route straight across using side handles ────────────────
  const edgesForDisplay = useMemo(() =>
    edges.map(edge => {
      if (edge.data?.relationType !== 'spouse') return edge
      const src = nodes.find(n => n.id === edge.source)
      const tgt = nodes.find(n => n.id === edge.target)
      if (!src || !tgt) return edge
      const srcLeft = src.position.x <= tgt.position.x
      return {
        ...edge, type: 'straight',
        sourceHandle: srcLeft ? 'right' : 'left',
        targetHandle: srcLeft ? 'left'  : 'right',
      }
    }),
    [edges, nodes]
  )

  // ── Add (atomic, supports multiple members) ───────────────────────────────
  function handleAdd({ members, relationships = {} }) {
    const { parentIds = [], childIds = [], spouseIds = [] } = relationships
    const startIdx  = counter
    const primaryId = `node-${startIdx}`
    const newNodes  = members.map((m, i) => ({
      id: `node-${startIdx + i}`, type: 'astro',
      position: { x: 0, y: 0 }, data: buildNodeData(m),
    }))
    const newEdges = [
      ...parentIds.map(p => makeEdge(p,         primaryId)),
      ...childIds .map(c => makeEdge(primaryId, c)),
      ...spouseIds.map(s => makeEdge(primaryId, s, 'spouse')),
    ]
    setNodes(prev => [...prev, ...newNodes])
    setEdges(prev => [...prev, ...newEdges])
    setCounter(c => c + members.length)
    // On mobile, close sidebar after adding so the chart is visible
    if (window.innerWidth <= 768) setSidebarOpen(false)
  }

  // ── Update / delete ───────────────────────────────────────────────────────
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
    setEditingNodeId(null)
  }, [setNodes])

  const handleDelete = useCallback((id) => {
    setNodes(prev => prev.filter(n => n.id !== id))
    setEdges(prev => prev.filter(e => e.source !== id && e.target !== id))
    setEditingNodeId(null)
  }, [setNodes, setEdges])

  // ── Edge management ───────────────────────────────────────────────────────
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

  const onNodeClick = useCallback((_e, node) => {
    setEditingNodeId(id => id === node.id ? null : node.id)
    setChartsOpen(false)
    setSidebarOpen(true)
  }, [])

  const onConnect = useCallback(
    (params) => setEdges(eds => addEdge({ ...params, animated: true, style: EDGE_STYLE, type: 'smoothstep' }, eds)),
    [setEdges],
  )

  // ── Charts ────────────────────────────────────────────────────────────────
  const handleLoadChart = useCallback((chart) => {
    setNodes(chart.nodes); setEdges(chart.edges); setCounter(chart.counter)
    setEditingNodeId(null); setChartsOpen(false); setInsightsOpen(false)
  }, [setNodes, setEdges])

  const handleNewChart = useCallback(() => {
    setNodes([]); setEdges([]); setCounter(1)
    setEditingNodeId(null); setChartsOpen(false); setInsightsOpen(false)
  }, [setNodes, setEdges])

  const handleRelayout = useCallback(() => {
    setNodes(prev => applyDagreLayout(prev, edges))
    setLayoutTick(t => t + 1)
  }, [edges, setNodes])

  // ── Export: tree image + insights HTML ───────────────────────────────────
  const handleExport = useCallback(async () => {
    const el = document.querySelector('.react-flow')
    if (!el || exporting) return
    setExportError(null)

    // Open the window synchronously (within user gesture) before any await,
    // so popup blockers don't interfere.
    const win = window.open('', '_blank')
    if (!win) {
      setExportError('Popup blocked — please allow popups for this site and try again.')
      return
    }

    setExporting(true)
    try {
      const dataUrl = await toPng(el, { backgroundColor: '#09071a', pixelRatio: 2 })

      // Build insights HTML
      const ELEMENTS = ['Fire','Earth','Air','Water']
      const elCounts = Object.fromEntries(ELEMENTS.map(e => [e, 0]))
      nodes.forEach(n => { if (elCounts[n.data.element] !== undefined) elCounts[n.data.element]++ })
      const total    = nodes.length
      const dominant = ELEMENTS.reduce((a, b) => elCounts[a] >= elCounts[b] ? a : b)
      const ELEMENT_ENERGY = { Fire:'passionate & driven', Earth:'grounded & practical', Air:'curious & communicative', Water:'intuitive & emotional' }
      const elColors = { Fire:'#ff6b35', Earth:'#7ec845', Air:'#5bc8f5', Water:'#9b5de5' }

      const signCounts = {}
      nodes.forEach(n => { signCounts[n.data.sign] = (signCounts[n.data.sign] || 0) + 1 })
      const sharedSigns = Object.entries(signCounts).filter(([, c]) => c > 1)

      const spouseEdges = edges.filter(e => e.data?.relationType === 'spouse')
      function compatible(a, b) { return a===b || (a==='Fire'&&b==='Air') || (a==='Air'&&b==='Fire') || (a==='Earth'&&b==='Water') || (a==='Water'&&b==='Earth') }
      const couples = spouseEdges.map(e => {
        const s = nodes.find(n => n.id === e.source), t = nodes.find(n => n.id === e.target)
        return s && t ? { s, t, ok: compatible(s.data.element, t.data.element) } : null
      }).filter(Boolean)

      const elBars = ELEMENTS.map(el => {
        const pct = total > 0 ? Math.round(elCounts[el] / total * 100) : 0
        return `<div style="display:grid;grid-template-columns:3.5rem 1fr 1.5rem;gap:8px;align-items:center;margin-bottom:6px">
          <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:${elColors[el]}">${el}</span>
          <div style="height:5px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden">
            <div style="width:${pct}%;height:100%;background:${elColors[el]};border-radius:3px"></div>
          </div>
          <span style="font-size:11px;color:${elColors[el]};text-align:right">${elCounts[el]}</span>
        </div>`
      }).join('')

      const insightsHtml = `
        <div style="padding:28px 32px;font-family:'Cinzel',serif;color:#ede6ff;background:#09071a">
          <div style="font-size:11px;letter-spacing:0.3em;color:#c9a84c;text-transform:uppercase;margin-bottom:6px">Jupiter Digital</div>
          <h2 style="font-size:22px;color:#e6c76e;letter-spacing:0.15em;margin-bottom:4px">AstroTree — Family Insights</h2>
          <p style="font-size:12px;color:#8878aa;letter-spacing:0.08em;margin-bottom:24px">Family Celestial Chart · ${new Date().toLocaleDateString()}</p>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">

            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:16px">
              <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.14em;color:#c9a84c;margin-bottom:12px">Elemental Makeup</div>
              ${elBars}
              <p style="font-size:12px;color:#b8aad4;margin-top:8px">
                Your family is <strong style="color:${elColors[dominant]}">${ELEMENT_ENERGY[dominant]}</strong>.
              </p>
            </div>

            <div style="display:flex;flex-direction:column;gap:12px">
              ${sharedSigns.length > 0 ? `
              <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:16px">
                <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.14em;color:#c9a84c;margin-bottom:10px">Shared Signs</div>
                ${sharedSigns.map(([sign]) => {
                  const members = nodes.filter(n => n.data.sign === sign)
                  return `<p style="font-size:12px;color:#ede6ff;margin-bottom:4px">
                    ${members[0].data.symbol} <strong>${sign}</strong> — ${members.map(m => m.data.name).join(', ')}
                  </p>`
                }).join('')}
              </div>` : ''}

              ${couples.length > 0 ? `
              <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:16px">
                <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.14em;color:#c9a84c;margin-bottom:10px">Partner Compatibility</div>
                ${couples.map(({ s, t, ok }) =>
                  `<p style="font-size:12px;color:#ede6ff;margin-bottom:6px">
                    ${s.data.symbol} ${s.data.name} &amp; ${t.data.symbol} ${t.data.name}<br/>
                    <span style="color:${ok ? '#7ec845' : '#c9a84c'};font-size:11px">${ok ? '✓ Harmonious elements' : '◇ Complementary energies'}</span>
                  </p>`
                ).join('')}
              </div>` : ''}
            </div>

          </div>
        </div>`

      win.document.write(`<!DOCTYPE html><html><head>
        <title>AstroTree — Jupiter Digital</title>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500&display=swap" rel="stylesheet">
        <style>
          *{margin:0;padding:0;box-sizing:border-box}
          body{background:#09071a;color:#ede6ff;font-family:'Cinzel',serif}
          .tree-img{width:100%;display:block;page-break-after:always}
          @media print{*{-webkit-print-color-adjust:exact!important;color-adjust:exact!important}}
        </style>
      </head><body>
        <img class="tree-img" src="${dataUrl}"/>
        ${insightsHtml}
        <script>setTimeout(()=>window.print(),800)</script>
      </body></html>`)
      win.document.close()
    } catch (err) {
      win.close()
      setExportError('Export failed — please try again.')
    } finally {
      setExporting(false)
    }
  }, [exporting, nodes, edges])

  const editingNode = editingNodeId ? nodes.find(n => n.id === editingNodeId) : null

  return (
    <div className="app">
      {/* Starfield — memoised so positions don't re-randomise on every render */}
      <div className="stars" aria-hidden="true">
        {useMemo(() => Array.from({ length: 120 }).map((_, i) => (
          <span key={i} className="star" style={{
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            width: `${Math.random() * 2 + 1}px`, height: `${Math.random() * 2 + 1}px`,
            animationDelay: `${Math.random() * 4}s`, animationDuration: `${Math.random() * 3 + 2}s`,
          }} />
        )), [])}
      </div>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-drag-handle" onClick={() => setSidebarOpen(false)} />

        {/* Brand */}
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

          {/* ── Editing a member ────────────────────────────────────────── */}
          {editingNode ? (
            <>
              <button
                type="button"
                className="back-btn"
                onClick={() => setEditingNodeId(null)}
              >← Back to Family</button>
              <EditMemberPanel
                key={editingNode.id}
                node={editingNode}
                allNodes={nodes}
                edges={edges}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onAddEdge={handleAddEdge}
                onRemoveEdge={handleRemoveEdge}
                onCancel={() => setEditingNodeId(null)}
              />
            </>

          /* ── Family Insights ──────────────────────────────────────────── */
          ) : insightsOpen ? (
            <>
              <button
                type="button"
                className="back-btn"
                onClick={() => setInsightsOpen(false)}
              >← Back to Family</button>
              <InsightsPanel nodes={nodes} edges={edges} />
            </>

          /* ── Saved charts ─────────────────────────────────────────────── */
          ) : chartsOpen ? (
            <>
              <button
                type="button"
                className="back-btn"
                onClick={() => setChartsOpen(false)}
              >← Back to Family</button>
              <ChartsPanel
                nodes={nodes} edges={edges} counter={counter}
                onLoad={handleLoadChart} onNew={handleNewChart}
              />
            </>

          /* ── Main panel ───────────────────────────────────────────────── */
          ) : (
            <>
              {/* Empty-state hint */}
              {nodes.length === 0 && (
                <div className="start-hint">
                  <p>Welcome — fill in a name and birthday below to build your family's celestial chart.</p>
                </div>
              )}

              {/* Add form — always visible */}
              <AddMembersForm onAdd={handleAdd} />

              {/* Member list */}
              {nodes.length > 0 && (
                <div className="member-list">
                  <div className="member-list-header">
                    <h3>Your Family · {nodes.length}</h3>
                    <span className="member-list-hint">tap to connect &amp; edit</span>
                  </div>
                  {nodes.map(n => (
                    <div key={n.id} className="member-pill"
                      style={{ borderColor: `${n.data.elementColor}44`, cursor: 'pointer' }}
                      onClick={() => { setEditingNodeId(n.id); setSidebarOpen(true) }}
                    >
                      <span>{n.data.symbol}</span>
                      <span>{n.data.name}</span>
                      <span className="pill-sign" style={{ color: n.data.elementColor }}>
                        {n.data.sign}
                        {n.data.birthdate && (
                          <span className="pill-year"> · {n.data.birthdate.slice(0, 4)}</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <footer className="sidebar-footer">
          <div className="footer-actions">
            <button
              type="button"
              className="footer-action-btn footer-action-btn--insights"
              onClick={() => { setInsightsOpen(o => !o); setEditingNodeId(null); setChartsOpen(false) }}
              disabled={nodes.length === 0}
            >
              {insightsOpen ? '← My Family' : '✦ Family Insights'}
            </button>
          </div>
          <div className="footer-actions footer-actions--secondary">
            <button
              type="button"
              className="footer-action-btn"
              onClick={() => { setChartsOpen(o => !o); setEditingNodeId(null); setInsightsOpen(false) }}
            >
              {chartsOpen ? '← My Family' : '📚 Saved Charts'}
            </button>
            <button
              type="button"
              className="footer-action-btn footer-action-btn--gold"
              onClick={handleExport}
              disabled={exporting || nodes.length === 0}
            >
              {exporting ? '…' : '⬇ Export PDF'}
            </button>
          </div>
          {exportError && (
            <p className="export-error">{exportError}</p>
          )}
          <div className="social-links">
            <a href="https://instagram.com/jupreturns" className="social-link" target="_blank" rel="noopener noreferrer" title="Instagram"><IgIcon /><span>@jupreturn</span></a>
            <a href="https://www.tiktok.com/@jupiterdigital" className="social-link" target="_blank" rel="noopener noreferrer" title="TikTok"><TikTokIcon /><span>TikTok</span></a>
            <a href="https://x.com/jupiter_dig" className="social-link" target="_blank" rel="noopener noreferrer" title="X"><XIcon /><span>X</span></a>
            <a href="https://etsy.com/shop/jupiterdigital" className="social-link" target="_blank" rel="noopener noreferrer" title="Etsy"><EtsyIcon /><span>Etsy</span></a>
            <a href="mailto:jupreturns@gmail.com" className="social-link" title="Email"><MailIcon /><span>Email</span></a>
          </div>
        </footer>
      </aside>

      {/* Mobile toggle */}
      <button
        type="button"
        className="sidebar-toggle-btn"
        onClick={() => setSidebarOpen(o => !o)}
      >
        {sidebarOpen ? '✕ Close' : '🪐 My Family'}
      </button>

      {/* ── Canvas ──────────────────────────────────────────────────────── */}
      <main className="canvas">
        {nodes.length === 0 && (
          <div className="welcome-screen">
            <div className="welcome-content">
              <div className="welcome-jd-badge">Jupiter Digital</div>
              <div className="welcome-logo">🪐</div>
              <h2 className="welcome-title">AstroTree</h2>
              <p className="welcome-tagline">
                Discover the celestial patterns<br />woven through your family
              </p>
              <div className="welcome-steps">
                <div className="welcome-step"><span className="welcome-step-icon">✦</span><span>Add family members with their birthdates</span></div>
                <div className="welcome-step"><span className="welcome-step-icon">✦</span><span>Connect parents, children &amp; partners</span></div>
                <div className="welcome-step"><span className="welcome-step-icon">✦</span><span>Reveal your family's cosmic blueprint</span></div>
              </div>
              <button type="button" className="welcome-cta"
                onClick={() => { setSidebarOpen(true) }}>
                Begin Charting →
              </button>
              <p className="welcome-mobile-hint">Tap <strong>🪐 My Family</strong> below to start</p>
            </div>
          </div>
        )}

        <ReactFlow
          nodes={nodes} edges={edgesForDisplay}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={onConnect} onNodeClick={onNodeClick}
          nodeTypes={NODE_TYPES}
          fitView fitViewOptions={{ padding: 0.3 }}
          minZoom={0.3} colorMode="dark"
          proOptions={{ hideAttribution: true }}
        >
          <FitViewOnLayout layoutTick={layoutTick} />
          <Background color="#1a1040" gap={36} size={1} />
          <Controls style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }} />

          {/* Top-right: Re-layout + Insights shortcut */}
          <Panel position="top-right">
            <div className="canvas-panel-btns">
              {nodes.length > 0 && (
                <button
                  type="button"
                  className="relayout-btn relayout-btn--insights"
                  onClick={() => {
                    setInsightsOpen(true)
                    setChartsOpen(false)
                    setEditingNodeId(null)
                    setSidebarOpen(true)
                  }}
                >
                  ✦ Insights
                </button>
              )}
              <button type="button" className="relayout-btn" onClick={handleRelayout}>
                ⟳ Re-layout
              </button>
            </div>
          </Panel>

          {/* Bottom-right: Jupiter Digital watermark */}
          <Panel position="bottom-right">
            <div className="canvas-brand">
              <span className="canvas-brand-logo">🪐</span>
              <div className="canvas-brand-text">
                <span className="canvas-brand-name">Jupiter Digital</span>
                <span className="canvas-brand-sub">AstroTree</span>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </main>
    </div>
  )
}
