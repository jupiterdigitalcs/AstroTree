'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { uploadChart, deleteChartCloud as _deleteCloud, fetchCharts, isCloudEnabled, upsertDevice, fetchEntitlements, restoreChartsByEmail } from '../utils/cloudStorage.js'
import { saveChart, loadCharts } from '../utils/storage.js'
import { setCachedEntitlements } from '../utils/entitlements.js'
import { kv } from '../utils/kvStore.js'

const ENT_CACHE_KEY = 'astrotree_entitlements'

function readCachedEntitlements() {
  try {
    const raw = kv.get(ENT_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function writeCachedEntitlements(ent) {
  try { kv.set(ENT_CACHE_KEY, JSON.stringify(ent)) } catch {}
}

// syncStatus: 'idle' | 'syncing' | 'synced' | 'error'
export function useCloudSync({ onMergeCharts, authUser }) {
  const [syncStatus, setSyncStatus] = useState('idle')
  const [entitlements, setEntitlements] = useState(() => readCachedEntitlements() ?? { tier: 'free', config: {} })
  const [cloudLoading, setCloudLoading] = useState(true) // true until first chart fetch completes

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

  // Write to all three caches at once
  const applyEntitlements = useCallback((ent) => {
    setEntitlements(ent)
    setCachedEntitlements(ent)
    writeCachedEntitlements(ent)
  }, [])

  // Seed in-memory cache from localStorage immediately (before first fetch)
  useEffect(() => {
    const cached = readCachedEntitlements()
    if (cached) setCachedEntitlements(cached)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // On mount: register device, fetch entitlements + charts
  useEffect(() => {
    if (!isCloudEnabled()) return
    upsertDevice()
    fetchEntitlements({ isSignedIn: !!authUser }).then(ent => {
      applyEntitlements(ent)
      if (ent.email && !kv.get('astrotree_user_email')) {
        kv.set('astrotree_user_email', ent.email)
        kv.set('astrotree_email_asked', '1')
      }
    })
    mergeCloudCharts().finally(() => setCloudLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch entitlements when auth state settles (covers sign-out with stale device tier)
  const authResolved = useRef(false)
  useEffect(() => {
    if (!isCloudEnabled()) return
    // Skip the initial render — mount effect already handles it
    if (!authResolved.current) { authResolved.current = true; return }
    fetchEntitlements({ isSignedIn: !!authUser }).then(ent => {
      applyEntitlements(ent)
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
    applyEntitlements(ent)
  }, [authUser, applyEntitlements])

  // Called after auth sign-in: clear local data, then load only this user's charts
  const refreshAfterAuth = useCallback(async () => {
    if (!isCloudEnabled()) return
    setCloudLoading(true)

    // Before clearing, upload any local-only charts so they reach the cloud under
    // this auth user. Many charts live only in localStorage (failed syncs, pre-cloud
    // sessions). Sort newest first so the most recently-used charts are uploaded
    // first in case the chart limit is hit.
    try {
      const localBefore = loadCharts()
      if (localBefore.length > 0) {
        const sorted = [...localBefore].sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
        for (const chart of sorted) {
          const result = await uploadChart(chart)
          if (result?.error === 'chart_limit_reached') break
        }
      }
    } catch (err) {
      console.error('[cloud] pre-auth chart upload failed:', err)
    }

    // Clear local charts + draft so a different user doesn't see the previous user's data
    try {
      kv.remove('astrotree_charts')
      kv.remove('astrotree_draft')
    } catch {}
    try {
      const ent = await fetchEntitlements({ isSignedIn: true })
      applyEntitlements(ent)
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
        const email = kv.get('astrotree_user_email')
        if (email) {
          const result = await restoreChartsByEmail(email)
          if (result?.ok && result.count > 0) await mergeCloudCharts()
        }
      }
    } catch (err) {
      console.error('[cloud] chart restore by email failed:', err)
    }
    setCloudLoading(false)
  }, [mergeCloudCharts])

  const resetEntitlements = useCallback(() => {
    const free = { tier: 'free', config: {} }
    applyEntitlements(free)
  }, [applyEntitlements])

  return { syncStatus, syncChart, deleteFromCloud, entitlements, refreshEntitlements, refreshAfterAuth, resetEntitlements, cloudLoading }
}
