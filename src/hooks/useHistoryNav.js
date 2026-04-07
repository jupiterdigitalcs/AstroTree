'use client'

import { useEffect, useCallback, useRef } from 'react'

/**
 * Syncs app navigation state (tab, view, editing) with browser history
 * so the back button works within AstroDig.
 */
export function useHistoryNav({ activeTab, treeView, editingNodeId, setActiveTab, setTreeView, setEditingNodeId }) {
  const isPopping = useRef(false)

  // Build a state key from current navigation
  function stateKey(tab, view, editing) {
    return { tab, view, editing }
  }

  // Push current state to history when navigation changes
  useEffect(() => {
    if (isPopping.current) {
      isPopping.current = false
      return
    }
    const state = stateKey(activeTab, treeView, editingNodeId)
    // Only push if it differs from current history state
    const current = window.history.state?.appNav
    if (current?.tab === state.tab && current?.view === state.view && current?.editing === state.editing) return
    window.history.pushState({ appNav: state }, '')
  }, [activeTab, treeView, editingNodeId])

  // Listen for back/forward navigation
  useEffect(() => {
    function handlePopState(e) {
      const nav = e.state?.appNav
      if (!nav) return
      isPopping.current = true
      setActiveTab(nav.tab)
      setTreeView(nav.view)
      setEditingNodeId(nav.editing)
    }
    window.addEventListener('popstate', handlePopState)
    // Seed initial state so first back press works
    const initial = stateKey(activeTab, treeView, editingNodeId)
    window.history.replaceState({ appNav: initial }, '')
    return () => window.removeEventListener('popstate', handlePopState)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
