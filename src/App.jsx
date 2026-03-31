import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
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
import AboutPanel      from './components/AboutPanel.jsx'
import { getSunSign, getElement } from './utils/astrology.js'
import { applyDagreLayout }      from './utils/layout.js'
import { saveDraft, loadDraft, saveChart, loadCharts }  from './utils/storage.js'

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


// ── Fit the view whenever fitTick increments ──────────────────────────────────
function FitViewOnLayout({ fitTick, fitViewRef }) {
  const { fitView } = useReactFlow()
  fitViewRef.current = fitView
  useEffect(() => {
    if (fitTick === 0) return
    const t = setTimeout(() => fitView({ padding: 0.25, duration: 400 }), 80)
    return () => clearTimeout(t)
  }, [fitTick, fitView])
  return null
}


export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [counter,           setCounter]           = useState(1)
  const [editingNodeId,     setEditingNodeId]     = useState(null)
  // 'tree' | 'add' | 'insights' | 'charts' | 'about'
  const [activeTab,         setActiveTab]         = useState('add')
  const [showAddMore,       setShowAddMore]       = useState(false)
  const [showConnectPrompt, setShowConnectPrompt] = useState(false)
  const [fitTick,           setFitTick]           = useState(0)
  const [exporting,         setExporting]         = useState(false)
  const [exportError,       setExportError]       = useState(null)
  // Tracks the ID of the last named save; null = never saved
  const [savedChartId,      setSavedChartId]      = useState(null)
  const [showSaveDialog,    setShowSaveDialog]    = useState(false)
  const [saveTitle,         setSaveTitle]         = useState('')
  const [pendingNewTree,    setPendingNewTree]    = useState(false)
  const [showNewTreeConfirm, setShowNewTreeConfirm] = useState(false)
  // True once the user has ever added members — shows compact welcome on next empty state
  const [hasUsedApp,        setHasUsedApp]        = useState(() => {
    try { return localStorage.getItem('astrotree_used') === '1' } catch { return false }
  })

  const fitViewRef = useRef(null)

  // Mobile panel is open when not on the tree tab, or when editing a node
  const panelOpen = activeTab !== 'tree' || !!editingNodeId

  // ── Restore draft on first load ───────────────────────────────────────────
  useEffect(() => {
    const draft = loadDraft()
    if (draft?.nodes?.length > 0) {
      setNodes(draft.nodes)
      setEdges(draft.edges)
      setCounter(draft.counter ?? 1)
      if (draft.savedChartId) setSavedChartId(draft.savedChartId)
      setActiveTab('add') // always land on Family tab on refresh
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Autosave draft on every change (debounced 600ms) ─────────────────────
  useEffect(() => {
    const t = setTimeout(() => saveDraft(nodes, edges, counter, savedChartId), 600)
    return () => clearTimeout(t)
  }, [nodes, edges, counter, savedChartId])

  // ── Auto-save to named chart when tree has been saved once ────────────────
  useEffect(() => {
    if (!savedChartId || nodes.length === 0) return
    const t = setTimeout(() => {
      const existing = loadCharts().find(c => c.id === savedChartId)
      if (!existing) return // chart was deleted from the Saved tab
      saveChart({ ...existing, nodes, edges, counter, savedAt: new Date().toISOString() })
    }, 800)
    return () => clearTimeout(t)
  }, [nodes, edges, counter, savedChartId])

  // ── Layout on edge / node count changes ──────────────────────────────────
  useEffect(() => {
    if (nodes.length === 0) return
    setNodes(prev => applyDagreLayout(prev, edges))
    setFitTick(t => t + 1)
  }, [edges, nodes.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-dismiss connect prompt once first edge is added ─────────────────
  useEffect(() => {
    if (edges.length > 0 && showConnectPrompt) setShowConnectPrompt(false)
  }, [edges.length]) // eslint-disable-line react-hooks/exhaustive-deps

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

  function markUsed() {
    setHasUsedApp(prev => {
      if (prev) return prev
      try { localStorage.setItem('astrotree_used', '1') } catch {}
      return true
    })
  }

  // ── Add (atomic, supports multiple members) ───────────────────────────────
  function handleAdd({ members, relationships = {} }) {
    const { parentIds = [], childIds = [], spouseIds = [] } = relationships
    const wasEmpty  = nodes.length === 0
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
    setActiveTab('tree')
    setEditingNodeId(null)
    setShowAddMore(false)
    if (wasEmpty) setShowConnectPrompt(true)
    markUsed()
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
  }, [])

  const onConnect = useCallback(
    (params) => setEdges(eds => addEdge({ ...params, animated: true, style: EDGE_STYLE, type: 'smoothstep' }, eds)),
    [setEdges],
  )

  // ── Charts ────────────────────────────────────────────────────────────────
  const handleLoadChart = useCallback((chart) => {
    setNodes(chart.nodes); setEdges(chart.edges); setCounter(chart.counter)
    setSavedChartId(chart.id)
    setEditingNodeId(null); setActiveTab('tree')
    setFitTick(t => t + 1)
  }, [setNodes, setEdges])

  const handleNewChart = useCallback(() => {
    setNodes([]); setEdges([]); setCounter(1)
    setSavedChartId(null)
    setEditingNodeId(null); setActiveTab('add')
  }, [setNodes, setEdges])

  const handleRelayout = useCallback(() => {
    setNodes(prev => applyDagreLayout(prev, edges))
    setFitTick(t => t + 1)
  }, [edges, setNodes])

  // ── Save tree to named chart ──────────────────────────────────────────────
  function handleSaveChart(e) {
    e.preventDefault()
    if (!saveTitle.trim() || nodes.length === 0) return
    const id = Date.now().toString()
    saveChart({ id, title: saveTitle.trim(), nodes, edges, counter, savedAt: new Date().toISOString() })
    setSavedChartId(id)
    setShowSaveDialog(false)
    setSaveTitle('')
    if (pendingNewTree) {
      setPendingNewTree(false)
      handleNewChart()
    }
  }

  function handleNewTreeClick() {
    if (nodes.length === 0) { handleNewChart(); return }
    markUsed()
    if (!savedChartId) {
      setPendingNewTree(true)
      setSaveTitle('')
      setShowSaveDialog(true)
    } else {
      setShowNewTreeConfirm(true)
    }
  }

  // ── Navigation helpers ────────────────────────────────────────────────────
  function goTab(tab) {
    setActiveTab(tab)
    setEditingNodeId(null)
    if (tab === 'tree') setFitTick(t => t + 1)
  }

  // ── Combine two PNG data-URLs vertically on a canvas ─────────────────────
  function combineImagesVertically(url1, url2) {
    return new Promise(resolve => {
      const img1 = new Image(), img2 = new Image()
      let loaded = 0
      const onLoad = () => {
        if (++loaded < 2) return
        const canvas = document.createElement('canvas')
        canvas.width  = Math.max(img1.width, img2.width)
        canvas.height = img1.height + img2.height
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#09071a'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img1, Math.floor((canvas.width - img1.width) / 2), 0)
        ctx.drawImage(img2, Math.floor((canvas.width - img2.width) / 2), img1.height)
        resolve(canvas.toDataURL('image/png'))
      }
      img1.onload = img2.onload = onLoad
      img1.src = url1; img2.src = url2
    })
  }

  // ── Export: tree + insights image ────────────────────────────────────────
  // ── Export tree image ─────────────────────────────────────────────────────
  const handleExport = useCallback(async () => {
    const el = document.querySelector('.react-flow')
    if (!el || exporting) return
    setExportError(null)
    setExporting(true)

    const isMobile = window.innerWidth <= 768
    fitViewRef.current?.({ padding: 0.12, duration: 0 })
    await new Promise(r => setTimeout(r, 120))

    const brand = el.querySelector('.canvas-brand')
    if (brand) brand.style.display = 'flex'
    el.classList.add('exporting')

    try {
      const url = await toPng(el, {
        backgroundColor: '#09071a',
        pixelRatio: isMobile ? 2.5 : 2,
        filter: node => {
          const c = node.classList
          if (!c) return true
          if (c.contains('react-flow__background')) return false
          if (c.contains('react-flow__controls'))   return false
          if (c.contains('canvas-panel-btns'))      return false
          if (c.contains('connect-prompt'))         return false
          return true
        },
      })

      if (isMobile && navigator.canShare) {
        const blob = await (await fetch(url)).blob()
        const file = new File([blob], 'astrotree-tree.png', { type: 'image/png' })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'My Family Tree', text: 'Created with AstroTree by Jupiter Digital' })
          return
        }
      }
      const link = document.createElement('a')
      link.download = 'astrotree-tree.png'
      link.href = url
      link.click()
    } catch (err) {
      if (err?.name === 'AbortError') return
      setExportError('Export failed — please try again.')
    } finally {
      el.classList.remove('exporting')
      if (brand) brand.style.display = ''
      setExporting(false)
    }
  }, [exporting])

  // ── Export insights image (captures live .insights-panel from the DOM) ────
  const handleInsightsExport = useCallback(async () => {
    const el = document.querySelector('.insights-panel')
    if (!el || exporting) return
    setExportError(null)
    setExporting(true)
    try {
      const url = await toPng(el, {
        backgroundColor: '#09071a',
        pixelRatio: 2,
        filter: node => !node.classList?.contains('insight-coming-soon') && !node.classList?.contains('insights-export-btn'),
      })
      const isMobile = window.innerWidth <= 768
      if (isMobile && navigator.canShare) {
        const blob = await (await fetch(url)).blob()
        const file = new File([blob], 'astrotree-insights.png', { type: 'image/png' })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Family Cosmic Insights', text: 'Created with AstroTree by Jupiter Digital' })
          return
        }
      }
      const link = document.createElement('a')
      link.download = 'astrotree-insights.png'
      link.href = url
      link.click()
    } catch (err) {
      if (err?.name === 'AbortError') return
      setExportError('Export failed — please try again.')
    } finally {
      setExporting(false)
    }
  }, [exporting])

  const editingNode = editingNodeId ? nodes.find(n => n.id === editingNodeId) : null

  return (
    <div className="app">
      {/* ── New Tree confirm (when tree is already saved) ────────────────── */}
      {showNewTreeConfirm && (
        <div className="save-dialog-backdrop" onClick={() => setShowNewTreeConfirm(false)}>
          <div className="save-dialog" onClick={e => e.stopPropagation()}>
            <p className="save-dialog-title">Start a new tree?</p>
            <p className="save-dialog-sub">Your current tree is saved and can be reloaded from Saved Trees.</p>
            <div className="save-dialog-btns">
              <button type="button" className="save-dialog-cancel" onClick={() => setShowNewTreeConfirm(false)}>Cancel</button>
              <button type="button" className="save-dialog-save" onClick={() => { setShowNewTreeConfirm(false); handleNewChart() }}>Start New</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Save dialog — fixed overlay, above sidebar ───────────────────── */}
      {showSaveDialog && (
        <div className="save-dialog-backdrop" onClick={() => { setShowSaveDialog(false); setPendingNewTree(false) }}>
          <form
            className="save-dialog"
            onSubmit={handleSaveChart}
            onClick={e => e.stopPropagation()}
          >
            <p className="save-dialog-title">
              {pendingNewTree ? '⚠ Save before starting a new tree?' : '💾 Name this tree'}
            </p>
            <input
              type="text"
              className="save-dialog-input"
              placeholder="e.g. Mom's side, 2025…"
              value={saveTitle}
              onChange={e => setSaveTitle(e.target.value)}
              autoFocus
            />
            <div className="save-dialog-btns">
              <button
                type="button"
                className="save-dialog-cancel"
                onClick={() => { setShowSaveDialog(false); setPendingNewTree(false) }}
              >
                Cancel
              </button>
              {pendingNewTree && (
                <button
                  type="button"
                  className="save-dialog-discard"
                  onClick={() => { setShowSaveDialog(false); setPendingNewTree(false); handleNewChart() }}
                >
                  Discard
                </button>
              )}
              <button type="submit" className="save-dialog-save" disabled={!saveTitle.trim()}>
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Starfield */}
      <div className="stars" aria-hidden="true">
        {useMemo(() => Array.from({ length: 120 }).map((_, i) => (
          <span key={i} className="star" style={{
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            width: `${Math.random() * 2 + 1}px`, height: `${Math.random() * 2 + 1}px`,
            animationDelay: `${Math.random() * 4}s`, animationDuration: `${Math.random() * 3 + 2}s`,
          }} />
        )), [])}
      </div>

      {/* ── Sidebar / Panel ─────────────────────────────────────────────── */}
      <aside className={`sidebar${panelOpen ? ' open' : ''}`}>
        {/* Mobile panel header — shows tab name and close button */}
        <div className="mobile-panel-header">
          <span className="mobile-panel-title">
            {editingNodeId ? 'Edit Member'
              : activeTab === 'insights' ? '✦ Insights'
              : activeTab === 'charts'   ? '🗂️ Saved Trees'
              : activeTab === 'about'    ? '🪐 About'
              : '★ Family'}
          </span>
          <button
            type="button"
            className="mobile-panel-close"
            onClick={() => { setActiveTab('tree'); setEditingNodeId(null) }}
            aria-label="Back to tree"
          >✕</button>
        </div>

        {/* Brand */}
        <div className="brand-header">
          <div className="brand-logo">🪐</div>
          <div className="brand-text">
            <p className="brand-name">Jupiter Digital</p>
            <h1 className="brand-app">AstroTree</h1>
            <p className="brand-sub">Family Celestial Tree</p>
          </div>
        </div>

        {/* ── Desktop tab strip (hidden on mobile) ────────────────────── */}
        <div className="sidebar-tabs">
          <button
            className={`sidebar-tab${activeTab === 'add' || activeTab === 'tree' ? ' active' : ''}`}
            onClick={() => goTab('add')}
          >★ Family</button>
          <button
            className={`sidebar-tab${activeTab === 'insights' && !editingNode ? ' active' : ''}`}
            onClick={() => goTab('insights')}
            disabled={nodes.length === 0}
          >✦ Insights</button>
          <button
            className={`sidebar-tab${activeTab === 'charts' && !editingNode ? ' active' : ''}`}
            onClick={() => goTab('charts')}
          >🗂️ Saved</button>
          <button
            className={`sidebar-tab${activeTab === 'about' && !editingNode ? ' active' : ''}`}
            onClick={() => goTab('about')}
          >🪐 About</button>
        </div>

        {/* ── Scrollable content ──────────────────────────────────────── */}
        <div className="sidebar-content">

          {/* ── Editing a member ──────────────────────────────────────── */}
          {editingNode ? (
            <>
              <button
                type="button"
                className="back-btn"
                onClick={() => setEditingNodeId(null)}
              >← Back</button>
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

          /* ── Family Insights ────────────────────────────────────────── */
          ) : activeTab === 'insights' ? (
            <InsightsPanel
              nodes={nodes} edges={edges}
              onExport={nodes.length >= 2 ? handleInsightsExport : undefined}
              exporting={exporting}
            />

          /* ── Saved charts ───────────────────────────────────────────── */
          ) : activeTab === 'charts' ? (
            <ChartsPanel
              nodes={nodes} edges={edges} counter={counter}
              savedChartId={savedChartId}
              onLoad={handleLoadChart} onNew={handleNewTreeClick}
            />

          /* ── About ──────────────────────────────────────────────────── */
          ) : activeTab === 'about' ? (
            <AboutPanel />

          /* ── Family tab ─────────────────────────────────────────────── */
          ) : (
            <>
              {nodes.length === 0 ? (
                <>
                  {hasUsedApp ? (
                    <div className="family-welcome family-welcome--compact">
                      <div className="family-welcome-logo">🪐</div>
                      <h2 className="family-welcome-title">Start a New Tree</h2>
                      <p className="family-welcome-sub">Add family members below to build another celestial chart.</p>
                      <ol className="family-welcome-steps">
                        <li><strong>Add</strong> members with their birthdates</li>
                        <li><strong>Connect</strong> them on the Tree tab</li>
                        <li><strong>Save</strong> when ready — find it in Saved</li>
                      </ol>
                    </div>
                  ) : (
                    <div className="family-welcome">
                      <div className="family-welcome-logo">🪐</div>
                      <h2 className="family-welcome-title">Welcome to AstroTree</h2>
                      <p className="family-welcome-sub">
                        Build your family's celestial chart — discover the sun signs and cosmic patterns woven across generations.
                      </p>
                      <ol className="family-welcome-steps">
                        <li><strong>Add</strong> family members with their birthdate</li>
                        <li><strong>Connect</strong> them as parents, children &amp; partners</li>
                        <li><strong>Discover</strong> your family's cosmic blueprint</li>
                      </ol>
                      <p className="family-welcome-cta-hint">Start by filling in the form below ↓</p>
                    </div>
                  )}
                  <AddMembersForm onAdd={handleAdd} />
                </>
              ) : (
                <>
                  {/* Member list */}
                  <div className="member-list">
                    <div className="member-list-header">
                      <h3>Your Family · {nodes.length}</h3>
                      <span className="member-list-hint">tap a name to connect</span>
                    </div>
                    {nodes.map(n => (
                      <div key={n.id} className="member-pill"
                        style={{ borderColor: `${n.data.elementColor}44`, cursor: 'pointer' }}
                        onClick={() => setEditingNodeId(n.id)}
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

                  {/* Collapsible add more */}
                  <div className="add-more-section">
                    <button
                      type="button"
                      className="add-more-toggle"
                      onClick={() => setShowAddMore(o => !o)}
                    >
                      {showAddMore ? '▲ Hide' : '＋ Add more people'}
                    </button>
                    {showAddMore && <AddMembersForm onAdd={handleAdd} initialRows={1} />}
                  </div>

                  {/* Divider + New Tree (and Save if unsaved) */}
                  <div className="family-bottom-actions">
                    {!savedChartId && (
                      <button
                        type="button"
                        className="family-tree-btn family-tree-btn--save"
                        onClick={() => { setSaveTitle(''); setShowSaveDialog(true) }}
                      >
                        💾 Save Tree
                      </button>
                    )}
                    <button
                      type="button"
                      className="family-tree-btn"
                      onClick={handleNewTreeClick}
                    >
                      ＋ New Tree
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* ── Footer — brand credit only ──────────────────────────────── */}
        <footer className="sidebar-footer">
          {exportError && (
            <p className="export-error">{exportError}</p>
          )}
          <p className="footer-brand-credit">
            🪐 <strong>Jupiter Digital</strong>
            {' · '}
            <button type="button" className="footer-about-link" onClick={() => goTab('about')}>About</button>
          </p>
        </footer>
      </aside>

      {/* ── Mobile bottom tab bar ────────────────────────────────────────── */}
      <nav className="bottom-tab-bar" aria-label="Main navigation">
        <button
          className={`bottom-tab${activeTab === 'add' || !!editingNodeId ? ' active' : ''}`}
          onClick={() => goTab('add')}
        >
          <span className="bottom-tab-icon">★</span>
          <span className="bottom-tab-label">Family</span>
        </button>
        <button
          className={`bottom-tab${activeTab === 'tree' && !editingNodeId ? ' active' : ''}`}
          onClick={() => { setActiveTab('tree'); setEditingNodeId(null); setFitTick(t => t + 1) }}
        >
          <span className="bottom-tab-icon">🌳</span>
          <span className="bottom-tab-label">Tree</span>
        </button>
        <button
          className={`bottom-tab${activeTab === 'insights' && !editingNodeId ? ' active' : ''}`}
          onClick={() => goTab('insights')}
          disabled={nodes.length === 0}
        >
          <span className="bottom-tab-icon">✦</span>
          <span className="bottom-tab-label">Insights</span>
        </button>
        <button
          className={`bottom-tab${activeTab === 'charts' && !editingNodeId ? ' active' : ''}`}
          onClick={() => goTab('charts')}
        >
          <span className="bottom-tab-icon">📚</span>
          <span className="bottom-tab-label">Saved</span>
        </button>
        <button
          className={`bottom-tab${activeTab === 'about' && !editingNodeId ? ' active' : ''}`}
          onClick={() => goTab('about')}
        >
          <span className="bottom-tab-icon">🪐</span>
          <span className="bottom-tab-label">About</span>
        </button>
      </nav>

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
                <div className="welcome-step"><span className="welcome-step-num">1</span><span>Add family members with their birthdates</span></div>
                <div className="welcome-step"><span className="welcome-step-num">2</span><span>Connect parents, children &amp; partners</span></div>
                <div className="welcome-step"><span className="welcome-step-num">3</span><span>Reveal your family's cosmic blueprint</span></div>
              </div>
              <button type="button" className="welcome-cta"
                onClick={() => goTab('add')}>
                Begin Your Tree →
              </button>
              <p className="welcome-mobile-hint">Tap <strong>＋ Add</strong> below to start</p>
            </div>
          </div>
        )}

        {/* ── Connect prompt — shown after first add ───────────────────── */}
        {showConnectPrompt && edges.length === 0 && nodes.length > 0 && (
          <div className="connect-prompt">
            <span className="connect-prompt-icon">🔗</span>
            <span>Tap any card on the tree to connect your family members as parents, children, or partners</span>
            <button
              type="button"
              className="connect-prompt-close"
              onClick={() => setShowConnectPrompt(false)}
            >Got it</button>
          </div>
        )}

        <ReactFlow
          nodes={nodes} edges={edgesForDisplay}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={onConnect} onNodeClick={onNodeClick}
          nodeTypes={NODE_TYPES}
          fitView fitViewOptions={{ padding: 0.25 }}
          minZoom={0.3} colorMode="dark"
          proOptions={{ hideAttribution: true }}
        >
          <FitViewOnLayout fitTick={fitTick} fitViewRef={fitViewRef} />
          <Background color="#1a1040" gap={36} size={1} />
          <Controls style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }} />

          {/* Top-right: action buttons */}
          <Panel position="top-right">
            <div className="canvas-panel-btns">
              {nodes.length > 0 && (
                <button
                  type="button"
                  className="relayout-btn relayout-btn--insights"
                  onClick={() => goTab('insights')}
                >
                  ✦ Insights
                </button>
              )}
              {/* Save — only shown before first named save */}
              {nodes.length > 0 && !savedChartId && (
                <button
                  type="button"
                  className="relayout-btn relayout-btn--save"
                  onClick={() => setShowSaveDialog(true)}
                >
                  💾 Save
                </button>
              )}
              {/* Share / Export */}
              {nodes.length > 0 && (
                <button
                  type="button"
                  className="relayout-btn relayout-btn--share"
                  onClick={handleExport}
                  disabled={exporting}
                >
                  {exporting ? '…' : '📤 Share'}
                </button>
              )}
              {nodes.length > 0 && (
                <button type="button" className="relayout-btn" onClick={handleRelayout}>
                  ⟳ Re-layout
                </button>
              )}
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
