'use client'

import { useState } from 'react'

/**
 * Manages localStorage-persisted onboarding flags.
 * Extracted from App.jsx to reduce state clutter.
 */
export function useOnboardingState() {
  const [hasUsedApp, setHasUsedApp] = useState(() => {
    try { return localStorage.getItem('astrotree_used') === '1' } catch { return false }
  })

  const [insightsSeen, setInsightsSeen] = useState(() => {
    try { return localStorage.getItem('astrotree_insights_seen') === '1' } catch { return false }
  })

  const [returnVisit, setReturnVisit] = useState(() => {
    try {
      const last = localStorage.getItem('astrotree_last_visit')
      const now  = Date.now()
      localStorage.setItem('astrotree_last_visit', String(now))
      if (!last) return false
      return (now - parseInt(last, 10)) > 3 * 24 * 60 * 60 * 1000
    } catch { return false }
  })

  function markUsed() {
    setHasUsedApp(prev => {
      if (prev) return prev
      try { localStorage.setItem('astrotree_used', '1') } catch {}
      return true
    })
  }

  return { hasUsedApp, insightsSeen, setInsightsSeen, returnVisit, setReturnVisit, markUsed }
}
