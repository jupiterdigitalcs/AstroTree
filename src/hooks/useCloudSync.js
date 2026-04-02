import { useState, useEffect, useCallback } from 'react'
import { uploadChart, deleteChartCloud as _deleteCloud, fetchCharts, isCloudEnabled, upsertDevice } from '../utils/cloudStorage.js'
import { saveChart, loadCharts } from '../utils/storage.js'

// syncStatus: 'idle' | 'syncing' | 'synced' | 'error'
export function useCloudSync({ onMergeCharts }) {
  const [syncStatus, setSyncStatus] = useState('idle')

  // On mount: register/update device row, then merge cloud charts
  useEffect(() => {
    if (!isCloudEnabled()) return
    upsertDevice()
    fetchCharts().then(cloudCharts => {
      if (!cloudCharts.length) return
      const local = loadCharts()
      const localIds = new Set(local.map(c => c.id))
      let merged = false
      for (const cc of cloudCharts) {
        if (!localIds.has(cc.id)) {
          saveChart(cc)
          merged = true
        } else {
          // If cloud version is newer, update local
          const lc = local.find(c => c.id === cc.id)
          if (lc && new Date(cc.savedAt) > new Date(lc.savedAt)) {
            saveChart(cc)
            merged = true
          }
        }
      }
      if (merged && onMergeCharts) onMergeCharts()
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const syncChart = useCallback(async (chart) => {
    if (!isCloudEnabled()) return
    setSyncStatus('syncing')
    const result = await uploadChart(chart)
    if (result.ok) {
      setSyncStatus('synced')
      setTimeout(() => setSyncStatus('idle'), 3000)
    } else {
      setSyncStatus('error')
    }
  }, [])

  const deleteFromCloud = useCallback(async (id) => {
    if (!isCloudEnabled()) return
    await _deleteCloud(id)
  }, [])

  return { syncStatus, syncChart, deleteFromCloud }
}
