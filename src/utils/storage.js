const KEY       = 'astrotree_charts'
const DRAFT_KEY = 'astrotree_draft'

// Custom event so any listener (e.g. ChartsPanel) can refresh after a local
// chart write. Without this, ChartsPanel would only re-read localStorage on
// mount or when a refreshTick prop changes — but in cosmic mode all panels
// are pre-mounted in BottomSheets, so an auto-saved chart never appears.
export const CHARTS_CHANGED_EVENT = 'astrotree:charts-changed'
function notifyChartsChanged() {
  try { window.dispatchEvent(new Event(CHARTS_CHANGED_EVENT)) } catch {}
}

export function loadCharts() {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}

export function saveChart(chart) {
  const charts = loadCharts()
  const idx = charts.findIndex(c => c.id === chart.id)
  if (idx >= 0) charts[idx] = chart
  else charts.push(chart)
  localStorage.setItem(KEY, JSON.stringify(charts))
  notifyChartsChanged()
}

export function deleteChart(id) {
  localStorage.setItem(KEY, JSON.stringify(loadCharts().filter(c => c.id !== id)))
  notifyChartsChanged()
}

export function renameChart(id, newTitle) {
  const charts = loadCharts()
  const idx = charts.findIndex(c => c.id === id)
  if (idx < 0) return
  charts[idx] = { ...charts[idx], title: newTitle.trim(), savedAt: new Date().toISOString() }
  localStorage.setItem(KEY, JSON.stringify(charts))
  notifyChartsChanged()
  return charts[idx]
}

export function saveDraft(nodes, edges, counter, savedChartId = null) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ nodes, edges, counter, savedChartId })) } catch {}
}

export function loadDraft() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null') } catch { return null }
}
