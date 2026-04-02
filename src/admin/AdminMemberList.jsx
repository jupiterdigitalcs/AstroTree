export default function AdminMemberList({ nodes }) {
  if (!nodes?.length) return <p className="admin-empty">No members</p>

  return (
    <div className="admin-member-list">
      {nodes.map(n => (
        <div key={n.id} className="admin-member-row">
          <span className="admin-member-symbol">{n.data?.symbol ?? '✦'}</span>
          <span className="admin-member-name">{n.data?.name || '—'}</span>
          <span className="admin-member-sign">{n.data?.sign || ''}</span>
          <span className="admin-member-birth">{n.data?.birthdate || ''}</span>
        </div>
      ))}
    </div>
  )
}
