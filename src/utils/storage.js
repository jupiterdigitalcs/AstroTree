const KEY       = 'astrotree_charts'
const DRAFT_KEY = 'astrotree_draft'

export function loadCharts() {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}

export function saveChart(chart) {
  const charts = loadCharts()
  const idx = charts.findIndex(c => c.id === chart.id)
  if (idx >= 0) charts[idx] = chart
  else charts.push(chart)
  localStorage.setItem(KEY, JSON.stringify(charts))
}

export function deleteChart(id) {
  localStorage.setItem(KEY, JSON.stringify(loadCharts().filter(c => c.id !== id)))
}

export function saveDraft(nodes, edges, counter) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ nodes, edges, counter })) } catch {}
}

export function loadDraft() {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null') } catch { return null }
}
