import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { buildSlides } from '../../utils/digSlides.js'
import { useSwipe } from '../../hooks/useSwipe.js'
import DigProgressBar from './DigProgressBar.jsx'
import DigSlide from './DigSlide.jsx'

export default function TheDig({ digData, onClose, onShare }) {
  const [slides] = useState(() => buildSlides(digData))
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState('forward')
  const [transitioning, setTransitioning] = useState(false)

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

  // Tap zones: left third = back, right two-thirds = forward
  function handleTap(e) {
    if (e.target.closest('button')) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    go(x < rect.width / 3 ? 'back' : 'forward')
  }

  // Keyboard
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go('forward') }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go('back') }
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, onClose])

  // Swipe
  const swipeHandlers = useSwipe({
    onSwipeLeft: () => go('forward'),
    onSwipeRight: () => go('back'),
  })

  // Slide states
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
          return <DigSlide key={i} slide={slide} state={state} onShare={onShare} />
        })}
      </div>
    </div>,
    document.body
  )
}
