'use client'

import { useState } from 'react'
import { kv } from '../utils/kvStore.js'

/**
 * Manages localStorage-persisted onboarding flags.
 * Extracted from App.jsx to reduce state clutter.
 */
export function useOnboardingState() {
  const [hasUsedApp, setHasUsedApp] = useState(() => {
    try { return kv.get('astrotree_used') === '1' } catch { return false }
  })

  const [insightsSeen, setInsightsSeen] = useState(() => {
    try { return kv.get('astrotree_insights_seen') === '1' } catch { return false }
  })

  const [returnVisit, setReturnVisit] = useState(() => {
    try {
      const last = kv.get('astrotree_last_visit')
      const now  = Date.now()
      kv.set('astrotree_last_visit', String(now))
      if (!last) return false
      return (now - parseInt(last, 10)) > 3 * 24 * 60 * 60 * 1000
    } catch { return false }
  })

  function markUsed() {
    setHasUsedApp(prev => {
      if (prev) return prev
      try { kv.set('astrotree_used', '1') } catch {}
      return true
    })
  }

  return { hasUsedApp, insightsSeen, setInsightsSeen, returnVisit, setReturnVisit, markUsed }
}
