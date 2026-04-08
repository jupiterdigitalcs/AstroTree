import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { buildSlides, buildDigSummaryHtml } from '../../utils/digSlides.js'
import { useSwipe } from '../../hooks/useSwipe.js'
import DigProgressBar from './DigProgressBar.jsx'
import DigSlide from './DigSlide.jsx'

export default function TheDig({ digData, onClose, chartTitle, isPremium = true, onUpgrade }) {
  const FREE_SLIDE_LIMIT = 3
  const [allSlides] = useState(() => buildSlides(digData))
  const slides = isPremium ? allSlides : [
    ...allSlides.slice(0, FREE_SLIDE_LIMIT),
    { type: 'paywall', data: { remainingCount: allSlides.length - FREE_SLIDE_LIMIT }, mood: 'starfield' },
  ]
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState('forward')
  const [transitioning, setTransitioning] = useState(false)
  const [sharing, setSharing] = useState(false)
  const shareRef = useRef(null)

  const go = useCallback((dir) => {
    if (transitioning) return
    const next = dir === 'forward' ? current + 1 : current - 1
    if (next < 0 || next >= slides.length) {
      if (dir === 'forward' && current === slides.length - 1) onClose()
      return
    }
    setDirection(dir)
    setTransitioning(true)
    setCurrent(next)
    setTimeout(() => setTransitioning(false), 450)
  }, [current, slides.length, transitioning, onClose])

  function handleTap(e) {
    if (e.target.closest('button')) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    go(x < rect.width / 3 ? 'back' : 'forward')
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go('forward') }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go('back') }
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, onClose])

  const swipeHandlers = useSwipe({
    onSwipeLeft: () => go('forward'),
    onSwipeRight: () => go('back'),
  })

  // Share the current slide (mobile: native share, desktop: summary download)
  async function handleShare() {
    if (sharing) return
    setSharing(true)
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    try {
      const { getToPng } = await import('../../hooks/useExport.js')
      const toPng = await getToPng()
      const slug = chartTitle ? chartTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase() : 'family'

      // Mobile: capture just the current slide and share it
      if (isMobile && navigator.share) {
        const el = document.querySelector('.dig-slide--active')
        if (el) {
          const dataUrl = await toPng(el, { backgroundColor: '#05031a', pixelRatio: 2, skipFonts: true })
          const parts = dataUrl.split(',')
          const bin = atob(parts[1])
          const arr = new Uint8Array(bin.length)
          for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
          const blob = new Blob([arr], { type: parts[0].match(/:(.*?);/)[1] })
          const file = new File([blob], `the-dig-${slug}-${current + 1}.png`, { type: 'image/png' })
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file], title: 'The DIG — AstroDig', text: 'My family\'s cosmic story ✦ astrodig.com' })
          }
        }
        setSharing(false)
        return
      }

      // Desktop: render a summary card and download it
      const wrap = document.createElement('div')
      wrap.style.cssText = 'position:fixed;left:0;top:0;width:420px;background:#05031a;z-index:9999;'
      wrap.innerHTML = buildDigSummaryHtml(digData, slides, chartTitle)
      document.body.appendChild(wrap)
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

      const dataUrl = await toPng(wrap, { backgroundColor: '#05031a', pixelRatio: 2, skipFonts: true })
      document.body.removeChild(wrap)

      const parts = dataUrl.split(',')
      const mime = parts[0].match(/:(.*?);/)[1]
      const bin = atob(parts[1])
      const arr = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
      const blob = new Blob([arr], { type: mime })
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `the-dig-${slug}-summary.png`
      link.href = blobUrl
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch (e) {
      console.error('[dig] share error:', e)
    }
    setSharing(false)
  }

  function slideState(i) {
    if (i === current) return 'active'
    if (direction === 'forward' && i === current - 1) return 'exit-left'
    if (direction === 'back' && i === current + 1) return 'exit-right'
    return null
  }

  return createPortal(
    <div className="dig-overlay" {...swipeHandlers}>
      <DigProgressBar total={slides.length} current={current} />
      <button type="button" className="dig-close" onClick={onClose} aria-label="Close">✕</button>
      {/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) && (
        <button
          type="button"
          className="dig-close"
          style={{ right: '60px', fontSize: '0.75rem' }}
          onClick={handleShare}
          disabled={sharing}
          aria-label="Share"
        >{sharing ? '...' : '↑'}</button>
      )}
      <div className="dig-slide-area" onClick={handleTap}>
        {slides.map((slide, i) => {
          const state = slideState(i)
          if (!state) return null
          return <DigSlide key={i} slide={slide} state={state} onShare={handleShare} sharing={sharing} onUpgrade={onUpgrade} />
        })}
        <div className="dig-watermark">astrodig.com · ♃ Jupiter Digital · @jupreturn</div>
      </div>
    </div>,
    document.body
  )
}
