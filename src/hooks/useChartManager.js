'use client'

import { useState, useCallback, useEffect } from 'react'
import { saveDraft, loadDraft, saveChart, loadCharts } from '../utils/storage.js'
import { applyDagreLayout } from '../utils/layout.js'
import { hydrateNodes } from '../utils/treeHelpers.js'
import { hasBeenAsked } from '../components/EmailCapture.jsx'
import { isCloudEnabled } from '../utils/cloudStorage.js'

export function useChartManager({
  nodes, edges, counter,
  setNodes, setEdges, setCounter,
  setActiveTab, setEditingNodeId, setTreeView,
  setFitTick, setViewOnly,
  syncChart,
  viewOnly,
  onChartLimitHit,
}) {
  const [savedChartId,       setSavedChartId]       = useState(null)
  const [showSaveDialog,     setShowSaveDialog]     = useState(false)
  const [saveTitle,          setSaveTitle]          = useState('')
  const [pendingNewTree,     setPendingNewTree]     = useState(false)
  const [showNewTreeConfirm, setShowNewTreeConfirm] = useState(false)
  const [showEmailCapture,   setShowEmailCapture]   = useState(false)
  const [lastSavedAt,        setLastSavedAt]        = useState(null)

  // ── Restore draft on first load ───────────────────────────────────────────
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('view')) return
    const draft = loadDraft()
    if (draft?.nodes?.length > 0) {
      // Set nodes immediately (may have cached astro data), then hydrate async
      setEdges(draft.edges)
      setCounter(draft.counter ?? 1)
      if (draft.savedChartId) setSavedChartId(draft.savedChartId)
      // In cosmic mode, stay on canvas; in classic mode, open family tab
      const ux = (typeof localStorage !== 'undefined' && localStorage.getItem('astrodig_ux')) || 'cosmic'
      if (ux === 'classic') setActiveTab('add')
      hydrateNodes(draft.nodes).then(hydrated => setNodes(hydrated))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Autosave draft on every change (debounced 600ms) ─────────────────────
  useEffect(() => {
    if (viewOnly) return
    const t = setTimeout(() => saveDraft(nodes, edges, counter, savedChartId), 600)
    return () => clearTimeout(t)
  }, [nodes, edges, counter, savedChartId, viewOnly])

  // ── Auto-save to named chart when tree has been saved once ────────────────
  useEffect(() => {
    if (!savedChartId || nodes.length === 0) return
    const t = setTimeout(() => {
      const existing = loadCharts().find(c => c.id === savedChartId)
      if (!existing) return
      const updated = { ...existing, nodes, edges, counter, savedAt: new Date().toISOString() }
      saveChart(updated)
      syncChart(updated)
      setLastSavedAt(new Date())
    }, 800)
    return () => clearTimeout(t)
  }, [nodes, edges, counter, savedChartId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadChart = useCallback(async (chart) => {
    const hydrated = await hydrateNodes(chart.nodes)
    setNodes(applyDagreLayout(hydrated, chart.edges))
    setEdges(chart.edges); setCounter(chart.counter)
    setSavedChartId(chart.isSample ? null : chart.id)
    setEditingNodeId(null); setActiveTab('tree'); setTreeView('tree')
    setFitTick(t => t + 1)
  }, [setNodes, setEdges]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleNewChart = useCallback(() => {
    setNodes([]); setEdges([]); setCounter(1)
    setSavedChartId(null)
    setEditingNodeId(null); setActiveTab('add')
  }, [setNodes, setEdges]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRenameChart = useCallback((updatedChart) => {
    syncChart(updatedChart)
  }, [syncChart])

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
  }, [handleLoadChart, syncChart])

  async function handleSaveChart(e) {
    e.preventDefault()
    if (!saveTitle.trim() || nodes.length === 0) return
    const id = Date.now().toString()
    const chart = { id, title: saveTitle.trim(), nodes, edges, counter, savedAt: new Date().toISOString() }
    saveChart(chart) // save locally always
    const result = await syncChart(chart)
    if (result?.error === 'chart_limit_reached') {
      onChartLimitHit?.()
      // Still save locally but don't proceed with the normal flow
      return
    }
    setSavedChartId(id)
    setLastSavedAt(new Date())
    setViewOnly(false)
    setShowSaveDialog(false)
    setSaveTitle('')
    if (!hasBeenAsked() && isCloudEnabled()) setShowEmailCapture(true)
    if (pendingNewTree) {
      setPendingNewTree(false)
      handleNewChart()
    }
  }

  function handleNewTreeClick() {
    if (nodes.length === 0) { handleNewChart(); return }
    if (!savedChartId) {
      setPendingNewTree(true)
      setSaveTitle('')
      setShowSaveDialog(true)
    } else {
      setShowNewTreeConfirm(true)
    }
  }

  return {
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
  }
}
