import { useState, useCallback, useEffect, useMemo, useRef, lazy, Suspense } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import AddMembersForm  from './components/AddMembersForm.jsx'
import AstroNode       from './components/AstroNode.jsx'
import EditMemberPanel from './components/EditMemberPanel.jsx'
const ZodiacWheel        = lazy(() => import('./components/ZodiacWheel.jsx'))
const ConstellationView  = lazy(() => import('./components/ConstellationView.jsx'))
import ChartsPanel     from './components/ChartsPanel.jsx'
import InsightsPanel   from './components/InsightsPanel.jsx'
import AboutPanel      from './components/AboutPanel.jsx'
import { SaveDialog }    from './components/SaveDialog.jsx'
import { NewTreeConfirm } from './components/NewTreeConfirm.jsx'
import { WelcomeScreen }  from './components/WelcomeScreen.jsx'
import { JupiterIcon }            from './components/JupiterIcon.jsx'
import { TablesPanel }           from './components/TablesPanel.jsx'
import { applyDagreLayout }      from './utils/layout.js'
import { checkIngressWarnings }  from './utils/astrology.js'
import { loadDraft, saveChart }  from './utils/storage.js'
import { useCloudSync } from './hooks/useCloudSync.js'
import { SyncIndicator } from './components/SyncIndicator.jsx'
import { ShareButton } from './components/ShareButton.jsx'
import { fetchChartByToken, isCloudEnabled } from './utils/cloudStorage.js'
import { EmailCapture, hasBeenAsked, clearEmailAsked } from './components/EmailCapture.jsx'
import { OnboardingProgress, markInsightsSeen } from './components/OnboardingProgress.jsx'
import { buildDemoChart, buildDemoCrewChart } from './utils/demoData.js'
import { buildNodeData, makeEdge, hydrateNodes } from './utils/treeHelpers.js'
import { formatRelativeTime } from './utils/format.js'
import { useExport } from './hooks/useExport.js'
import { useChartManager } from './hooks/useChartManager.js'
import { useTreeState } from './hooks/useTreeState.js'

const NODE_TYPES = { astro: AstroNode }


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
  const [activeTab,         setActiveTab]         = useState(() => {
    try { const draft = loadDraft(); return (draft?.nodes?.length > 0) ? 'add' : 'tree' } catch { return 'add' }
  })
  const [showAddMore,       setShowAddMore]       = useState(false)
  const [showConnectPrompt, setShowConnectPrompt] = useState(false)
  const [fitTick,           setFitTick]           = useState(0)
  // True once the user has ever added members — shows compact welcome on next empty state
  const [hasUsedApp,        setHasUsedApp]        = useState(() => {
    try { return localStorage.getItem('astrotree_used') === '1' } catch { return false }
  })
  // Set when viewing a shared chart via ?view=token — prevents autosave under viewer's device
  const [viewOnly,          setViewOnly]          = useState(false)
  const [treeView,          setTreeView]          = useState('tree') // 'tree' | 'zodiac' | 'constellation' | 'tables'
  const [constellationTick, setConstellationTick] = useState(0)
  const [treeViewedCount,   setTreeViewedCount]   = useState(0)
  const [savedToast,        setSavedToast]        = useState(false)

  const fitViewRef = useRef(null)

  // Ingress warnings per node — computed once per nodes change (not on every render)
  const nodeIngressWarnings = useMemo(() => {
    const map = {}
    nodes.forEach(n => {
      if (n.data?.birthdate) {
        const w = checkIngressWarnings(n.data.birthdate, n.data.birthTime ?? null)
        if (w.length > 0) map[n.id] = w
      }
    })
    return map
  }, [nodes])

  // Mobile panel is open when not on the tree tab, or when editing a node
  const panelOpen = activeTab !== 'tree' || !!editingNodeId

  const { syncStatus, syncChart, deleteFromCloud } = useCloudSync({
    onMergeCharts: () => {/* ChartsPanel will re-read localStorage on its own mount */},
  })

  const {
    savedChartId, setSavedChartId,
    showSaveDialog, setShowSaveDialog,
    saveTitle, setSaveTitle,
    pendingNewTree, setPendingNewTree,
    showNewTreeConfirm, setShowNewTreeConfirm,
    showEmailCapture, setShowEmailCapture,
    lastSavedAt,
    handleSaveChart, handleNewChart, handleLoadChart,
    handleRenameChart, handleDuplicateChart,
    handleNewTreeClick,
  } = useChartManager({
    nodes, edges, counter,
    setNodes, setEdges, setCounter,
    setActiveTab, setEditingNodeId, setTreeView,
    setFitTick, setViewOnly,
    syncChart,
    viewOnly,
  })
  const { exporting, exportError, handleExport, handleZodiacExport, handleConstellationExport, handleInsightsExport, handleTablesExport } = useExport({ savedChartId, fitViewRef })
  const {
    edgesForDisplay,
    handleUpdate, handleDelete,
    handleAddEdge, handleRemoveEdge,
    onNodeClick, onConnect,
  } = useTreeState({
    nodes, edges,
    setNodes, setEdges,
    setFitTick, setEditingNodeId,
  })

  // ── Auto-switch to constellation for friend/coworker-only groups ─────────
  useEffect(() => {
    if (edges.length === 0 || treeView !== 'tree') return
    const allNonHierarchical = edges.every(e => {
      const t = e.data?.relationType
      return t === 'friend' || t === 'coworker'
    })
    if (allNonHierarchical) setTreeView('constellation')
  }, [edges]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Prevent bots from indexing shared chart pages ──────────────────────────
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('view')) {
      let meta = document.querySelector('meta[name="robots"]')
      if (meta) meta.setAttribute('content', 'noindex, nofollow')
    }
  }, [])

  // ── Handle ?view=<share_token> shared chart link ──────────────────────────
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('view')
    if (!token || !isCloudEnabled()) return
    fetchChartByToken(token).then(chart => {
      if (!chart) return
      setNodes(hydrateNodes(chart.nodes))
      setEdges(chart.edges)
      setCounter(chart.counter)
      // Do NOT set savedChartId — viewer doesn't own this chart
      setViewOnly(true)
      setActiveTab('tree')
      setFitTick(t => t + 1)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-dismiss connect prompt once first edge is added ─────────────────
  useEffect(() => {
    if (edges.length > 0 && showConnectPrompt) setShowConnectPrompt(false)
  }, [edges.length]) // eslint-disable-line react-hooks/exhaustive-deps

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
    const nextNodes = [
      ...nodes,
      ...members.map((m, i) => ({
        id: `node-${startIdx + i}`, type: 'astro',
        position: { x: 0, y: 0 }, data: buildNodeData(m),
      })),
    ]
    const nextEdges = [
      ...edges,
      ...parentIds.map(p => makeEdge(p,         primaryId)),
      ...childIds .map(c => makeEdge(primaryId, c)),
      ...spouseIds.map(s => makeEdge(primaryId, s, 'spouse')),
    ]
    const nextCounter = counter + members.length
    setNodes(applyDagreLayout(nextNodes, nextEdges))
    setEdges(nextEdges)
    setCounter(nextCounter)
    setActiveTab('tree')
    setEditingNodeId(null)
    setShowAddMore(false)
    setFitTick(t => t + 1)
    if (wasEmpty) setShowConnectPrompt(true)
    markUsed()

    // Auto-save on first add when no chart exists yet
    if (wasEmpty && !viewOnly && !savedChartId) {
      const defaultTitle = `${members[0].name}'s Family`
      const id = Date.now().toString()
      const chart = { id, title: defaultTitle, nodes: nextNodes, edges: nextEdges, counter: nextCounter, savedAt: new Date().toISOString() }
      saveChart(chart)
      syncChart(chart)
      setSavedChartId(id)
      setSavedToast(true)
      setTimeout(() => setSavedToast(false), 4000)
      if (!hasBeenAsked() && isCloudEnabled()) setShowEmailCapture(true)
    }
  }

  const handleRelayout = useCallback(() => {
    if (treeView === 'constellation') {
      setConstellationTick(t => t + 1)
    } else {
      setNodes(prev => applyDagreLayout(prev, edges))
      setFitTick(t => t + 1)
    }
  }, [edges, setNodes, treeView])

  // ── Navigation helpers ────────────────────────────────────────────────────
  function goTab(tab) {
    setActiveTab(tab)
    setEditingNodeId(null)
    if (tab === 'tree') setFitTick(t => t + 1)
    if (tab === 'insights' && edges.length > 0) markInsightsSeen()
  }

  // ── Load demo tree ────────────────────────────────────────────────────────
  function handleLoadDemo() {
    const demo = buildDemoChart()
    setNodes(applyDagreLayout(demo.nodes, demo.edges))
    setEdges(demo.edges)
    setCounter(demo.counter)
    setSavedChartId(null)
    setViewOnly(false)
    setActiveTab('tree')
    setFitTick(t => t + 1)
    markUsed()
  }

  function handleLoadDemoCrew() {
    const demo = buildDemoCrewChart()
    setNodes(applyDagreLayout(demo.nodes, demo.edges))
    setEdges(demo.edges)
    setCounter(demo.counter)
    setSavedChartId(null)
    setViewOnly(false)
    setActiveTab('tree')
    setFitTick(t => t + 1)
    markUsed()
  }

  const editingNode = editingNodeId ? nodes.find(n => n.id === editingNodeId) : null

  return (
    <div className="app">
      {/* ── Email capture — shown once after first named save ───────────── */}
      {showEmailCapture && (
        <EmailCapture onDismiss={() => setShowEmailCapture(false)} />
      )}

      {/* ── New Tree confirm (when tree is already saved) ────────────────── */}
      {showNewTreeConfirm && (
        <NewTreeConfirm
          onClose={() => setShowNewTreeConfirm(false)}
          onConfirm={() => { setShowNewTreeConfirm(false); handleNewChart() }}
        />
      )}

      {/* ── Save dialog — fixed overlay, above sidebar ───────────────────── */}
      {showSaveDialog && (
        <SaveDialog
          saveTitle={saveTitle}
          setSaveTitle={setSaveTitle}
          pendingNewTree={pendingNewTree}
          onClose={() => { setShowSaveDialog(false); setPendingNewTree(false) }}
          onDiscard={() => { setShowSaveDialog(false); setPendingNewTree(false); handleNewChart() }}
          onSubmit={handleSaveChart}
        />
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
              : activeTab === 'charts'   ? '🗂️ Saved Charts'
              : activeTab === 'about'    ? <><JupiterIcon size={14} /> About</>
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
          <div className="brand-logo"><JupiterIcon size={40} /></div>
          <div className="brand-text">
            <p className="brand-name">Jupiter Digital</p>
            <h1 className="brand-app">AstroDig</h1>
            <p className="brand-sub">Cosmic Connections</p>
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
            disabled={nodes.length < 2}
          >✦ Insights</button>
          <button
            className={`sidebar-tab${activeTab === 'charts' && !editingNode ? ' active' : ''}`}
            onClick={() => goTab('charts')}
          >🗂️ Saved</button>
          <button
            className={`sidebar-tab${activeTab === 'about' && !editingNode ? ' active' : ''}`}
            onClick={() => goTab('about')}
          ><JupiterIcon size={14} /> About</button>
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
              onAddMore={() => goTab('add')}
              onGoToTree={() => goTab('tree')}
            />

          /* ── Saved charts ───────────────────────────────────────────── */
          ) : activeTab === 'charts' ? (
            <ChartsPanel
              nodes={nodes} edges={edges} counter={counter}
              savedChartId={savedChartId}
              onLoad={handleLoadChart} onNew={handleNewTreeClick}
              onDeleteCloud={deleteFromCloud}
              onRename={handleRenameChart}
              onDuplicate={handleDuplicateChart}
              onAddEmail={isCloudEnabled() ? () => { clearEmailAsked(); setShowEmailCapture(true) } : undefined}
              onGoToAbout={() => {
                goTab('about')
                setTimeout(() => {
                  const el = document.getElementById('about-data')
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }, 120)
              }}
            />

          /* ── About ──────────────────────────────────────────────────── */
          ) : activeTab === 'about' ? (
            <AboutPanel />

          /* ── Family tab ─────────────────────────────────────────────── */
          ) : (
            <>
              <OnboardingProgress
                nodes={nodes}
                edges={edges}
                onGoToTree={() => goTab('tree')}
                onGoToInsights={() => goTab('insights')}
              />
              {nodes.length === 0 ? (
                <>
                  {hasUsedApp ? (
                    <div className="family-welcome family-welcome--compact">
                      <div className="family-welcome-inline">
                        <JupiterIcon size={26} />
                        <h2 className="family-welcome-title">Start a New Chart</h2>
                      </div>
                      <p className="family-welcome-sub">Add family members below to build another celestial chart.</p>
                    </div>
                  ) : (
                    <div className="family-welcome">
                      <div className="family-welcome-inline">
                        <JupiterIcon size={30} />
                        <h2 className="family-welcome-title">Welcome to AstroDig</h2>
                      </div>
                      <p className="family-welcome-sub">
                        Build your family's celestial chart and discover the cosmic patterns woven across generations.
                      </p>
                      <p className="family-welcome-cta-hint">Add your first family member below ↓</p>
                    </div>
                  )}
                  <AddMembersForm onAdd={handleAdd} />
                </>
              ) : (
                <>
                  {/* Member list header + add more toggle */}
                  <div className="member-list">
                    <div className="member-list-header">
                      <h3>Your Family · {nodes.length}</h3>
                      <span className="member-list-hint">tap a name to connect</span>
                    </div>

                    {/* Collapsible add more — placed above member pills for easy access */}
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

                    {edges.length === 0 && (
                      <p className="connect-hint-banner">Tap a name below to connect family members on the tree ↓</p>
                    )}

                    {[...nodes].sort((a, b) => (a.data.birthdate || '9999').localeCompare(b.data.birthdate || '9999')).map(n => (
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
                        {nodeIngressWarnings[n.id] && (
                          <span className="pill-warning" title="Tap to edit — birth time may affect sign accuracy">⚠</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Divider + New Tree */}
                  <div className="family-bottom-actions">
                    <button
                      type="button"
                      className="family-tree-btn"
                      onClick={handleNewTreeClick}
                    >
                      ＋ New Chart
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <footer className="sidebar-footer">
          {exportError && (
            <p className="export-error">{exportError}</p>
          )}
          <div className="footer-brand-credit">
            <span className="footer-brand-left">
              <JupiterIcon size={16} /> <strong>Jupiter Digital</strong>
              {' · '}
              <button type="button" className="footer-about-link" onClick={() => goTab('about')}>About</button>
              {' · '}
              <a href="https://jupiterdigitalevents.com" className="footer-external-link" target="_blank" rel="noopener noreferrer">Events ↗</a>
            </span>
            {lastSavedAt && (
              <span className="footer-saved-inline">
                <SyncIndicator status={syncStatus === 'idle' ? 'synced' : syncStatus} />
                <span>{formatRelativeTime(lastSavedAt)}</span>
              </span>
            )}
          </div>
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
          onClick={() => { setActiveTab('tree'); setEditingNodeId(null); setFitTick(t => t + 1); setTreeViewedCount(nodes.length) }}
        >
          <span className="bottom-tab-icon" style={{ position: 'relative', display: 'inline-flex' }}>
            ✦
            {nodes.length > treeViewedCount && (
              <span className="bottom-tab-badge">{nodes.length - treeViewedCount}</span>
            )}
          </span>
          <span className="bottom-tab-label">Chart</span>
        </button>
        <button
          className={`bottom-tab${activeTab === 'insights' && !editingNodeId ? ' active' : ''}`}
          onClick={() => goTab('insights')}
          disabled={nodes.length < 2}
        >
          <span className="bottom-tab-icon">☍</span>
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
          <span className="bottom-tab-icon"><JupiterIcon size={22} /></span>
          <span className="bottom-tab-label">About</span>
        </button>
      </nav>

      {/* ── Canvas ──────────────────────────────────────────────────────── */}
      <main className="canvas">
        {nodes.length === 0 && (
          <WelcomeScreen
            hasUsedApp={hasUsedApp}
            onBegin={() => {
              goTab('add')
              setTimeout(() => document.querySelector('.add-form input[type="text"]')?.focus(), 50)
            }}
            onDemo={handleLoadDemo}
            onDemoCrew={handleLoadDemoCrew}
            onLoadCharts={() => goTab('charts')}
          />
        )}

        {/* ── Saved toast — shown briefly after first auto-save ───────── */}
        {savedToast && (
          <div className="saved-toast">
            ✓ Chart saved — find it in the Saved tab
          </div>
        )}

        {/* ── Connect prompt — shown after first add ───────────────────── */}
        {showConnectPrompt && edges.length === 0 && nodes.length > 0 && (
          <div className="connect-prompt">
            <span className="connect-prompt-icon">🔗</span>
            <span>Connect your family members as parents, children, or partners</span>
            <button
              type="button"
              className="connect-prompt-action"
              onClick={() => { goTab('add'); setShowConnectPrompt(false) }}
            >Go to Family →</button>
            <button
              type="button"
              className="connect-prompt-close"
              onClick={() => setShowConnectPrompt(false)}
            >Got it</button>
          </div>
        )}

        {/* ── Persistent no-connections nudge (tree view only) ─────────── */}
        {!showConnectPrompt && treeView === 'tree' && nodes.length > 0 && edges.length === 0 && (
          <div className="no-connections-nudge">
            <span>No connections yet —</span>
            <button
              type="button"
              className="no-connections-btn"
              onClick={() => goTab('add')}
            >Add Relationships →</button>
          </div>
        )}

        {/* View toggle (tree vs zodiac vs constellation) */}
        {nodes.length > 0 && (
          <div className="tree-view-toggle">
            <button
              type="button"
              className={`tree-view-btn${treeView === 'tree' ? ' tree-view-btn--active' : ''}`}
              onClick={() => setTreeView('tree')}
            >
              🌳 Tree
            </button>
            <button
              type="button"
              className={`tree-view-btn${treeView === 'zodiac' ? ' tree-view-btn--active' : ''}`}
              onClick={() => setTreeView('zodiac')}
            >
              ☉ Zodiac
            </button>
            <button
              type="button"
              className={`tree-view-btn${treeView === 'constellation' ? ' tree-view-btn--active' : ''}`}
              onClick={() => setTreeView('constellation')}
            >
              ✦ Constellation
            </button>
            <button
              type="button"
              className={`tree-view-btn${treeView === 'tables' ? ' tree-view-btn--active' : ''}`}
              onClick={() => setTreeView('tables')}
            >
              ☽ Tables
            </button>
          </div>
        )}

        {/* ── Sync indicator (non-intrusive, doesn't shift buttons) ──── */}
        {nodes.length > 0 && (
          <div className="canvas-sync-float">
            <SyncIndicator status={syncStatus} />
          </div>
        )}

        {/* ── Shared action buttons (visible on both views) ──────────── */}
        {nodes.length > 0 && (
          <div className="canvas-panel-btns">
            <button
              type="button"
              className="relayout-btn relayout-btn--insights"
              onClick={() => goTab('insights')}
            >
              ✦ Insights
            </button>
            <ShareButton savedChartId={savedChartId} syncStatus={syncStatus} />
            <button
              type="button"
              className="relayout-btn relayout-btn--share"
              onClick={treeView === 'zodiac' ? handleZodiacExport : treeView === 'constellation' ? handleConstellationExport : treeView === 'tables' ? handleTablesExport : handleExport}
              disabled={exporting}
            >
              {exporting ? '…' : (<>
                <span className="export-label-desktop">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{display:'inline',verticalAlign:'middle',marginRight:'4px'}}><path d="M6 1v7M3 6l3 3 3-3M1 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {treeView === 'zodiac' ? 'Download Zodiac' : treeView === 'constellation' ? 'Download Constellation' : treeView === 'tables' ? 'Download Tables' : 'Download Tree'}
                </span>
                <span className="export-label-mobile">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{display:'inline',verticalAlign:'middle',marginRight:'4px'}}><path d="M6 7V1M3 4l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 8v2.5h10V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Share
                </span>
              </>)}
            </button>
            {(treeView === 'tree' || treeView === 'constellation') && (
              <button type="button" className="relayout-btn" onClick={handleRelayout}>
                ⟳ Re-layout
              </button>
            )}
          </div>
        )}

        {/* View-only banner for shared charts */}
        {viewOnly && (
          <div className="view-only-banner">
            Viewing a shared tree —{' '}
            <button
              type="button"
              className="view-only-save-btn"
              onClick={() => { setSaveTitle(''); setShowSaveDialog(true) }}
            >
              Save a copy
            </button>
          </div>
        )}

        {/* Bottom-right: Jupiter Digital watermark (both views) */}
        {nodes.length > 0 && (
          <div className="canvas-brand">
            <span className="canvas-brand-logo"><JupiterIcon size={20} /></span>
            <div className="canvas-brand-text">
              <span className="canvas-brand-name">Jupiter Digital</span>
              <span className="canvas-brand-sub">AstroDig</span>
              <span className="canvas-brand-contact">
                jupreturns@gmail.com · <svg style={{display:'inline',verticalAlign:'middle'}} width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg> @jupreturn
              </span>
            </div>
          </div>
        )}

        {treeView === 'tables' && nodes.length > 0 ? (
          <div className="tables-canvas-wrap">
            <TablesPanel nodes={nodes} />
          </div>
        ) : treeView === 'zodiac' && nodes.length > 0 ? (
          <Suspense fallback={null}>
            <ZodiacWheel
              nodes={nodes}
              onSelectNode={(id) => setEditingNodeId(id)}
            />
          </Suspense>
        ) : treeView === 'constellation' && nodes.length > 0 ? (
          <Suspense fallback={null}>
            <ConstellationView
              nodes={nodes}
              edges={edges}
              onSelectNode={(id) => setEditingNodeId(id)}
              layoutTick={constellationTick}
            />
          </Suspense>
        ) : (
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
          {nodes.length > 0 && <Controls style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }} />}
        </ReactFlow>
        )}
      </main>

    </div>
  )
}
