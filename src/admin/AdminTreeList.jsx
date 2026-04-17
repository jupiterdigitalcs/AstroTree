import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchAllCharts } from './utils/adminStorage.js'

export default function AdminTreeList({ onSelectTree, excludeEmail }) {
  const [charts,   setCharts]   = useState([])
  const [search,   setSearch]   = useState('')
  const [email,    setEmail]    = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')
  const [page,     setPage]     = useState(0)
  const [loading,  setLoading]  = useState(false)
  const [hasMore,  setHasMore]  = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const debounceRef = useRef(null)

  const load = useCallback(async (s, e, df, dt, p, append = false) => {
    setLoading(true)
    setFetchError(null)
    const results = await fetchAllCharts({ search: s, email: e, dateFrom: df, dateTo: dt, page: p })
    if (results?.error) {
      setFetchError(results.error)
      setLoading(false)
      return
    }
    setCharts(prev => append ? [...prev, ...results] : results)
    setHasMore(results.length === 50)
    setLoading(false)
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(0)
      load(search, email, dateFrom, dateTo, 0)
    }, 400)
  }, [search, email, dateFrom, dateTo, load])

  function handleLoadMore() {
    const next = page + 1
    setPage(next)
    load(search, email, dateFrom, dateTo, next, true)
  }

  function clearFilters() {
    setSearch(''); setEmail(''); setDateFrom(''); setDateTo('')
  }

  const hasFilters = search || email || dateFrom || dateTo

  return (
    <div className="admin-tree-list">
      <div className="admin-filters">
        <input
          className="admin-input"
          placeholder="Search by title…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <input
          className="admin-input"
          placeholder="Filter by email…"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="date"
          className="admin-input admin-input--date"
          title="Created from"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
        />
        <input
          type="date"
          className="admin-input admin-input--date"
          title="Created to"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
        />
        {hasFilters && (
          <button type="button" className="admin-btn admin-btn--ghost" onClick={clearFilters}>
            Clear
          </button>
        )}
      </div>

      {fetchError && (
        <p className="admin-empty" style={{ color: '#e87070' }}>
          {fetchError === 'auth'
            ? '⚠ Session expired — log out and log back in.'
            : `⚠ Failed to load charts (${fetchError}) — check console for details.`}
        </p>
      )}
      {!fetchError && charts.length === 0 && !loading && (
        <p className="admin-empty">No trees found.</p>
      )}

      <div className="admin-table-wrap">
        {charts.length > 0 && (() => {
          const filtered = excludeEmail ? charts.filter(c => c.email !== excludeEmail) : charts
          return (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Members</th>
                <th>Email</th>
                <th>Location</th>
                <th>Created</th>
                <th>Last Saved</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="admin-table-row">
                  <td className="admin-td-title">
                    {c.title || <em>Untitled</em>}
                    {c.isSample && <span className="admin-badge admin-badge--sample">sample</span>}
                    {c.isPublic && <span className="admin-badge admin-badge--public">public</span>}
                  </td>
                  <td>{c.memberCount}</td>
                  <td className="admin-td-email">{c.email || <span className="admin-dim">—</span>}</td>
                  <td className="admin-dim" style={{ whiteSpace: 'nowrap' }}>
                    {[c.city, c.country].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="admin-dim" style={{ whiteSpace: 'nowrap' }}>
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="admin-dim" style={{ whiteSpace: 'nowrap' }}>
                    {c.savedAt ? new Date(c.savedAt).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="admin-btn admin-btn--sm"
                      onClick={() => onSelectTree(c)}
                    >
                      Preview
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )
        })()}
      </div>

      {loading && <p className="admin-loading">Loading…</p>}

      {hasMore && !loading && charts.length > 0 && (
        <button type="button" className="admin-btn admin-btn--load-more" onClick={handleLoadMore}>
          Load more
        </button>
      )}
    </div>
  )
}
