'use client'

import { useEffect, useRef } from 'react'

/**
 * Syncs app navigation state with browser history
 * so the back button works within AstroDig.
 *
 * Implementation: when the push-effect runs, it compares the new state shape
 * to the last state we applied from a popstate. If they match, this render is
 * the result of the popstate (not a user nav) and we skip pushing — otherwise
 * we'd loop. This replaces an older skipCount counter that was fragile when
 * setState calls didn't actually change state.
 */
function shapesEqual(a, b) {
  if (!a || !b) return false
  return a.tab === b.tab
    && a.view === b.view
    && a.editing === b.editing
    && a.dig === b.dig
    && a.iTab === b.iTab
}

export function useHistoryNav({ activeTab, treeView, editingNodeId, setActiveTab, setTreeView, setEditingNodeId, showDig, setShowDig, insightsTab, setInsightsTab }) {
  const lastPoppedRef = useRef(null)
  const showDigRef = useRef(showDig)
  showDigRef.current = showDig

  // Push current state to history when navigation changes
  useEffect(() => {
    const state = { tab: activeTab, view: treeView, editing: editingNodeId, dig: !!showDig, iTab: insightsTab || 'insights' }
    // If this state is the one we just applied from a popstate, skip pushing
    // (and clear the marker so the next user-driven nav still gets pushed).
    if (shapesEqual(lastPoppedRef.current, state)) {
      lastPoppedRef.current = null
      return
    }
    const current = window.history.state?.appNav
    if (shapesEqual(current, state)) return
    window.history.pushState({ appNav: state }, '')
  }, [activeTab, treeView, editingNodeId, showDig, insightsTab])

  // Listen for back/forward navigation
  useEffect(() => {
    function handlePopState(e) {
      const nav = e.state?.appNav
      if (!nav) return

      // If DIG overlay is open but history says it shouldn't be, just close it.
      // The push-effect will run for showDig=false; we mark the target shape so
      // it knows not to re-push.
      if (showDigRef.current && !nav.dig) {
        lastPoppedRef.current = { tab: activeTab, view: treeView, editing: editingNodeId, dig: false, iTab: 'insights' }
        setShowDig(false)
        setInsightsTab?.('insights')
        return
      }

      lastPoppedRef.current = nav
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
