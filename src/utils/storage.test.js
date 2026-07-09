import { describe, it, expect, beforeEach } from 'vitest'
import { saveDraft, loadDraft } from './storage.js'

// Vitest runs in a plain 'node' environment (see vite.config.js) — no DOM,
// so no global localStorage. kv.js falls back to a silent no-op when
// localStorage throws, which would make these tests pass vacuously. Stub a
// minimal in-memory localStorage so saveDraft/loadDraft exercise real
// read/write round trips.
beforeEach(() => {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  }
})

describe('draft save/restore', () => {
  it('persists the sample-chart flag so a reload can restore the sample banner', () => {
    saveDraft([{ id: 'n1' }], [], 2, null, true)
    const draft = loadDraft()
    expect(draft.isSample).toBe(true)
    expect(draft.savedChartId).toBe(null)
  })

  it('defaults isSample to false for a normal chart draft (unaffected by the fix)', () => {
    saveDraft([{ id: 'n1' }], [], 2, 'chart-123')
    const draft = loadDraft()
    expect(draft.isSample).toBe(false)
    expect(draft.savedChartId).toBe('chart-123')
  })
})
