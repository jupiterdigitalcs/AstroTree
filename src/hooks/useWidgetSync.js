import { useEffect, useRef } from 'react'
import { syncWidgetForecast } from '../utils/widgetSync.js'

/**
 * Keeps the iOS home screen widget's 7-day forecast in step with the
 * active chart. No-op on the website (widgetSync guards on isNativeApp).
 *
 * Syncs once shortly after launch and again whenever the dated-member set
 * changes. Debounced so bulk edits (chart load, demo data) fire one sync.
 */
export function useWidgetSync({ nodes, chartName }) {
  const chartNameRef = useRef(chartName)
  chartNameRef.current = chartName

  const memberKey = (nodes ?? [])
    .filter(n => n.data?.birthdate)
    .map(n => `${n.data.birthdate}|${n.data.birthTime ?? ''}`)
    .sort()
    .join(',')

  useEffect(() => {
    if (!memberKey) return
    const nodesSnapshot = nodes
    const timer = setTimeout(() => {
      syncWidgetForecast(nodesSnapshot, chartNameRef.current)
    }, 3000)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberKey])
}
