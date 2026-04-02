import { useState } from 'react'
import { generateShareToken } from '../utils/cloudStorage.js'

export function ShareButton({ savedChartId, syncStatus }) {
  const [copying, setCopying] = useState(false)
  const [copied, setCopied]   = useState(false)

  if (!savedChartId || syncStatus === 'error') return null

  async function handleShare() {
    if (copying) return
    setCopying(true)
    const token = await generateShareToken(savedChartId)
    if (token) {
      const url = `${window.location.origin}${window.location.pathname}?view=${token}`
      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      } catch {
        // Fallback: select a temporary input
        const el = document.createElement('input')
        el.value = url
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      }
    }
    setCopying(false)
  }

  return (
    <button
      type="button"
      className="relayout-btn relayout-btn--sharelink"
      onClick={handleShare}
      disabled={copying}
      title="Copy shareable link"
    >
      {copied ? (
        <>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{display:'inline',verticalAlign:'middle',marginRight:'4px'}}>
            <polyline points="2,6 5,9 10,3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{display:'inline',verticalAlign:'middle',marginRight:'4px'}}>
            <path d="M8 3H9a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M6 1v6M4 3l2-2 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Share Link
        </>
      )}
    </button>
  )
}
