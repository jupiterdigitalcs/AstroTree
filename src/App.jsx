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
import ZodiacWheel        from './components/ZodiacWheel.jsx'
import ConstellationView from './components/ConstellationView.jsx'
import ChartsPanel     from './components/ChartsPanel.jsx'
import InsightsPanel   from './components/InsightsPanel.jsx'
import AboutPanel      from './components/AboutPanel.jsx'
import { JupiterIcon }            from './components/JupiterIcon.jsx'
import { getSunSign, getElement } from './utils/astrology.js'
import { applyDagreLayout }      from './utils/layout.js'
import { saveDraft, loadDraft, saveChart, loadCharts }  from './utils/storage.js'
import { useCloudSync } from './hooks/useCloudSync.js'
import { SyncIndicator } from './components/SyncIndicator.jsx'
import { ShareButton } from './components/ShareButton.jsx'
import { fetchChartByToken, isCloudEnabled } from './utils/cloudStorage.js'
import { EmailCapture, hasBeenAsked, clearEmailAsked } from './components/EmailCapture.jsx'
import { OnboardingProgress, markInsightsSeen } from './components/OnboardingProgress.jsx'
import { buildDemoChart } from './utils/demoData.js'

const NODE_TYPES = { astro: AstroNode }

function formatRelativeTime(date) {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000)
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  return `${Math.floor(secs / 3600)}h ago`
}

const EDGE_STYLE    = { stroke: '#c9a84c', strokeWidth: 1.5 }
const SPOUSE_STYLE  = { stroke: '#d4a0bc', strokeWidth: 1.5, strokeDasharray: '6,4' }
const FRIEND_STYLE  = { stroke: '#5bc8f5', strokeWidth: 1.5, strokeDasharray: '4,4' }
const COWORKER_STYLE = { stroke: '#a0a0b8', strokeWidth: 1.5, strokeDasharray: '4,4' }

const EDGE_STYLES = {
  'parent-child': EDGE_STYLE,
  'spouse':       SPOUSE_STYLE,
  'friend':       FRIEND_STYLE,
  'coworker':     COWORKER_STYLE,
}

function makeEdge(source, target, relationType = 'parent-child') {
  const isFamily = relationType === 'parent-child'
  return {
    id: `e-${source}-${target}`, source, target,
    data:     { relationType },
    animated: isFamily,
    style:    EDGE_STYLES[relationType] || EDGE_STYLE,
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
  const [activeTab,         setActiveTab]         = useState(() => {
    try { const draft = loadDraft(); return (draft?.nodes?.length > 0) ? 'add' : 'tree' } catch { return 'add' }
  })
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
  // Set when viewing a shared chart via ?view=token — prevents autosave under viewer's device
  const [viewOnly,          setViewOnly]          = useState(false)
  const [treeView,          setTreeView]          = useState('tree') // 'tree' | 'zodiac' | 'constellation'
  const [constellationTick, setConstellationTick] = useState(0)
  const [showEmailCapture,  setShowEmailCapture]  = useState(false)
  const [lastSavedAt,       setLastSavedAt]       = useState(null)
  const [treeViewedCount,   setTreeViewedCount]   = useState(0)

  const fitViewRef = useRef(null)

  // Mobile panel is open when not on the tree tab, or when editing a node
  const panelOpen = activeTab !== 'tree' || !!editingNodeId

  const { syncStatus, syncChart, deleteFromCloud } = useCloudSync({
    onMergeCharts: () => {/* ChartsPanel will re-read localStorage on its own mount */},
  })

  // ── Handle ?view=<share_token> shared chart link ──────────────────────────
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('view')
    if (!token || !isCloudEnabled()) return
    fetchChartByToken(token).then(chart => {
      if (!chart) return
      setNodes(chart.nodes)
      setEdges(chart.edges)
      setCounter(chart.counter)
      // Do NOT set savedChartId — viewer doesn't own this chart
      setViewOnly(true)
      setActiveTab('tree')
      setFitTick(t => t + 1)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Restore draft on first load ───────────────────────────────────────────
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('view')) return // skip draft if viewing shared link
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
      const updated = { ...existing, nodes, edges, counter, savedAt: new Date().toISOString() }
      saveChart(updated)
      syncChart(updated)
      setLastSavedAt(new Date())
    }, 800)
    return () => clearTimeout(t)
  }, [nodes, edges, counter, savedChartId]) // eslint-disable-line react-hooks/exhaustive-deps

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
        sourceHandle: srcLeft ? 'right-src' : 'left-src',
        targetHandle: srcLeft ? 'left-tgt'  : 'right-tgt',
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
      if (!hasBeenAsked() && isCloudEnabled()) setShowEmailCapture(true)
    }
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
      // Only one relationship per pair — reject if any edge already connects them
      const alreadyConnected = prev.some(e =>
        (e.source === source && e.target === target) ||
        (e.source === target && e.target === source)
      )
      if (alreadyConnected) return prev
      // Prevent parent-child cycles (A→B→…→A) — only applies to parent-child edges
      if (relationType === 'parent-child') {
        const children = new Set([target])
        let changed = true
        while (changed) {
          changed = false
          for (const e of prev) {
            if (e.data?.relationType !== 'parent-child') continue
            if (children.has(e.source) && !children.has(e.target)) {
              children.add(e.target)
              changed = true
            }
          }
        }
        if (children.has(source)) return prev // would create a cycle
      }
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
    setNodes(applyDagreLayout(chart.nodes, chart.edges))
    setEdges(chart.edges); setCounter(chart.counter)
    setSavedChartId(chart.isSample ? null : chart.id)
    setEditingNodeId(null); setActiveTab('tree'); setTreeView('tree')
    setFitTick(t => t + 1)
  }, [setNodes, setEdges])

  const handleNewChart = useCallback(() => {
    setNodes([]); setEdges([]); setCounter(1)
    setSavedChartId(null)
    setEditingNodeId(null); setActiveTab('add')
  }, [setNodes, setEdges])

  const handleRenameChart = useCallback((updatedChart) => {
    // If the active chart was renamed, keep savedChartId pointing to same id (unchanged)
    // Just sync the rename to cloud
    syncChart(updatedChart)
  }, [syncChart]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDuplicateChart = useCallback((chart) => {
    const newId    = Date.now().toString()
    const newChart = {
      ...chart,
      id:      newId,
      title:   `${chart.title} (copy)`,
      savedAt: new Date().toISOString(),
    }
    saveChart(newChart)
    syncChart(newChart)
    handleLoadChart(newChart)
  }, [handleLoadChart]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRelayout = useCallback(() => {
    if (treeView === 'constellation') {
      setConstellationTick(t => t + 1)
    } else {
      setNodes(prev => applyDagreLayout(prev, edges))
      setFitTick(t => t + 1)
    }
  }, [edges, setNodes, treeView])

  // ── Save tree to named chart ──────────────────────────────────────────────
  function handleSaveChart(e) {
    e.preventDefault()
    if (!saveTitle.trim() || nodes.length === 0) return
    const id = Date.now().toString()
    const chart = { id, title: saveTitle.trim(), nodes, edges, counter, savedAt: new Date().toISOString() }
    saveChart(chart)
    syncChart(chart)
    setSavedChartId(id)
    setLastSavedAt(new Date())
    setViewOnly(false)
    setShowSaveDialog(false)
    setSaveTitle('')
    // Show email capture once, only after their first ever named save
    if (!hasBeenAsked() && isCloudEnabled()) setShowEmailCapture(true)
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

    fitViewRef.current?.({ padding: 0.12, duration: 0 })
    await new Promise(r => setTimeout(r, 120))

    el.classList.add('exporting')

    const chartTitle = loadCharts().find(c => c.id === savedChartId)?.title
    const treeSlug = chartTitle ? chartTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase() : 'family-tree'
    const treeFilename = `${treeSlug}-tree.png`

    try {
      const pr = 2
      const url = await toPng(el, {
        backgroundColor: '#09071a',
        pixelRatio: pr,
        filter: node => {
          const c = node.classList
          if (!c) return true
          if (c.contains('react-flow__background')) return false
          if (c.contains('react-flow__controls'))   return false
          if (c.contains('canvas-panel-btns'))      return false
          if (c.contains('connect-prompt'))         return false
          if (c.contains('canvas-brand'))           return false
          return true
        },
      })

      // Composite brand bar below the tree image using canvas API
      await document.fonts.ready
      const img = new Image()
      img.src = url
      await new Promise(r => { img.onload = r })
      const barH = 36 * pr
      const cvs = document.createElement('canvas')
      cvs.width  = img.width
      cvs.height = img.height + barH
      const ctx = cvs.getContext('2d')
      ctx.drawImage(img, 0, 0)
      ctx.fillStyle = '#09071a'
      ctx.fillRect(0, img.height, cvs.width, barH)
      ctx.strokeStyle = 'rgba(201,168,76,0.2)'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(0, img.height); ctx.lineTo(cvs.width, img.height); ctx.stroke()
      const pad = 16 * pr
      const mid = img.height + barH / 2
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#c9a84c'
      ctx.font = `600 ${13 * pr}px Cinzel, Georgia, serif`
      ctx.textAlign = 'left'
      ctx.fillText('✦ AstroDig · Jupiter Digital', pad, mid)
      ctx.fillStyle = 'rgba(184,170,212,0.7)'
      ctx.font = `${10 * pr}px Raleway, Helvetica, sans-serif`
      ctx.textAlign = 'right'
      ctx.fillText('jupreturns@gmail.com  ·  @jupreturn', cvs.width - pad, mid)
      const finalUrl = cvs.toDataURL('image/png')

      // On mobile, use native share sheet so user can save to camera roll
      const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
      if (isMobile && navigator.share) {
        const res = await fetch(finalUrl)
        const blob = await res.blob()
        const file = new File([blob], treeFilename, { type: 'image/png' })
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: chartTitle ? `${chartTitle} · AstroDig` : 'My Family Astrology Tree',
            text: 'Check out my family astrology tree, made with AstroDig by Jupiter Digital ✦',
          })
          return
        }
      }
      const link = document.createElement('a')
      link.download = treeFilename
      link.href = finalUrl
      link.click()
    } catch (err) {
      if (err?.name === 'AbortError') return
      setExportError('Export failed — please try again.')
    } finally {
      el.classList.remove('exporting')
      setExporting(false)
    }
  }, [exporting, savedChartId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Export zodiac wheel image ──────────────────────────────────────────────
  const handleZodiacExport = useCallback(async () => {
    const el = document.querySelector('.zodiac-wheel-wrap')
    if (!el || exporting) return
    setExportError(null)
    setExporting(true)

    const chartTitle = loadCharts().find(c => c.id === savedChartId)?.title
    const slug = chartTitle ? chartTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase() : 'family'
    const filename = `${slug}-zodiac.png`

    try {
      const url = await toPng(el, {
        backgroundColor: '#09071a',
        pixelRatio: 2,
        filter: node => {
          const c = node.classList
          if (!c) return true
          if (c.contains('zodiac-tooltip')) return false
          return true
        },
      })

      // Composite brand bar below
      await document.fonts.ready
      const img = new Image()
      img.src = url
      await new Promise(r => { img.onload = r })
      const pr = 2
      const barH = 36 * pr
      const cvs = document.createElement('canvas')
      cvs.width  = img.width
      cvs.height = img.height + barH
      const ctx = cvs.getContext('2d')
      ctx.drawImage(img, 0, 0)
      ctx.fillStyle = '#09071a'
      ctx.fillRect(0, img.height, cvs.width, barH)
      ctx.strokeStyle = 'rgba(201,168,76,0.2)'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(0, img.height); ctx.lineTo(cvs.width, img.height); ctx.stroke()
      const pad = 16 * pr
      const mid = img.height + barH / 2
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#c9a84c'
      ctx.font = `600 ${13 * pr}px Cinzel, Georgia, serif`
      ctx.textAlign = 'left'
      ctx.fillText('✦ AstroDig · Jupiter Digital', pad, mid)
      ctx.fillStyle = 'rgba(184,170,212,0.7)'
      ctx.font = `${10 * pr}px Raleway, Helvetica, sans-serif`
      ctx.textAlign = 'right'
      ctx.fillText('jupreturns@gmail.com  ·  @jupreturn', cvs.width - pad, mid)
      const finalUrl = cvs.toDataURL('image/png')

      const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
      if (isMobile && navigator.share) {
        const res = await fetch(finalUrl)
        const blob = await res.blob()
        const file = new File([blob], filename, { type: 'image/png' })
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: chartTitle ? `${chartTitle} · Zodiac Wheel` : 'Family Zodiac Wheel',
            text: 'Check out my family zodiac wheel from AstroDig by Jupiter Digital ✦',
          })
          return
        }
      }
      const link = document.createElement('a')
      link.download = filename
      link.href = finalUrl
      link.click()
    } catch (err) {
      if (err?.name === 'AbortError') return
      setExportError('Export failed — please try again.')
    } finally {
      setExporting(false)
    }
  }, [exporting, savedChartId])

  // ── Export constellation image ────────────────────────────────────────────
  const handleConstellationExport = useCallback(async () => {
    const el = document.querySelector('.constellation-wrap')
    if (!el || exporting) return
    setExportError(null)
    setExporting(true)

    const chartTitle = loadCharts().find(c => c.id === savedChartId)?.title
    const slug = chartTitle ? chartTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase() : 'family'
    const filename = `${slug}-constellation.png`

    try {
      const url = await toPng(el, {
        backgroundColor: '#09071a',
        pixelRatio: 2,
        filter: node => {
          const c = node.classList
          if (!c) return true
          if (c.contains('constellation-tooltip')) return false
          if (c.contains('constellation-controls')) return false
          return true
        },
      })

      // Composite brand bar below
      await document.fonts.ready
      const img = new Image()
      img.src = url
      await new Promise(r => { img.onload = r })
      const pr = 2
      const barH = 36 * pr
      const cvs = document.createElement('canvas')
      cvs.width  = img.width
      cvs.height = img.height + barH
      const ctx = cvs.getContext('2d')
      ctx.drawImage(img, 0, 0)
      ctx.fillStyle = '#09071a'
      ctx.fillRect(0, img.height, cvs.width, barH)
      ctx.strokeStyle = 'rgba(201,168,76,0.2)'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(0, img.height); ctx.lineTo(cvs.width, img.height); ctx.stroke()
      const pad = 16 * pr
      const mid = img.height + barH / 2
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#c9a84c'
      ctx.font = `600 ${13 * pr}px Cinzel, Georgia, serif`
      ctx.textAlign = 'left'
      ctx.fillText('✦ AstroDig · Jupiter Digital', pad, mid)
      ctx.fillStyle = 'rgba(184,170,212,0.7)'
      ctx.font = `${10 * pr}px Raleway, Helvetica, sans-serif`
      ctx.textAlign = 'right'
      ctx.fillText('jupreturns@gmail.com  ·  @jupreturn', cvs.width - pad, mid)
      const finalUrl = cvs.toDataURL('image/png')

      const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
      if (isMobile && navigator.share) {
        const res = await fetch(finalUrl)
        const blob = await res.blob()
        const file = new File([blob], filename, { type: 'image/png' })
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: chartTitle ? `${chartTitle} · Constellation` : 'Family Constellation',
            text: 'Check out my constellation map from AstroDig by Jupiter Digital ✦',
          })
          return
        }
      }
      const link = document.createElement('a')
      link.download = filename
      link.href = finalUrl
      link.click()
    } catch (err) {
      if (err?.name === 'AbortError') return
      setExportError('Export failed — please try again.')
    } finally {
      setExporting(false)
    }
  }, [exporting, savedChartId])

  // ── Export insights image (captures live .insights-panel from the DOM) ────
  const handleInsightsExport = useCallback(async () => {
    const el = document.querySelector('.insights-panel')
    if (!el || exporting) return
    setExportError(null)
    setExporting(true)

    const brandEl = el.querySelector('.insights-brand-footer')
    const prevPadding = el.style.padding
    el.style.padding = '1.5rem'
    if (brandEl) brandEl.style.display = 'flex'

    const chartTitle = loadCharts().find(c => c.id === savedChartId)?.title
    const slug = chartTitle ? chartTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase() : 'family'
    const filename = `${slug}-insights.png`

    try {
      const url = await toPng(el, {
        backgroundColor: '#09071a',
        pixelRatio: 2,
        filter: node => {
          const c = node.classList
          if (!c) return true
          if (c.contains('insight-coming-soon'))    return false
          if (c.contains('insights-export-btn'))    return false
          if (c.contains('insight-add-more'))       return false
          if (c.contains('insight-connect-prompt')) return false
          return true
        },
      })
      // On mobile, use native share sheet so user can save to camera roll
      const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
      if (isMobile && navigator.share) {
        const res = await fetch(url)
        const blob = await res.blob()
        const file = new File([blob], filename, { type: 'image/png' })
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: chartTitle ? `${chartTitle} · Astrology Insights` : 'Family Astrology Insights',
            text: 'Here are my family astrology insights from AstroDig by Jupiter Digital ✦',
          })
          return
        }
      }
      const link = document.createElement('a')
      link.download = filename
      link.href = url
      link.click()
    } catch (err) {
      if (err?.name === 'AbortError') return
      setExportError('Export failed — please try again.')
    } finally {
      el.style.padding = prevPadding
      if (brandEl) brandEl.style.display = ''
      setExporting(false)
    }
  }, [exporting, savedChartId]) // eslint-disable-line react-hooks/exhaustive-deps

  const editingNode = editingNodeId ? nodes.find(n => n.id === editingNodeId) : null

  return (
    <div className="app">
      {/* ── Email capture — shown once after first named save ───────────── */}
      {showEmailCapture && (
        <EmailCapture onDismiss={() => setShowEmailCapture(false)} />
      )}

      {/* ── New Tree confirm (when tree is already saved) ────────────────── */}
      {showNewTreeConfirm && (
        <div className="save-dialog-backdrop" onClick={() => setShowNewTreeConfirm(false)}>
          <div className="save-dialog" onClick={e => e.stopPropagation()}>
            <p className="save-dialog-title">Start a new chart?</p>
            <p className="save-dialog-sub">Your current chart is saved and can be reloaded from Saved Charts.</p>
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
            className={`save-dialog${pendingNewTree ? ' save-dialog--warning' : ''}`}
            onSubmit={handleSaveChart}
            onClick={e => e.stopPropagation()}
          >
            <p className="save-dialog-title">
              {pendingNewTree ? '⚠ Save before starting a new chart?' : '💾 Name this chart'}
            </p>
            {!pendingNewTree && (
              <p className="save-dialog-sub">Saved charts appear in the Saved tab and sync to your devices.</p>
            )}
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
                  className="save-dialog-discard save-dialog-discard--prominent"
                  onClick={() => { setShowSaveDialog(false); setPendingNewTree(false); handleNewChart() }}
                >
                  Discard & Start New
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
              <button type="button" className="footer-about-link" onClick={() => goTab('about')}>About ↗</button>
            </span>
            {lastSavedAt && (
              <span className="footer-saved-inline">
                <SyncIndicator status={syncStatus === 'idle' ? 'synced' : syncStatus} />
                {formatRelativeTime(lastSavedAt)}
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
          <span className="bottom-tab-icon"><JupiterIcon size={22} /></span>
          <span className="bottom-tab-label">About</span>
        </button>
      </nav>

      {/* ── Canvas ──────────────────────────────────────────────────────── */}
      <main className="canvas">
        {nodes.length === 0 && (
          <div className="welcome-screen">
            <div className="welcome-content">
              <div className="welcome-jd-badge">Jupiter Digital</div>
              <div className="welcome-logo"><JupiterIcon size={72} /></div>
              <h2 className="welcome-title">AstroDig</h2>
              <p className="welcome-tagline">
                Discover the celestial patterns<br />woven through your family
              </p>
              <button type="button" className="welcome-cta"
                onClick={() => {
                  goTab('add')
                  setTimeout(() => document.querySelector('.add-form input[type="text"]')?.focus(), 50)
                }}>
                Begin Your Tree →
              </button>
              <button type="button" className="welcome-cta-mobile"
                onClick={() => goTab('add')}>
                ★ Add Family Members
              </button>
              <button type="button" className="welcome-demo" onClick={handleLoadDemo}>
                or try a demo family
              </button>
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
          </div>
        )}

        {/* ── Shared action buttons (visible on both views) ──────────── */}
        {nodes.length > 0 && (
          <div className="canvas-panel-btns">
            <SyncIndicator status={syncStatus} />
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
              onClick={treeView === 'zodiac' ? handleZodiacExport : treeView === 'constellation' ? handleConstellationExport : handleExport}
              disabled={exporting}
            >
              {exporting ? '…' : (<>
                <span className="export-label-desktop">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{display:'inline',verticalAlign:'middle',marginRight:'4px'}}><path d="M6 1v7M3 6l3 3 3-3M1 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {treeView === 'zodiac' ? 'Download Zodiac' : treeView === 'constellation' ? 'Download Constellation' : 'Download Tree'}
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

        {treeView === 'zodiac' && nodes.length > 0 ? (
          <ZodiacWheel
            nodes={nodes}
            onSelectNode={(id) => setEditingNodeId(id)}
          />
        ) : treeView === 'constellation' && nodes.length > 0 ? (
          <ConstellationView
            nodes={nodes}
            edges={edges}
            onSelectNode={(id) => setEditingNodeId(id)}
            layoutTick={constellationTick}
          />
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
