// Feeds "The Group Sky" iOS home screen widget with a 7-day group forecast.
//
// Only does anything inside the native Capacitor shell: fetches a compact
// forecast from /api/current, turns each day into a mood word + headline
// (reusing The Current's copy so widget and app always agree), and hands the
// JSON to the native WidgetBridge plugin, which stores it in the shared App
// Group container and reloads the widget timeline.
//
// The website build never imports @capacitor/core — the plugin is reached
// through the window.Capacitor global the native runtime injects (same
// pattern as platform.js).

import { isNativeApp } from './platform.js'
import { apiUrl } from './apiBase.js'
import { getGroupHeadline, getMoodWord } from '../components/current/currentData.js'

const FORECAST_DAYS = 7

function widgetBridge() {
  return window.Capacitor?.Plugins?.WidgetBridge ?? null
}

/**
 * Compute and push the widget forecast. Fire-and-forget: failures only
 * mean the widget shows yesterday's forecast a little longer.
 */
export async function syncWidgetForecast(nodes, chartName) {
  if (!isNativeApp()) return
  const bridge = widgetBridge()
  if (!bridge) return

  const members = (nodes ?? [])
    .filter(n => n.data?.birthdate)
    .map(n => ({
      id:            n.id,
      name:          n.data.name ?? 'Unknown',
      birthdate:     n.data.birthdate,
      birthTime:     n.data.birthTime ?? null,
      birthTimezone: n.data.birthTimezone ?? null,
    }))
  if (members.length === 0) return

  try {
    const res = await fetch(apiUrl('/api/current'), {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ members, days: FORECAST_DAYS }),
    })
    if (!res.ok) return
    const data = await res.json()

    const entries = (data.forecast ?? []).map(f => {
      const headline = f.topNatalPlanet ? getGroupHeadline(f.topNatalPlanet, f.mood) : null
      const easePct = f.mood.total > 0
        ? Math.round((f.mood.expansion / f.mood.total) * 100)
        : 50
      return {
        date:     f.date,
        moodWord: getMoodWord(f.mood),
        easePct,
        headline: headline?.title ?? null,
        detail:   headline?.desc ?? null,
      }
    })
    if (entries.length === 0) return

    await bridge.setForecast({
      forecast: JSON.stringify({
        chartName: chartName || 'Your circle',
        updatedAt: new Date().toISOString(),
        entries,
      }),
    })
  } catch (err) {
    console.warn('[widgetSync] forecast sync failed:', err)
  }
}
