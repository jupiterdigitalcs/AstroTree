import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { buildSlides } from '../../utils/digSlides.js'
import { useSwipe } from '../../hooks/useSwipe.js'
import DigProgressBar from './DigProgressBar.jsx'
import DigSlide from './DigSlide.jsx'

export default function TheDig({ digData, onClose, chartTitle, isPremium = true, onUpgrade: rawUpgrade }) {
  const onUpgrade = rawUpgrade ? () => { onClose(); rawUpgrade() } : undefined
  const FREE_SLIDE_LIMIT = 3
  const [allSlides] = useState(() => buildSlides(digData))
  const slides = isPremium ? allSlides : [
    ...allSlides.slice(0, FREE_SLIDE_LIMIT),
    {
      type: 'paywall',
      data: {
        remainingCount: allSlides.length - FREE_SLIDE_LIMIT,
        lockedSlides: allSlides.slice(FREE_SLIDE_LIMIT).map(s => s.type),
      },
      mood: 'starfield',
    },
  ]
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState('forward')
  const [transitioning, setTransitioning] = useState(false)
  const [sharing, setSharing] = useState(false)

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

  // Share the current slide (mobile: native share, desktop/fallback: download)
  async function handleShare() {
    if (sharing) return
    setSharing(true)
    try {
      const { getToPng, shareOrDownload } = await import('../../hooks/useExport.js')
      const toPng = await getToPng()
      const slug = chartTitle ? chartTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase() : 'family'
      const filename = `the-dig-${slug}-${current + 1}.png`
      const captureOpts = {
        backgroundColor: '#05031a',
        pixelRatio: 2,
        skipFonts: true,
        filter: (node) => {
          if (!node.classList) return true
          // Hide share button and close button from capture
          return !node.classList.contains('dig-slide-share') && !node.classList.contains('dig-close')
        },
      }

      const el = document.querySelector('.dig-slide--active')
      if (!el) { setSharing(false); return }

      // Double-render: first call forces fonts/images, second captures cleanly
      await toPng(el, captureOpts).catch(() => {})
      await new Promise(r => setTimeout(r, 120))
      const dataUrl = await toPng(el, captureOpts)

      await shareOrDownload(
        dataUrl, filename,
        'The DIG — AstroDig',
        'My family\'s cosmic story ✦ astrodig.com',
      )
    } catch (e) {
      if (e?.name === 'AbortError') { setSharing(false); return }
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
      <DigProgressBar total={slides.length} current={current} freeLimit={isPremium ? 0 : FREE_SLIDE_LIMIT} />
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
        {/* Brand is on each slide via dig-slide-brand */}
      </div>
    </div>,
    document.body
  )
}
