'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { addEdge } from '@xyflow/react'
import { getSunSign, getElement } from '../utils/astrology.js'
import { computeAstrology } from '../utils/astrologyAPI.js'
import { applyDagreLayout } from '../utils/layout.js'
import { EDGE_STYLE, makeEdge } from '../utils/treeHelpers.js'

export function useTreeState({
  nodes, edges,
  setNodes, setEdges,
  setFitTick, setEditingNodeId,
  onNodeClickNav,
  collapsedIds,
  forceExpandedIds,
}) {
  // ── Layout on edge / node count changes ──────────────────────────────────
  useEffect(() => {
    if (nodes.length === 0) return
    setNodes(prev => {
      const laid = applyDagreLayout(prev, edges, { collapsedIds, forceExpandedIds })

      // ── Tag nodes with sibling-group symbol ────────────────────────────
      const pcEdges = edges.filter(e => e.data?.relationType === 'parent-child' || !e.data?.relationType)
      const childToParents = {}
      pcEdges.forEach(e => {
        if (!childToParents[e.target]) childToParents[e.target] = []
        childToParents[e.target].push(e.source)
      })
      // Group children by sorted parent key
      const groups = {}
      Object.entries(childToParents).forEach(([childId, parents]) => {
        const key = [...parents].sort().join('|')
        if (!groups[key]) groups[key] = []
        groups[key].push(childId)
      })
      // Also include explicit sibling edges (siblings without parents)
      const sibEdges = edges.filter(e => e.data?.relationType === 'sibling')
      if (sibEdges.length > 0) {
        const sibAdj = {}
        sibEdges.forEach(e => {
          if (!sibAdj[e.source]) sibAdj[e.source] = new Set()
          if (!sibAdj[e.target]) sibAdj[e.target] = new Set()
          sibAdj[e.source].add(e.target)
          sibAdj[e.target].add(e.source)
        })
        const visited = new Set()
        Object.keys(sibAdj).forEach(startId => {
          if (visited.has(startId)) return
          const component = []
          const q = [startId]
          while (q.length > 0) {
            const id = q.pop()
            if (visited.has(id)) continue
            visited.add(id)
            component.push(id)
            sibAdj[id].forEach(nid => { if (!visited.has(nid)) q.push(nid) })
          }
          if (component.length >= 2) {
            let merged = false
            for (const [key, children] of Object.entries(groups)) {
              if (component.some(id => children.includes(id))) {
                component.forEach(id => { if (!children.includes(id)) children.push(id) })
                merged = true
                break
              }
            }
            if (!merged) {
              groups[`sibling-${startId}`] = component
            }
          }
        })
      }
      // Only groups with 2+ siblings get a matching symbol + color.
      // 3 symbols × 3 colors = 9 unique combos before repeating.
      const SIBLING_SYMBOLS = ['❖', '✿', '▪']
      const SIBLING_COLORS  = ['#b8845c', '#5a9e8f', '#a8587a']  // sienna, teal, magenta
      const siblingMap = {}
      let si = 0
      Object.values(groups).forEach(children => {
        if (children.length < 2) return
        const symbol = SIBLING_SYMBOLS[si % SIBLING_SYMBOLS.length]
        const color  = SIBLING_COLORS[(si + Math.floor(si / SIBLING_SYMBOLS.length)) % SIBLING_COLORS.length]
        children.forEach(id => { siblingMap[id] = { symbol, color } })
        si++
      })

      return laid.map(n => ({
        ...n,
        data: {
          ...n.data,
          siblingGroupSymbol: siblingMap[n.id]?.symbol || null,
          siblingGroupColor: siblingMap[n.id]?.color || null,
        }
      }))
    })
    setFitTick(t => t + 1)
  }, [edges, nodes.length, collapsedIds, forceExpandedIds]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Edge display: handle routing, hiding, and LR mode ────────────────────
  // Sibling edges are not drawn on the tree — siblings use group symbols instead
  const edgesForDisplay = useMemo(() => {
    const hiddenIds = new Set(nodes.filter(n => n.hidden).map(n => n.id))
    const layoutDir = nodes.find(n => !n.hidden)?.data?.layoutDirection || 'TB'

    return edges
      .filter(edge => edge.data?.relationType !== 'sibling')
      .filter(edge => !hiddenIds.has(edge.source) && !hiddenIds.has(edge.target))
      .map(edge => {
        const isSpouse = edge.data?.relationType === 'spouse'
        const isHierarchical = !isSpouse

        if (layoutDir === 'LR') {
          // LR mode: parent-child edges use side handles, spouse edges use top/bottom
          if (isHierarchical) {
            const src = nodes.find(n => n.id === edge.source)
            const tgt = nodes.find(n => n.id === edge.target)
            if (!src || !tgt) return edge
            const srcLeftOf = src.position.x <= tgt.position.x
            return {
              ...edge,
              type: 'smoothstep',
              sourceHandle: srcLeftOf ? 'right-src' : 'left-src',
              targetHandle: srcLeftOf ? 'left-tgt'  : 'right-tgt',
            }
          }
          // Spouse in LR — vertically stacked
          const src = nodes.find(n => n.id === edge.source)
          const tgt = nodes.find(n => n.id === edge.target)
          if (!src || !tgt) return edge
          const srcAbove = src.position.y <= tgt.position.y
          return {
            ...edge, type: 'straight',
            sourceHandle: srcAbove ? undefined : 'top-src',
            targetHandle: srcAbove ? undefined : 'bottom-tgt',
          }
        }

        // TB mode: parent-child edges use default top/bottom handles with smoothstep
        if (!isSpouse) return { ...edge, type: 'smoothstep' }
        const src = nodes.find(n => n.id === edge.source)
        const tgt = nodes.find(n => n.id === edge.target)
        if (!src || !tgt) return edge
        const srcLeft = src.position.x <= tgt.position.x
        return {
          ...edge, type: 'straight',
          sourceHandle: srcLeft ? 'right-src' : 'left-src',
          targetHandle: srcLeft ? 'left-tgt'  : 'right-tgt',
        }
      })
  }, [edges, nodes])

  // ── Update / delete ───────────────────────────────────────────────────────
  const handleUpdate = useCallback((id, patch, { keepOpen = false } = {}) => {
    const bdChanged = !!patch.birthdate
    const btChanged = 'birthTime' in patch
    const tzChanged = 'birthTimezone' in patch

    // Synchronous sun sign update (pure lookup, no API call)
    setNodes(prev => prev.map(n => {
      if (n.id !== id) return n
      const updated = { ...n.data, ...patch }
      if (bdChanged && patch.birthdate !== n.data.birthdate) {
        const { sign, symbol }   = getSunSign(patch.birthdate)
        const { element, color } = getElement(sign)
        Object.assign(updated, { sign, symbol, element, elementColor: color })
      }
      return { ...n, data: updated }
    }))
    if (!keepOpen) setEditingNodeId(null)

    // Async: fetch moon/planets/ingress from server when birthdate, time, or timezone changes
    if (bdChanged || btChanged || tzChanged) {
      // Find the current node to get the right birthdate/time/timezone
      const node = nodes.find(n => n.id === id)
      const bd = patch.birthdate || node?.data?.birthdate
      const bt = btChanged ? patch.birthTime : node?.data?.birthTime
      const btz = tzChanged ? patch.birthTimezone : node?.data?.birthTimezone
      if (bd) {
        computeAstrology(bd, bt ?? null, btz ?? null).then(astro => {
          if (!astro) return
          setNodes(prev => prev.map(n => {
            if (n.id !== id) return n
            const enriched = { ...n.data }
            if (astro.moon) Object.assign(enriched, astro.moon)
            if (astro.innerPlanets) enriched.innerPlanets = astro.innerPlanets
            if (astro.ingressWarnings) enriched.ingressWarnings = astro.ingressWarnings
            if (astro.timezoneWarnings) enriched.timezoneWarnings = astro.timezoneWarnings
            if (astro.sunAtTime?.sign) {
              const { element, color } = getElement(astro.sunAtTime.sign)
              Object.assign(enriched, { sign: astro.sunAtTime.sign, symbol: astro.sunAtTime.symbol, element, elementColor: color })
            }
            return { ...n, data: enriched }
          }))
        })
      }
    }
  }, [setNodes, setEditingNodeId, nodes])

  // ── Delete with undo support ──────────────────────────────────────────────
  const [undoToast, setUndoToast] = useState(null)
  const undoRef = useRef(null)

  const handleDelete = useCallback((id) => {
    const deletedNode = nodes.find(n => n.id === id)
    const deletedEdges = edges.filter(e => e.source === id || e.target === id)

    setNodes(prev => prev.filter(n => n.id !== id))
    setEdges(prev => prev.filter(e => e.source !== id && e.target !== id))
    setEditingNodeId(null)

    // Set up 8-second undo window
    if (undoRef.current) clearTimeout(undoRef.current.timer)
    const timer = setTimeout(() => { setUndoToast(null); undoRef.current = null }, 8000)
    undoRef.current = { node: deletedNode, edges: deletedEdges, timer }
    setUndoToast({ name: deletedNode?.data?.name || 'Member', connectionCount: deletedEdges.length })
  }, [nodes, edges, setNodes, setEdges, setEditingNodeId])

  const handleUndo = useCallback(() => {
    if (!undoRef.current) return
    const { node, edges: restoredEdges, timer } = undoRef.current
    clearTimeout(timer)
    if (node) setNodes(prev => [...prev, node])
    if (restoredEdges.length) setEdges(prev => [...prev, ...restoredEdges])
    setUndoToast(null)
    undoRef.current = null
  }, [setNodes, setEdges])

  // ── Edge management ───────────────────────────────────────────────────────
  const handleAddEdge = useCallback((source, target, relationType = 'parent-child') => {
    setEdges(prev => {
      if (source === target) return prev
      const alreadyConnected = prev.some(e =>
        (e.source === source && e.target === target) ||
        (e.source === target && e.target === source)
      )
      if (alreadyConnected) return prev
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
        if (children.has(source)) return prev
      }
      return [...prev, makeEdge(source, target, relationType)]
    })
  }, [setEdges])

  const handleRemoveEdge = useCallback((edgeId) => {
    setEdges(prev => prev.filter(e => e.id !== edgeId))
  }, [setEdges])

  const nodeDragMoved = useRef(false)

  const onNodeDragStart = useCallback(() => {
    nodeDragMoved.current = false
  }, [])

  const onNodeDrag = useCallback(() => {
    nodeDragMoved.current = true
  }, [])

  const onNodeDragStop = useCallback(() => {
    // Reset after a short delay so the click event fires first
    setTimeout(() => { nodeDragMoved.current = false }, 200)
  }, [])

  const onNodeClick = useCallback((_e, node) => {
    if (nodeDragMoved.current) return
    setEditingNodeId(id => id === node.id ? null : node.id)
    if (onNodeClickNav) onNodeClickNav()
  }, [setEditingNodeId, onNodeClickNav])

  const onConnect = useCallback(
    (params) => setEdges(eds => addEdge({ ...params, animated: true, style: EDGE_STYLE, type: 'smoothstep' }, eds)),
    [setEdges],
  )

  return {
    edgesForDisplay,
    handleUpdate, handleDelete, handleUndo, undoToast,
    handleAddEdge, handleRemoveEdge,
    onNodeClick, onNodeDragStart, onNodeDrag, onNodeDragStop, onConnect,
  }
}
