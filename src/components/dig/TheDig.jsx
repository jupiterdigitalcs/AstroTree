import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { buildSlides, buildDigSummaryHtml } from '../../utils/digSlides.js'
import { useSwipe } from '../../hooks/useSwipe.js'
import DigProgressBar from './DigProgressBar.jsx'
import DigSlide from './DigSlide.jsx'

export default function TheDig({ digData, onClose, chartTitle }) {
  const [slides] = useState(() => buildSlides(digData))
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

  async function handleShare() {
    if (sharing) return
    setSharing(true)
    const savedCurrent = current
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    try {
      const { getToPng } = await import('../../hooks/useExport.js')
      const toPng = await getToPng()
      const slug = chartTitle ? chartTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase() : 'family'

      // Mobile: capture each slide individually for native share sheet
      if (isMobile && navigator.share) {
        const captures = []
        for (let i = 0; i < slides.length; i++) {
          setCurrent(i)
          setDirection('forward')
          await new Promise(r => setTimeout(r, 500))
          const el = document.querySelector('.dig-slide--active')
          if (!el) continue
          captures.push(await toPng(el, { backgroundColor: '#05031a', pixelRatio: 2, skipFonts: true }))
        }
        if (captures.length > 0) {
          const files = await Promise.all(captures.map(async (src, i) => {
            const b = await (await fetch(src)).blob()
            return new File([b], `the-dig-${slug}-${i + 1}.png`, { type: 'image/png' })
          }))
          if (navigator.canShare?.({ files })) {
            await navigator.share({ files, title: 'The DIG — AstroDig', text: 'My family\'s cosmic story ✦' })
            setCurrent(savedCurrent)
            setSharing(false)
            return
          }
        }
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
    setCurrent(savedCurrent)
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
          return <DigSlide key={i} slide={slide} state={state} onShare={handleShare} sharing={sharing} />
        })}
      </div>
    </div>,
    document.body
  )
}
