'use client'

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
import { loadDraft, saveChart, loadCharts }  from './utils/storage.js'
import { useCloudSync } from './hooks/useCloudSync.js'
import { SyncIndicator } from './components/SyncIndicator.jsx'
import { ShareButton } from './components/ShareButton.jsx'
import { fetchChartByToken, isCloudEnabled, pingVisit, logEvent } from './utils/cloudStorage.js'
import { EmailCapture, hasBeenAsked, clearEmailAsked } from './components/EmailCapture.jsx'
import { UpgradePrompt } from './components/UpgradePrompt.jsx'
import { checkPurchaseReturn } from './utils/checkout.js'
import { OnboardingProgress, markInsightsSeen } from './components/OnboardingProgress.jsx'
import { buildDemoChart, buildDemoCrewChart } from './utils/demoData.js'
import { buildNodeData, makeEdge, hydrateNodes } from './utils/treeHelpers.js'
import { formatRelativeTime } from './utils/format.js'
import { useExport } from './hooks/useExport.js'
import { useChartManager } from './hooks/useChartManager.js'
import { useTreeState } from './hooks/useTreeState.js'
import { useOnboardingState } from './hooks/useOnboardingState.js'
import { useHistoryNav } from './hooks/useHistoryNav.js'
import { canAccess } from './utils/entitlements.js'
import { LockedOverlay } from './components/LockedOverlay.jsx'
import { BottomSheet } from './components/BottomSheet.jsx'
import { FloatingPills } from './components/FloatingPills.jsx'
import { CanvasOnboarding } from './components/CanvasOnboarding.jsx'

const NODE_TYPES = { astro: AstroNode }

// UX mode — cosmic is the default layout (bottom-nav + sheets)
function getUxMode() {
  try { return localStorage.getItem('astrodig_ux') || 'cosmic' } catch { return 'cosmic' }
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
  const [activeTab,         setActiveTab]         = useState(() => {
    const cosmic = getUxMode() === 'cosmic'
    try { const draft = loadDraft(); return (draft?.nodes?.length > 0) ? (cosmic ? 'tree' : 'add') : 'tree' } catch { return cosmic ? 'tree' : 'add' }
  })
  const [showAddMore,       setShowAddMore]       = useState(false)
  const [showConnectPrompt, setShowConnectPrompt] = useState(false)
  const [fitTick,           setFitTick]           = useState(0)
  const { hasUsedApp, insightsSeen, setInsightsSeen, returnVisit, markUsed } = useOnboardingState()
  // Set when viewing a shared chart via ?view=token — prevents autosave under viewer's device
  const [viewOnly,          setViewOnly]          = useState(false)
  const [treeView,          setTreeView]          = useState('tree') // 'tree' | 'zodiac' | 'constellation' | 'tables'
  const [insightsTab,       setInsightsTab]       = useState('insights') // 'insights' | 'dig'
  const [constellationTick, setConstellationTick] = useState(0)
  const [newMembersForChart,    setNewMembersForChart]    = useState(0)
  const [newEdgesForInsights,   setNewEdgesForInsights]   = useState(0)
  const [savedToast,        setSavedToast]        = useState(false)
  const [premiumToast,      setPremiumToast]      = useState(false)
  const [showDig,            setShowDig]            = useState(false)
  const [uxMode] = useState(getUxMode) // 'classic' | 'cosmic'
  const isCosmic = uxMode === 'cosmic'

  const fitViewRef = useRef(null)

  const [sidebarWidth, setSidebarWidth] = useState(345)
  const isDraggingRef = useRef(false)

  // ── Browser history integration (back button) ──────────────────────────────
  useHistoryNav({ activeTab, treeView, editingNodeId, setActiveTab, setTreeView, setEditingNodeId })

  // Ingress warnings per node — read from precomputed node.data.ingressWarnings
  const nodeIngressWarnings = useMemo(() => {
    const map = {}
    nodes.forEach(n => {
      const w = n.data?.ingressWarnings
      if (w?.length > 0) map[n.id] = w
    })
    return map
  }, [nodes])

  // Mobile panel is open when not on the tree tab, or when editing a node
  const panelOpen = activeTab !== 'tree' || !!editingNodeId

  const { syncStatus, syncChart, deleteFromCloud, entitlements, refreshEntitlements } = useCloudSync({
    onMergeCharts: () => {/* ChartsPanel will re-read localStorage on its own mount */},
  })
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

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
    onChartLimitHit: () => setShowUpgradePrompt(true),
  })
  const { exporting, exportError, handleExport, handleZodiacExport, handleConstellationExport, handleInsightsExport, handleTablesExport } = useExport({ savedChartId, fitViewRef })
  const {
    edgesForDisplay,
    handleUpdate, handleDelete,
    handleAddEdge, handleRemoveEdge,
    onNodeClick, onNodeDragStart, onNodeDrag, onConnect,
  } = useTreeState({
    nodes, edges,
    setNodes, setEdges,
    setFitTick, setEditingNodeId,
  })

  // ── Group vs family label — all edges are friend/coworker ────────────────
  const isGroupOnly = edges.length > 0 && edges.every(e => {
    const t = e.data?.relationType
    return t === 'friend' || t === 'coworker'
  })
  const familyLabel = isGroupOnly ? 'Group' : 'Family'
  const familyLabelLower = isGroupOnly ? 'group' : 'family'

  // ── Auto-switch to constellation for friend/coworker-only groups ─────────
  useEffect(() => {
    if (edges.length === 0 || treeView !== 'tree') return
    const allNonHierarchical = edges.every(e => {
      const t = e.data?.relationType
      return t === 'friend' || t === 'coworker'
    })
    if (allNonHierarchical) setTreeView('constellation')
  }, [edges]) // eslint-disable-line react-hooks/exhaustive-deps


  // ── Log return visits for engagement tracking ────────────────────────────
  useEffect(() => {
    if (returnVisit && hasUsedApp) pingVisit()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    fetchChartByToken(token).then(async chart => {
      if (!chart) return
      setNodes(await hydrateNodes(chart.nodes))
      setEdges(chart.edges)
      setCounter(chart.counter)
      // Do NOT set savedChartId — viewer doesn't own this chart
      setViewOnly(true)
      setActiveTab('tree')
      setFitTick(t => t + 1)
      logEvent('share_viewed')
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle ?purchase=success return from Stripe ────────────────────────────
  useEffect(() => {
    const status = checkPurchaseReturn()
    if (status === 'success') {
      refreshEntitlements()
      setPremiumToast(true)
      setTimeout(() => setPremiumToast(false), 5000)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Show email capture after onboarding completes (insights seen) ────────
  useEffect(() => {
    if (insightsSeen && !viewOnly && !hasBeenAsked() && isCloudEnabled()) {
      setShowEmailCapture(true)
    }
  }, [insightsSeen]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-dismiss connect prompt once first edge is added ─────────────────
  useEffect(() => {
    if (edges.length > 0 && showConnectPrompt) setShowConnectPrompt(false)
  }, [edges.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Re-layout when edges are added (e.g. spouse connected to gen 2 node) ──
  const prevEdgeCountRef = useRef(0)
  useEffect(() => {
    if (edges.length > prevEdgeCountRef.current && nodes.length > 0) {
      setNodes(prev => applyDagreLayout(prev, edges))
      setFitTick(t => t + 1)
      setNewEdgesForInsights(prev => prev + (edges.length - prevEdgeCountRef.current))
    }
    prevEdgeCountRef.current = edges.length
  }, [edges.length]) // eslint-disable-line react-hooks/exhaustive-deps

  function startDrag(e) {
    e.preventDefault()
    isDraggingRef.current = true
    const startX = e.clientX ?? e.touches?.[0]?.clientX
    const startW = sidebarWidth
    function onMove(ev) {
      if (!isDraggingRef.current) return
      const x = ev.clientX ?? ev.touches?.[0]?.clientX
      setSidebarWidth(Math.max(220, Math.min(window.innerWidth * 0.55, startW + (x - startX))))
    }
    function onUp() {
      isDraggingRef.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onUp)
  }
  // ── Add (atomic, supports multiple members) ───────────────────────────────
  async function handleAdd({ members, relationships = {} }) {
    const { parentIds = [], childIds = [], spouseIds = [] } = relationships
    const wasEmpty  = nodes.length === 0
    const startIdx  = counter
    const primaryId = `node-${startIdx}`
    const builtData = await Promise.all(members.map(m => buildNodeData(m)))
    const nextNodes = [
      ...nodes,
      ...builtData.map((data, i) => ({
        id: `node-${startIdx + i}`, type: 'astro',
        position: { x: 0, y: 0 }, data,
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
    setShowAddMore(false)
    setFitTick(t => t + 1)
    setNewMembersForChart(prev => prev + members.length)
    if (wasEmpty) {
      // Open edit panel for first person so they can add relationships immediately
      setActiveTab('add')
      setEditingNodeId(primaryId)
    } else {
      setActiveTab('tree')
      setEditingNodeId(null)
    }
    markUsed()

    // Auto-save on first add when no chart exists yet
    if (wasEmpty && !viewOnly && !savedChartId) {
      const defaultTitle = `${members[0].name}'s Chart`
      const id = Date.now().toString()
      const chart = { id, title: defaultTitle, nodes: nextNodes, edges: nextEdges, counter: nextCounter, savedAt: new Date().toISOString() }
      saveChart(chart)
      syncChart(chart)
      setSavedChartId(id)
      setSavedToast(true)
      setTimeout(() => setSavedToast(false), 4000)
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
    if (tab !== 'insights') setShowDig(false)
    if (tab === 'tree') setFitTick(t => t + 1)
    if (tab === 'insights' && edges.length > 0) {
      markInsightsSeen()
      if (!insightsSeen) logEvent('insights_seen')
      setInsightsSeen(true)
      setNewEdgesForInsights(0)
    }
  }

  // ── Load demo tree ────────────────────────────────────────────────────────
  async function handleLoadDemo() {
    const demo = await buildDemoChart()
    setNodes(applyDagreLayout(demo.nodes, demo.edges))
    setEdges(demo.edges)
    setCounter(demo.counter)
    setSavedChartId(null)
    setViewOnly(false)
    setActiveTab('tree')
    setFitTick(t => t + 1)
    markUsed()
  }

  async function handleLoadDemoCrew() {
    const demo = await buildDemoCrewChart()
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
    <div className={`app${isCosmic ? ' app--cosmic' : ' app--topnav'}${!isCosmic && nodes.length > 0 && (!panelOpen || activeTab === 'insights') ? ' app--subnav' : ''}${activeTab === 'insights' ? ' app--insights-main' : ''}`}>
      {/* ── Email capture — shown once after first named save ───────────── */}
      {showEmailCapture && (
        <EmailCapture onDismiss={() => setShowEmailCapture(false)} />
      )}

      {/* ── Upgrade prompt ──────────────────────────────────────────────── */}
      {showUpgradePrompt && (
        <UpgradePrompt
          onClose={() => setShowUpgradePrompt(false)}
          onRedeemed={() => { refreshEntitlements(); setPremiumToast(true); setTimeout(() => setPremiumToast(false), 5000) }}
        />
      )}

      {/* ── Premium welcome toast ────────────────────────────────────────── */}
      {premiumToast && (
        <div className="premium-toast">
          <p className="premium-toast-title">✦ Welcome to Celestial</p>
          <p className="premium-toast-sub">The full cosmos is yours — all views, insights, and unlimited charts unlocked.</p>
        </div>
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

      <header className="top-nav">
          <div className="top-nav-brand">
            <JupiterIcon size={26} />
            <div className="top-nav-brand-text">
              <span className="top-nav-name">AstroDig</span>
              <span className="top-nav-tagline">Jupiter Digital</span>
            </div>
          </div>
          <nav className="top-nav-tabs" aria-label="Main navigation">
            <button
              className={`top-nav-tab${(activeTab === 'add' || !!editingNodeId) ? ' active' : ''}`}
              onClick={() => goTab('add')}
            >★ {familyLabel}</button>
            <button
              className={`top-nav-tab${!panelOpen ? ' active' : ''}`}
              onClick={() => goTab('tree')}
            >☽ Charts</button>
            <span className="top-nav-tab-wrap">
              <button
                className={`top-nav-tab${activeTab === 'insights' && !editingNodeId ? ' active' : ''}`}
                onClick={() => goTab('insights')}
                disabled={nodes.length < 2}
              >✦ Insights{entitlements?.tier === 'premium' && <span className="pro-tag pro-tag--subtle">✦</span>}</button>
              {nodes.length < 2 && <span className="tab-hint">Add {2 - nodes.length} more {nodes.length === 1 ? 'person' : 'people'} to unlock</span>}
            </span>
            <button
              className={`top-nav-tab${activeTab === 'charts' && !editingNodeId ? ' active' : ''}`}
              onClick={() => goTab('charts')}
            >🗂️ Saved</button>
            <button
              className={`top-nav-tab${activeTab === 'about' && !editingNodeId ? ' active' : ''}`}
              onClick={() => goTab('about')}
            ><JupiterIcon size={14} /> About</button>
          </nav>
          <div className="top-nav-right">
            {nodes.length >= 3 && edges.length > 0 && (
              <button
                type="button"
                className="top-nav-dig-cta"
                onClick={() => { setInsightsTab('dig'); goTab('insights') }}
              >✦ The DIG</button>
            )}
            {lastSavedAt && <SyncIndicator status={syncStatus === 'idle' ? 'synced' : syncStatus} />}
            {entitlements && (
              entitlements.tier === 'premium' ? (
                <button type="button" className="top-nav-tier top-nav-tier--celestial" onClick={() => goTab('charts')}>✦ Celestial</button>
              ) : (
                <button type="button" className="top-nav-tier top-nav-tier--free" onClick={() => goTab('charts')}>
                  ✦ Unlock Celestial
                </button>
              )
            )}
          </div>
      </header>
      {nodes.length > 0 && !panelOpen && (
        <nav className="top-subnav" aria-label="Chart type">
          <div className="top-subnav-brand">Cosmic Connections</div>
          <button className={`top-subnav-btn${treeView === 'tree' ? ' active' : ''}`} onClick={() => { setTreeView('tree'); goTab('tree') }}>🌳 Family Tree</button>
          <button className={`top-subnav-btn${treeView === 'constellation' ? ' active' : ''}`} onClick={() => { setTreeView('constellation'); goTab('tree') }}>✦ Constellation</button>
          <button className={`top-subnav-btn${treeView === 'zodiac' ? ' active' : ''}`} onClick={() => { setTreeView('zodiac'); goTab('tree') }}>☉ Zodiac{entitlements?.tier === 'premium' ? <span className="pro-tag pro-tag--subtle">✦</span> : !canAccess('zodiac_view', entitlements?.tier, entitlements?.config) && <span className="tab-lock-icon">🔒</span>}</button>
          <button className={`top-subnav-btn${treeView === 'tables' ? ' active' : ''}`} onClick={() => { setTreeView('tables'); goTab('tree') }}>☽ Tables{entitlements?.tier === 'premium' ? <span className="pro-tag pro-tag--subtle">✦</span> : !canAccess('tables_view', entitlements?.tier, entitlements?.config) && <span className="tab-lock-icon">🔒</span>}</button>
        </nav>
      )}
      {activeTab === 'insights' && edges.length > 0 && (
        <nav className="top-subnav" aria-label="Insights sections">
          <div className="top-subnav-brand">Insights</div>
          <button className={`top-subnav-btn${insightsTab === 'insights' ? ' active' : ''}`} onClick={() => setInsightsTab('insights')}>✦ Insights</button>
          <button
            className={`top-subnav-btn${insightsTab === 'dig' ? ' active' : ''}`}
            onClick={() => setInsightsTab('dig')}
          >✦ The DIG{entitlements?.tier === 'premium' && <span className="pro-tag pro-tag--subtle">✦</span>}</button>
        </nav>
      )}
      {panelOpen && (
        <div
          className="top-nav-backdrop"
          onClick={() => { setActiveTab('tree'); setEditingNodeId(null) }}
        />
      )}
      {/* ── Sidebar / Panel ─────────────────────────────────────────────── */}
      <aside className={`sidebar${panelOpen ? ' open' : ''}`} style={window.innerWidth > 768 ? { width: sidebarWidth } : undefined}>
        {/* Mobile panel header — shows tab name and close button */}
        <div className="mobile-panel-header">
          <span className="mobile-panel-title">
            {editingNodeId ? 'Edit Member'
              : activeTab === 'insights' ? '✦ Insights'
              : activeTab === 'charts'   ? '🗂️ Saved Charts'
              : activeTab === 'about'    ? <><JupiterIcon size={14} /> About</>
              : `★ ${familyLabel}`}
          </span>
          <button
            type="button"
            className="mobile-panel-close"
            onClick={() => { setActiveTab('tree'); setEditingNodeId(null) }}
            aria-label="Back to tree"
          >✕</button>
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
                onGoToInsights={() => { setEditingNodeId(null); setInsightsTab('insights'); goTab('insights') }}
                onGoToView={() => {
                  const groupOnly = edges.length > 0 && edges.every(e => { const t = e.data?.relationType; return t === 'friend' || t === 'coworker' })
                  setEditingNodeId(null)
                  if (groupOnly) setTreeView('constellation')
                  else setTreeView('tree')
                  goTab('tree')
                }}
                viewLabel={edges.length > 0 && edges.every(e => { const t = e.data?.relationType; return t === 'friend' || t === 'coworker' }) ? 'View Constellation' : 'View Tree'}
              />
            </>

          /* ── Family Insights (sidebar — used on mobile) ─────────── */
          ) : activeTab === 'insights' ? (
            <InsightsPanel
              nodes={nodes} edges={edges}
              onExport={nodes.length >= 2 ? () => { logEvent('export'); handleInsightsExport() } : undefined}
              exporting={exporting}
              onAddMore={() => goTab('add')}
              onGoToTree={() => goTab('tree')}
              onEditFirst={nodes.length > 0 ? () => { setEditingNodeId(nodes[0].id); setActiveTab('add') } : undefined}
              onUpgrade={() => setShowUpgradePrompt(true)}
              entitlements={entitlements}
              chartTitle={savedChartId ? (loadCharts().find(c => c.id === savedChartId)?.title ?? null) : null}
              insightsTab={insightsTab}
              onInsightsTabChange={setInsightsTab}
              showDig={showDig}
              onShowDig={() => setShowDig(true)}
              onCloseDig={() => setShowDig(false)}
            />

          /* ── Saved charts ───────────────────────────────────────────── */
          ) : activeTab === 'charts' ? (
            <ChartsPanel
              nodes={nodes} edges={edges} counter={counter}
              savedChartId={savedChartId}
              onLoad={handleLoadChart} onNew={handleNewTreeClick}
              onDeleteCloud={deleteFromCloud}
              onRename={handleRenameChart} onDuplicate={handleDuplicateChart}
              onAddEmail={isCloudEnabled() ? () => { clearEmailAsked(); setShowEmailCapture(true) } : undefined}
              onGoToAbout={() => {
                goTab('about')
                setTimeout(() => {
                  const el = document.getElementById('about-data')
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }, 120)
              }}
              entitlements={entitlements}
              onUpgrade={() => setShowUpgradePrompt(true)}
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
                  {/* Return visit welcome — shown after 3+ days away */}
                  {returnVisit && (
                    <div className="return-visit-card">
                      <div className="return-visit-body">
                        <JupiterIcon size={16} />
                        <div>
                          <p className="return-visit-greeting">Welcome back ✦</p>
                          <p className="return-visit-hint">Your chart is right here — pick up where you left off.</p>
                        </div>
                      </div>
                      <button type="button" className="return-visit-close" onClick={() => setReturnVisit(false)}>×</button>
                    </div>
                  )}

                  {/* Member list header + add more toggle */}
                  <div className="member-list">
                    <div className="member-list-header">
                      <h3>Your {familyLabel} · {nodes.length}</h3>
                      <span className="member-list-hint">oldest first · tap to connect</span>
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

                    {Object.keys(nodeIngressWarnings).length > 0 && (
                      <div className="ingress-key">
                        <span className="ingress-key-icon">⚠</span>
                        <span className="ingress-key-text">
                          Sign may depend on birth time — tap the member to add it (optional)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Save status */}
                  {lastSavedAt && (
                    <div className="family-save-status">
                      <span className="family-save-check">✓</span>
                      <span className="family-save-label">
                        Chart auto-saved
                        <span className="family-save-time"> · {formatRelativeTime(lastSavedAt)}</span>
                      </span>
                      {syncStatus === 'synced' && <span className="family-save-cloud" title="Backed up to cloud">☁</span>}
                      {syncStatus === 'error'  && <span className="family-save-cloud family-save-cloud--err" title="Could not sync — saved locally">☁</span>}
                    </div>
                  )}

                  {/* Insights CTA — shown until user visits Insights tab */}
                  {!insightsSeen && nodes.length >= 2 && edges.length > 0 && (
                    <button type="button" className="insights-cta-banner" onClick={() => goTab('insights')}>
                      <span className="insights-cta-icon">✦</span>
                      <span className="insights-cta-text">Discover your {familyLabelLower}'s cosmic patterns</span>
                      <span className="insights-cta-arrow">→</span>
                    </button>
                  )}

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
              {nodes.length >= 3 && edges.length > 0 && (<>
                {' · '}
                <button type="button" className="footer-about-link footer-dig-link" onClick={() => { setInsightsTab('dig'); goTab('insights') }}>✦ The DIG</button>
              </>)}
            </span>
            {lastSavedAt && (
              <span className="footer-saved-inline">
                <SyncIndicator status={syncStatus === 'idle' ? 'synced' : syncStatus} />
                <span>{formatRelativeTime(lastSavedAt)}</span>
              </span>
            )}
          </div>
          {entitlements && (
            <div style={{ marginTop: '0.4rem', textAlign: 'center' }}>
              {entitlements?.tier === 'premium' ? (<>
                <span className="tier-badge tier-badge--celestial">✦ Celestial</span>
                {(() => { try { const e = localStorage.getItem('astrotree_user_email'); return e ? <span className="tier-email">{e}</span> : null } catch { return null } })()}
              </>) : (
                <button type="button" className="tier-badge tier-badge--free" onClick={() => setShowUpgradePrompt(true)} style={{ cursor: 'pointer', background: 'none' }}>
                  ✦ Unlock Celestial
                </button>
              )}
            </div>
          )}
        </footer>
      </aside>

      <div className="split-drag-handle" onMouseDown={startDrag} onTouchStart={startDrag} title="Drag to resize" />

      {/* ── Mobile bottom tab bar ────────────────────────────────────────── */}
      {/* ── Tier status bar (classic mobile) ────────────────────────────── */}
      {entitlements && (
        <div className="tier-bar">
          {entitlements.tier === 'premium' ? (
            <span className="tier-bar-status tier-bar-status--celestial">✦ Celestial</span>
          ) : (
            <button type="button" className="tier-bar-upgrade" onClick={() => setShowUpgradePrompt(true)}>
              ✦ Unlock Celestial
            </button>
          )}
        </div>
      )}
      <nav className="bottom-tab-bar" aria-label="Main navigation">
        <button
          className={`bottom-tab${activeTab === 'add' || !!editingNodeId ? ' active' : ''}`}
          onClick={() => goTab('add')}
        >
          <span className="bottom-tab-icon">★</span>
          <span className="bottom-tab-label">{familyLabel}</span>
        </button>
        <button
          className={`bottom-tab${activeTab === 'tree' && !editingNodeId ? ' active' : ''}`}
          onClick={() => { setActiveTab('tree'); setEditingNodeId(null); setFitTick(t => t + 1); setNewMembersForChart(0) }}
        >
          <span className="bottom-tab-icon" style={{ position: 'relative', display: 'inline-flex' }}>
            ✦
            {newMembersForChart > 0 && (
              <span className="bottom-tab-badge">{newMembersForChart}</span>
            )}
          </span>
          <span className="bottom-tab-label">Chart</span>
        </button>
        <span className="bottom-tab-wrap">
          <button
            className={`bottom-tab${activeTab === 'insights' && !editingNodeId ? ' active' : ''}`}
            onClick={() => goTab('insights')}
            disabled={nodes.length < 2}
          >
            <span className="bottom-tab-icon" style={{ position: 'relative', display: 'inline-flex' }}>
              ☍
              {newEdgesForInsights > 0 && (
                <span className="bottom-tab-badge">{newEdgesForInsights}</span>
              )}
            </span>
            <span className="bottom-tab-label">Insights</span>
          </button>
          {nodes.length < 2 && nodes.length > 0 && <span className="tab-hint tab-hint--bottom">Add {2 - nodes.length} more to unlock</span>}
        </span>
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
        {nodes.length === 0 && !isCosmic && (
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
            <span>Connect your {familyLabelLower} members as parents, children, or partners</span>
            <button
              type="button"
              className="connect-prompt-action"
              onClick={() => { goTab('add'); setShowConnectPrompt(false) }}
            >Go to {familyLabel} →</button>
            <button
              type="button"
              className="connect-prompt-close"
              onClick={() => setShowConnectPrompt(false)}
            >Got it</button>
          </div>
        )}

        {/* ── Persistent no-connections nudge (tree view only) ─────────── */}
        {!showConnectPrompt && treeView === 'tree' && nodes.length > 0 && edges.length === 0 && (
          <>
            <div className="no-connections-nudge no-connections-nudge--top">
              <span>No connections yet —</span>
              <button
                type="button"
                className="no-connections-btn"
                onClick={() => goTab('add')}
              >Add Relationships →</button>
            </div>
            <div className="no-connections-nudge">
              <span>No connections yet —</span>
              <button
                type="button"
                className="no-connections-btn"
                onClick={() => goTab('add')}
              >Add Relationships →</button>
            </div>
          </>
        )}

        {/* View toggle (tree vs zodiac vs constellation) */}
        {nodes.length > 0 && (
          <div className="tree-view-toggle">
            <button
              type="button"
              className={`tree-view-btn${treeView === 'tree' ? ' tree-view-btn--active' : ''}`}
              onClick={() => setTreeView('tree')}
            >
              🌳 Family Tree
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
              className={`tree-view-btn${treeView === 'zodiac' ? ' tree-view-btn--active' : ''}`}
              onClick={() => setTreeView('zodiac')}
            >
              ☉ Zodiac
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

        {/* ── Chart view explanation ─────────────────────────────────── */}
        {nodes.length > 0 && (
          <div className="chart-view-explain">
            {treeView === 'tree' && 'Hierarchical family tree — drag to rearrange, click to edit.'}
            {treeView === 'constellation' && 'Force-directed network — see friends, coworkers, and all connections as a star map.'}
            {treeView === 'zodiac' && 'Zodiac wheel — members placed by sun sign with moon and planetary rings.'}
            {treeView === 'tables' && 'Data tables — every member\'s sun, moon, and planetary signs at a glance.'}
          </div>
        )}

        {/* ── Sync indicator (non-intrusive, doesn't shift buttons) ──── */}
        {nodes.length > 0 && (
          <div className="canvas-sync-float">
            <SyncIndicator status={syncStatus} />
          </div>
        )}

        {/* ── Canvas action bar — single horizontal strip ────────────── */}
        {nodes.length > 0 && isCosmic && (
          <div className="cosmic-action-bar">
            {(treeView === 'tree' || treeView === 'constellation') && (
              <button type="button" className="cosmic-action-btn" onClick={handleRelayout} title="Re-layout">⟳</button>
            )}
            <button
              type="button"
              className="cosmic-action-btn"
              onClick={() => { logEvent('export'); (treeView === 'zodiac' ? handleZodiacExport : treeView === 'constellation' ? handleConstellationExport : treeView === 'tables' ? handleTablesExport : handleExport)() }}
              disabled={exporting}
            >{exporting ? '…' : '↓'}</button>
            <ShareButton savedChartId={savedChartId} syncStatus={syncStatus} />
          </div>
        )}
        {/* Classic mode action buttons */}
        {nodes.length > 0 && !isCosmic && (
          <div className="canvas-panel-btns">
            <button type="button" className="relayout-btn relayout-btn--insights" onClick={() => goTab('insights')}>✦ Insights</button>
            <ShareButton savedChartId={savedChartId} syncStatus={syncStatus} />
            <button
              type="button"
              className="relayout-btn relayout-btn--share"
              onClick={() => { logEvent('export'); (treeView === 'zodiac' ? handleZodiacExport : treeView === 'constellation' ? handleConstellationExport : treeView === 'tables' ? handleTablesExport : handleExport)() }}
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
              <button type="button" className="relayout-btn" onClick={handleRelayout} title="Re-layout">⟳ Re-layout</button>
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
            {' · '}
            <a href="/" className="view-only-cta">
              ✦ Create Your Own Chart
            </a>
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

        {/* ── Insights in main area (classic mode only; cosmic uses bottom sheet) */}
        {!isCosmic && activeTab === 'insights' ? (
          <div className="insights-main-area">
            <InsightsPanel
              nodes={nodes} edges={edges}
              onExport={nodes.length >= 2 ? () => { logEvent('export'); handleInsightsExport() } : undefined}
              exporting={exporting}
              onAddMore={() => goTab('add')}
              onGoToTree={() => goTab('tree')}
              onEditFirst={nodes.length > 0 ? () => { setEditingNodeId(nodes[0].id); setActiveTab('add') } : undefined}
              onUpgrade={() => setShowUpgradePrompt(true)}
              entitlements={entitlements}
              chartTitle={savedChartId ? (loadCharts().find(c => c.id === savedChartId)?.title ?? null) : null}
              insightsTab={insightsTab}
              onInsightsTabChange={setInsightsTab}
              showDig={showDig}
              onShowDig={() => setShowDig(true)}
              onCloseDig={() => setShowDig(false)}
            />
          </div>
        ) : treeView === 'tables' && nodes.length > 0 ? (
          <div className="tables-canvas-wrap" style={{ position: 'relative' }}>
            {!canAccess('tables_view', entitlements?.tier, entitlements?.config) && (
              <LockedOverlay
                feature="Tables View"
                description="See every family member's sun, moon, and planetary signs in a sortable table."
                onUpgrade={() => setShowUpgradePrompt(true)}
              />
            )}
            <TablesPanel nodes={nodes} chartTitle={savedChartId ? (loadCharts().find(c => c.id === savedChartId)?.title ?? null) : null} />
          </div>
        ) : treeView === 'zodiac' && nodes.length > 0 ? (
          <div style={{ position: 'relative', flex: 1 }}>
            {!canAccess('zodiac_view', entitlements?.tier, entitlements?.config) && (
              <LockedOverlay
                feature="Zodiac Wheel"
                description="Map your family across the zodiac with sun, moon, and planetary rings."
                onUpgrade={() => setShowUpgradePrompt(true)}
              />
            )}
            <Suspense fallback={null}>
              <ZodiacWheel
                nodes={nodes}
                edges={edges}
                onSelectNode={(id) => setEditingNodeId(id)}
              />
            </Suspense>
          </div>
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
          onNodeDragStart={onNodeDragStart} onNodeDrag={onNodeDrag}
          nodeTypes={NODE_TYPES}
          fitView fitViewOptions={{ padding: 0.25 }}
          minZoom={0.3} colorMode="dark"
          proOptions={{ hideAttribution: true }}
        >
          <FitViewOnLayout fitTick={fitTick} fitViewRef={fitViewRef} />
          <Background color="#1a1040" gap={36} size={1} />
          {nodes.length > 0 && <Controls showInteractive={false} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }} />}
        </ReactFlow>
        )}
      </main>

      {/* ── Cosmic mode: bottom nav, floating pills, bottom sheets ────── */}
      {isCosmic && (
        <>
          {/* Floating pills — chart type switcher on canvas */}
          {nodes.length > 0 && activeTab === 'tree' && !editingNodeId && (
            <FloatingPills
              treeView={treeView}
              setTreeView={setTreeView}
              entitlements={entitlements}
            />
          )}

          {/* Canvas onboarding — replaces welcome screen */}
          {nodes.length === 0 && (
            <CanvasOnboarding
              onAdd={handleAdd}
              onDemo={handleLoadDemo}
              onDemoCrew={handleLoadDemoCrew}
              onLoadCharts={() => goTab('charts')}
              onNewChart={() => goTab('add')}
              hasUsedApp={hasUsedApp}
            />
          )}

          {/* DIG FAB */}
          {nodes.length >= 3 && edges.length > 0 && activeTab === 'tree' && (
            <button
              type="button"
              className="cosmic-dig-fab"
              onClick={() => { setInsightsTab('dig'); setShowDig(true) }}
              title="The DIG — your cosmic story"
            >
              <span className="cosmic-dig-fab-icon">✦</span>
              <span className="cosmic-dig-fab-label">The DIG</span>
            </button>
          )}

          {/* Family + Edit member sheet (merged — no flash on transition) */}
          <BottomSheet
            open={isCosmic && (!!editingNodeId || activeTab === 'add')}
            title={editingNode ? 'Edit Member' : `★ ${familyLabel}`}
            onClose={() => { setEditingNodeId(null); goTab('tree') }}
          >
            {editingNode ? (
              <>
              <button
                type="button"
                className="back-btn"
                onClick={() => { setEditingNodeId(null); setActiveTab('add') }}
                style={{ alignSelf: 'flex-start', marginBottom: '0.25rem' }}
              >← Back to {familyLabel}</button>
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
                onGoToInsights={() => { setEditingNodeId(null); setInsightsTab('insights'); goTab('insights') }}
                onGoToView={() => {
                  const groupOnly = edges.length > 0 && edges.every(e => { const t = e.data?.relationType; return t === 'friend' || t === 'coworker' })
                  setEditingNodeId(null)
                  if (groupOnly) setTreeView('constellation')
                  else setTreeView('tree')
                  goTab('tree')
                }}
                viewLabel={edges.length > 0 && edges.every(e => { const t = e.data?.relationType; return t === 'friend' || t === 'coworker' }) ? 'View Constellation' : 'View Tree'}
              />
              </>
            ) : (
              /* ── Family member list (same sheet, no edit selected) ── */
              <>
                <OnboardingProgress
                  nodes={nodes}
                  edges={edges}
                  onGoToTree={() => goTab('tree')}
                  onGoToInsights={() => goTab('insights')}
                />
                {nodes.length === 0 ? (
                  <>
                    <div className="family-welcome">
                      <div className="family-welcome-inline">
                        <JupiterIcon size={30} />
                        <h2 className="family-welcome-title">{hasUsedApp ? 'Start a New Chart' : 'Welcome to AstroDig'}</h2>
                      </div>
                      <p className="family-welcome-sub">
                        {hasUsedApp
                          ? 'Add family members below to build another celestial chart.'
                          : 'Build your family\'s celestial chart and discover the cosmic patterns woven across generations.'}
                      </p>
                    </div>
                    <AddMembersForm onAdd={handleAdd} />
                  </>
                ) : (
                  <>
                    <div className="member-list">
                      <div className="member-list-header">
                        <h3>Your {familyLabel} · {nodes.length}</h3>
                        <span className="member-list-hint">oldest first · tap to connect</span>
                      </div>
                      <div className="add-more-section">
                        <button type="button" className="add-more-toggle" onClick={() => setShowAddMore(o => !o)}>
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
                            {n.data.birthdate && <span className="pill-year"> · {n.data.birthdate.slice(0, 4)}</span>}
                          </span>
                          {nodeIngressWarnings[n.id] && (
                            <span className="pill-warning" title="Tap to edit — birth time may affect sign accuracy">⚠</span>
                          )}
                        </div>
                      ))}

                      {Object.keys(nodeIngressWarnings).length > 0 && (
                        <div className="ingress-key">
                          <span className="ingress-key-icon">⚠</span>
                          <span className="ingress-key-text">
                            Sign may depend on birth time — tap the member to add it (optional)
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="family-bottom-actions">
                      <button type="button" className="family-tree-btn" onClick={handleNewTreeClick}>＋ New Chart</button>
                    </div>
                  </>
                )}
              </>
            )}
          </BottomSheet>

          {/* Insights sheet */}
          <BottomSheet
            open={isCosmic && activeTab === 'insights'}
            title="✦ Insights"
            onClose={() => goTab('tree')}
          >
            <InsightsPanel
              nodes={nodes} edges={edges}
              onExport={nodes.length >= 2 ? () => { logEvent('export'); handleInsightsExport() } : undefined}
              exporting={exporting}
              onAddMore={() => goTab('add')}
              onGoToTree={() => goTab('tree')}
              onEditFirst={nodes.length > 0 ? () => { setEditingNodeId(nodes[0].id); setActiveTab('add') } : undefined}
              onUpgrade={() => setShowUpgradePrompt(true)}
              entitlements={entitlements}
              chartTitle={savedChartId ? (loadCharts().find(c => c.id === savedChartId)?.title ?? null) : null}
              insightsTab={insightsTab}
              onInsightsTabChange={setInsightsTab}
              showDig={showDig}
              onShowDig={() => setShowDig(true)}
              onCloseDig={() => setShowDig(false)}
            />
          </BottomSheet>

          {/* Charts sheet */}
          <BottomSheet
            open={isCosmic && activeTab === 'charts'}
            title="🗂️ Saved Charts"
            onClose={() => goTab('tree')}
          >
            <ChartsPanel
              nodes={nodes} edges={edges} counter={counter}
              savedChartId={savedChartId}
              onLoad={handleLoadChart} onNew={handleNewTreeClick}
              onDeleteCloud={deleteFromCloud}
              onRename={handleRenameChart} onDuplicate={handleDuplicateChart}
              onAddEmail={isCloudEnabled() ? () => { clearEmailAsked(); setShowEmailCapture(true) } : undefined}
              onGoToAbout={() => goTab('about')}
              entitlements={entitlements}
              onUpgrade={() => setShowUpgradePrompt(true)}
            />
          </BottomSheet>

          {/* About sheet */}
          <BottomSheet
            open={isCosmic && activeTab === 'about'}
            title="About"
            onClose={() => goTab('tree')}
          >
            <AboutPanel />
          </BottomSheet>

          {/* Cosmic bottom nav */}
          <nav className="cosmic-bottom-nav" aria-label="Main navigation">
            {/* Tier + sync row */}
            {entitlements && (
              <div className="cosmic-nav-tier-row">
                {lastSavedAt && <SyncIndicator status={syncStatus === 'idle' ? 'synced' : syncStatus} />}
                {entitlements.tier === 'premium' ? (
                  <button type="button" className="tier-bar-status tier-bar-status--celestial" onClick={() => goTab('charts')}>✦ Celestial</button>
                ) : (
                  <button type="button" className="tier-bar-upgrade" onClick={() => goTab('charts')}>
                    ✦ Unlock Celestial
                  </button>
                )}
              </div>
            )}
            <div className="cosmic-bottom-nav-buttons">
              <button
                className={`cosmic-bottom-nav-btn${activeTab === 'add' || !!editingNodeId ? ' active' : ''}`}
                onClick={() => goTab('add')}
              >
                <span className="cosmic-bottom-nav-icon">★</span>
                <span className="cosmic-bottom-nav-label">{familyLabel}</span>
              </button>
              <button
                className={`cosmic-bottom-nav-btn${activeTab === 'tree' && !editingNodeId ? ' active' : ''}`}
                onClick={() => { goTab('tree'); setNewMembersForChart(0) }}
              >
                <span className="cosmic-bottom-nav-icon" style={{ position: 'relative', display: 'inline-flex' }}>
                  ✦
                  {newMembersForChart > 0 && <span className="cosmic-bottom-nav-badge">{newMembersForChart}</span>}
                </span>
                <span className="cosmic-bottom-nav-label">Chart</span>
              </button>
              <span style={{ flex: 1, display: 'inline-flex', position: 'relative' }}>
                <button
                  className={`cosmic-bottom-nav-btn${activeTab === 'insights' && !editingNodeId ? ' active' : ''}`}
                  onClick={() => goTab('insights')}
                  disabled={nodes.length < 2}
                  style={{ flex: 1 }}
                >
                  <span className="cosmic-bottom-nav-icon" style={{ position: 'relative', display: 'inline-flex' }}>
                    ☍
                    {newEdgesForInsights > 0 && <span className="cosmic-bottom-nav-badge">{newEdgesForInsights}</span>}
                  </span>
                  <span className="cosmic-bottom-nav-label">Insights</span>
                </button>
              </span>
              <button
                className={`cosmic-bottom-nav-btn${activeTab === 'charts' && !editingNodeId ? ' active' : ''}`}
                onClick={() => goTab('charts')}
              >
                <span className="cosmic-bottom-nav-icon">📚</span>
                <span className="cosmic-bottom-nav-label">Saved</span>
              </button>
              <button
                className={`cosmic-bottom-nav-btn${activeTab === 'about' && !editingNodeId ? ' active' : ''}`}
                onClick={() => goTab('about')}
              >
                <span className="cosmic-bottom-nav-icon"><JupiterIcon size={22} /></span>
                <span className="cosmic-bottom-nav-label">About</span>
              </button>
            </div>
          </nav>
        </>
      )}

    </div>
  )
}
