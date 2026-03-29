const KEY = 'astrotree_charts'

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
