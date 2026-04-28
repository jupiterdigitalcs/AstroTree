import { useState } from 'react'
import { generateShareToken, logEvent } from '../utils/cloudStorage.js'

export function ShareButton({ savedChartId, syncStatus }) {
  const [copying, setCopying] = useState(false)
  const [copied, setCopied]   = useState(false)
  const [shareError, setShareError] = useState(false)

  if (!savedChartId || syncStatus === 'error') return null

  async function handleShare() {
    if (copying) return
    setCopying(true)
    setShareError(false)
    const token = await generateShareToken(savedChartId)
    if (token) {
      logEvent('share_created')
      const url = `${window.location.origin}/view/${token}`
      // Try Web Share API on mobile first (shows native share sheet)
      if (navigator.share) {
        try {
          await navigator.share({ title: 'AstroDig Chart', url })
          setCopied(true)
          setTimeout(() => setCopied(false), 2500)
          setCopying(false)
          return
        } catch (e) {
          if (e.name === 'AbortError') { setCopying(false); return }
          // Fall through to clipboard
        }
      }
      // Clipboard fallback
      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      } catch {
        // Final fallback: temporary input
        const el = document.createElement('textarea')
        el.value = url
        el.style.position = 'fixed'
        el.style.left = '-9999px'
        document.body.appendChild(el)
        el.focus()
        el.select()
        try { document.execCommand('copy') } catch {}
        document.body.removeChild(el)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      }
    } else {
      setShareError(true)
      setTimeout(() => setShareError(false), 4000)
    }
    setCopying(false)
  }

  return (
    <>
      <button
        type="button"
        className="relayout-btn relayout-btn--sharelink"
        onClick={handleShare}
        disabled={copying}
        title="Send this chart to someone"
      >
        {copied ? (
          <>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{display:'inline',verticalAlign:'middle',marginRight:'4px'}}>
              <polyline points="2,6 5,9 10,3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Link Copied!
          </>
        ) : (
          <>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{display:'inline',verticalAlign:'middle',marginRight:'4px'}}>
              <path d="M8 3H9a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M6 1v6M4 3l2-2 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="export-label-desktop">Send Chart</span>
            <span className="export-label-mobile">Send</span>
          </>
        )}
      </button>
      {shareError && (
        <span style={{ fontSize: '0.72rem', color: '#e87070', marginLeft: '6px' }}>
          Sync in progress — try again in a moment
        </span>
      )}
    </>
  )
}
