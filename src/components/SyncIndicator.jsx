// Cloud icon states: idle (hidden) | syncing (pulsing) | synced (fades) | error (X)
export function SyncIndicator({ status }) {
  if (status === 'idle') return null

  return (
    <div className={`sync-indicator sync-indicator--${status}`} title={
      status === 'syncing' ? 'Syncing to cloud…'
      : status === 'synced' ? 'Saved to cloud'
      : 'Could not sync — saved locally'
    }>
      {status === 'syncing' && (
        <svg className="sync-icon sync-icon--spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
        </svg>
      )}
      {status === 'synced' && (
        <svg className="sync-icon sync-icon--fade" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
          <polyline points="9 12 11 14 15 10"/>
        </svg>
      )}
      {status === 'error' && (
        <svg className="sync-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
          <line x1="9" y1="11" x2="15" y2="17"/>
          <line x1="15" y1="11" x2="9" y2="17"/>
        </svg>
      )}
    </div>
  )
}
