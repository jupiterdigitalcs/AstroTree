'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { uploadChart, deleteChartCloud as _deleteCloud, fetchCharts, isCloudEnabled, upsertDevice, fetchEntitlements, restoreChartsByEmail } from '../utils/cloudStorage.js'
import { saveChart, loadCharts } from '../utils/storage.js'
import { setCachedEntitlements } from '../utils/entitlements.js'

// syncStatus: 'idle' | 'syncing' | 'synced' | 'error'
export function useCloudSync({ onMergeCharts, authUser }) {
  const [syncStatus, setSyncStatus] = useState('idle')
  const [entitlements, setEntitlements] = useState({ tier: 'free', config: {} })

  // Merge cloud charts into local storage
  const mergeCloudCharts = useCallback(async () => {
    const cloudCharts = await fetchCharts()
    if (!cloudCharts.length) return
    const local = loadCharts()
    const localIds = new Set(local.map(c => c.id))
    let merged = false
    for (const cc of cloudCharts) {
      if (!localIds.has(cc.id)) {
        saveChart(cc)
        merged = true
      } else {
        const lc = local.find(c => c.id === cc.id)
        if (lc && new Date(cc.savedAt) > new Date(lc.savedAt)) {
          saveChart(cc)
          merged = true
        }
      }
    }
    if (merged && onMergeCharts) onMergeCharts()
  }, [onMergeCharts])

  // On mount: register device, fetch entitlements + charts
  useEffect(() => {
    if (!isCloudEnabled()) return
    upsertDevice()
    fetchEntitlements({ isSignedIn: !!authUser }).then(ent => {
      setEntitlements(ent)
      setCachedEntitlements(ent)
      if (ent.email && !localStorage.getItem('astrotree_user_email')) {
        localStorage.setItem('astrotree_user_email', ent.email)
        localStorage.setItem('astrotree_email_asked', '1')
      }
    })
    mergeCloudCharts()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch entitlements when auth state settles (covers sign-out with stale device tier)
  const authResolved = useRef(false)
  useEffect(() => {
    if (!isCloudEnabled()) return
    // Skip the initial render — mount effect already handles it
    if (!authResolved.current) { authResolved.current = true; return }
    fetchEntitlements({ isSignedIn: !!authUser }).then(ent => {
      setEntitlements(ent)
      setCachedEntitlements(ent)
    })
  }, [authUser]) // eslint-disable-line react-hooks/exhaustive-deps

  const syncChart = useCallback(async (chart) => {
    if (!isCloudEnabled()) return
    setSyncStatus('syncing')
    const result = await uploadChart(chart)
    if (result.ok) {
      setSyncStatus('synced')
      setTimeout(() => setSyncStatus('idle'), 3000)
    } else if (result.error === 'chart_limit_reached') {
      setSyncStatus('idle')
      return result
    } else if (result.error === 'conflict') {
      setSyncStatus('idle')
      return { ...result, conflict: true }
    } else {
      setSyncStatus('error')
    }
    return result
  }, [])

  const deleteFromCloud = useCallback(async (id) => {
    if (!isCloudEnabled()) return
    await _deleteCloud(id)
  }, [])

  const refreshEntitlements = useCallback(async () => {
    if (!isCloudEnabled()) return
    const ent = await fetchEntitlements({ isSignedIn: !!authUser })
    setEntitlements(ent)
    setCachedEntitlements(ent)
  }, [authUser])

  // Called after auth sign-in: clear local data, then load only this user's charts
  const refreshAfterAuth = useCallback(async () => {
    if (!isCloudEnabled()) return
    // Clear local charts + draft so a different user doesn't see the previous user's data
    try {
      localStorage.removeItem('astrotree_charts')
      localStorage.removeItem('astrotree_draft')
    } catch {}
    try {
      const ent = await fetchEntitlements({ isSignedIn: true })
      setEntitlements(ent)
      setCachedEntitlements(ent)
    } catch (err) {
      console.error('[cloud] fetchEntitlements failed after auth:', err)
    }
    try {
      await mergeCloudCharts()
    } catch (err) {
      console.error('[cloud] mergeCloudCharts failed after auth:', err)
    }
    // If no charts found after merge, attempt email-based restore (handles cookie-clear scenario)
    try {
      const local = loadCharts()
      if (local.length === 0) {
        const email = localStorage.getItem('astrotree_user_email')
        if (email) {
          const result = await restoreChartsByEmail(email)
          if (result?.ok && result.count > 0) await mergeCloudCharts()
        }
      }
    } catch (err) {
      console.error('[cloud] chart restore by email failed:', err)
    }
  }, [mergeCloudCharts])

  const resetEntitlements = useCallback(() => {
    const free = { tier: 'free', config: {} }
    setEntitlements(free)
    setCachedEntitlements(free)
  }, [])

  return { syncStatus, syncChart, deleteFromCloud, entitlements, refreshEntitlements, refreshAfterAuth, resetEntitlements }
}
