import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchAllCharts } from './utils/adminStorage.js'

export default function AdminTreeList({ onSelectTree }) {
  const [charts,   setCharts]   = useState([])
  const [search,   setSearch]   = useState('')
  const [email,    setEmail]    = useState('')
  const [page,     setPage]     = useState(0)
  const [loading,  setLoading]  = useState(false)
  const [hasMore,  setHasMore]  = useState(true)
  const debounceRef = useRef(null)

  const load = useCallback(async (s, e, p, append = false) => {
    setLoading(true)
    const results = await fetchAllCharts({ search: s, email: e, page: p })
    setCharts(prev => append ? [...prev, ...results] : results)
    setHasMore(results.length === 50)
    setLoading(false)
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(0)
      load(search, email, 0)
    }, 400)
  }, [search, email, load])

  function handleLoadMore() {
    const next = page + 1
    setPage(next)
    load(search, email, next, true)
  }

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
      </div>

      {charts.length === 0 && !loading && (
        <p className="admin-empty">No trees found.</p>
      )}

      <div className="admin-table-wrap">
        {charts.length > 0 && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Members</th>
                <th>Email</th>
                <th>Referrer</th>
                <th>Saved</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {charts.map(c => (
                <tr key={c.id} className="admin-table-row">
                  <td className="admin-td-title">
                    {c.title || <em>Untitled</em>}
                    {c.isSample && <span className="admin-badge admin-badge--sample">sample</span>}
                    {c.isPublic && <span className="admin-badge admin-badge--public">public</span>}
                  </td>
                  <td>{c.memberCount}</td>
                  <td className="admin-td-email">{c.email || <span className="admin-dim">—</span>}</td>
                  <td className="admin-dim">{c.referrer || '—'}</td>
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
        )}
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
