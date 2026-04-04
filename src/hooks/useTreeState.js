import { useCallback, useEffect, useMemo } from 'react'
import { addEdge } from '@xyflow/react'
import { getSunSign, getElement, getMoonSign } from '../utils/astrology.js'
import { applyDagreLayout } from '../utils/layout.js'
import { EDGE_STYLE, makeEdge } from '../utils/treeHelpers.js'

export function useTreeState({
  nodes, edges,
  setNodes, setEdges,
  setFitTick, setEditingNodeId,
}) {
  // ── Layout on edge / node count changes ──────────────────────────────────
  useEffect(() => {
    if (nodes.length === 0) return
    setNodes(prev => applyDagreLayout(prev, edges))
    setFitTick(t => t + 1)
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
        sourceHandle: srcLeft ? 'right-src' : 'left-src',
        targetHandle: srcLeft ? 'left-tgt'  : 'right-tgt',
      }
    }),
    [edges, nodes]
  )

  // ── Update / delete ───────────────────────────────────────────────────────
  const handleUpdate = useCallback((id, patch) => {
    setNodes(prev => prev.map(n => {
      if (n.id !== id) return n
      const updated = { ...n.data, ...patch }
      if (patch.birthdate && patch.birthdate !== n.data.birthdate) {
        const { sign, symbol }   = getSunSign(patch.birthdate)
        const { element, color } = getElement(sign)
        const { moonSign, moonSymbol } = getMoonSign(patch.birthdate)
        Object.assign(updated, { sign, symbol, element, elementColor: color, moonSign, moonSymbol })
      }
      return { ...n, data: updated }
    }))
    setEditingNodeId(null)
  }, [setNodes, setEditingNodeId])

  const handleDelete = useCallback((id) => {
    setNodes(prev => prev.filter(n => n.id !== id))
    setEdges(prev => prev.filter(e => e.source !== id && e.target !== id))
    setEditingNodeId(null)
  }, [setNodes, setEdges, setEditingNodeId])

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

  const onNodeClick = useCallback((_e, node) => {
    setEditingNodeId(id => id === node.id ? null : node.id)
  }, [setEditingNodeId])

  const onConnect = useCallback(
    (params) => setEdges(eds => addEdge({ ...params, animated: true, style: EDGE_STYLE, type: 'smoothstep' }, eds)),
    [setEdges],
  )

  return {
    edgesForDisplay,
    handleUpdate, handleDelete,
    handleAddEdge, handleRemoveEdge,
    onNodeClick, onConnect,
  }
}
