'use client'

import { useEffect, useRef } from 'react'

/**
 * Syncs app navigation state with browser history
 * so the back button works within AstroDig.
 */
export function useHistoryNav({ activeTab, treeView, editingNodeId, setActiveTab, setTreeView, setEditingNodeId, showDig, setShowDig, insightsTab, setInsightsTab }) {
  const skipCount = useRef(0)
  const showDigRef = useRef(showDig)
  showDigRef.current = showDig

  // Push current state to history when navigation changes
  useEffect(() => {
    if (skipCount.current > 0) {
      skipCount.current--
      return
    }
    const state = { tab: activeTab, view: treeView, editing: editingNodeId, dig: !!showDig, iTab: insightsTab || 'insights' }
    const current = window.history.state?.appNav
    if (current?.tab === state.tab && current?.view === state.view && current?.editing === state.editing && current?.dig === state.dig && current?.iTab === state.iTab) return
    window.history.pushState({ appNav: state }, '')
  }, [activeTab, treeView, editingNodeId, showDig, insightsTab])

  // Listen for back/forward navigation
  useEffect(() => {
    function handlePopState(e) {
      const nav = e.state?.appNav
      if (!nav) return

      // Count how many state setters we call to skip that many push-effect runs
      skipCount.current = 5

      // If DIG overlay is open but history says it shouldn't be, just close it
      if (showDigRef.current && !nav.dig) {
        setShowDig(false)
        setInsightsTab?.('insights')
        return
      }

      setActiveTab(nav.tab)
      setTreeView(nav.view)
      setEditingNodeId(nav.editing)
      if (setShowDig) setShowDig(!!nav.dig)
      if (setInsightsTab) setInsightsTab(nav.iTab || 'insights')
    }
    window.addEventListener('popstate', handlePopState)
    const initial = { tab: activeTab, view: treeView, editing: editingNodeId, dig: !!showDig, iTab: insightsTab || 'insights' }
    window.history.replaceState({ appNav: initial }, '')
    return () => window.removeEventListener('popstate', handlePopState)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
