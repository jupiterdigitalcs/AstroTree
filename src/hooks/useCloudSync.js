'use client'

import { useState, useEffect, useCallback } from 'react'
import { uploadChart, deleteChartCloud as _deleteCloud, fetchCharts, isCloudEnabled, upsertDevice, fetchEntitlements } from '../utils/cloudStorage.js'
import { saveChart, loadCharts } from '../utils/storage.js'
import { setCachedEntitlements } from '../utils/entitlements.js'

// syncStatus: 'idle' | 'syncing' | 'synced' | 'error'
export function useCloudSync({ onMergeCharts }) {
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
    fetchEntitlements().then(ent => {
      setEntitlements(ent)
      setCachedEntitlements(ent)
      if (ent.email && !localStorage.getItem('astrotree_user_email')) {
        localStorage.setItem('astrotree_user_email', ent.email)
        localStorage.setItem('astrotree_email_asked', '1')
      }
    })
    mergeCloudCharts()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    const ent = await fetchEntitlements()
    setEntitlements(ent)
    setCachedEntitlements(ent)
  }, [])

  // Called after auth sign-in: re-fetch everything with the new session cookies
  const refreshAfterAuth = useCallback(async () => {
    if (!isCloudEnabled()) return
    const ent = await fetchEntitlements()
    setEntitlements(ent)
    setCachedEntitlements(ent)
    await mergeCloudCharts()
  }, [mergeCloudCharts])

  return { syncStatus, syncChart, deleteFromCloud, entitlements, refreshEntitlements, refreshAfterAuth }
}
