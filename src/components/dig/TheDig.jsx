import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { buildSlides } from '../../utils/digSlides.js'
import { useSwipe } from '../../hooks/useSwipe.js'
import { getToPng, dataUrlToBlob, shareOrDownload } from '../../hooks/useExport.js'
import DigProgressBar from './DigProgressBar.jsx'
import DigSlide from './DigSlide.jsx'

export default function TheDig({ digData, onClose }) {
  const [slides] = useState(() => buildSlides(digData))
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

  async function handleShare() {
    if (sharing) return
    setSharing(true)
    try {
      // Capture the current slide as an image
      const slideEl = document.querySelector('.dig-slide--active')
      if (!slideEl) { setSharing(false); return }
      const toPng = await getToPng()
      const url = await toPng(slideEl, {
        backgroundColor: '#05031a',
        pixelRatio: 2,
        skipFonts: true,
        width: 1080 / 2,
        height: 1920 / 2,
      })
      await shareOrDownload(
        url, 'my-dig.png',
        'My Cosmic DIG — AstroDig',
        'Check out my family\'s cosmic story from AstroDig by Jupiter Digital ✦',
      )
    } catch {
      // silent fail
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
