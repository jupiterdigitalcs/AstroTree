import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { buildSlides } from '../../utils/digSlides.js'
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
    try {
      const { getToPng } = await import('../../hooks/useExport.js')
      const toPng = await getToPng()
      const captures = []

      // Cycle through each slide, capture it
      for (let i = 0; i < slides.length; i++) {
        setCurrent(i)
        setDirection('forward')
        await new Promise(r => setTimeout(r, 500)) // wait for transition + render
        const el = document.querySelector('.dig-slide--active')
        if (!el) continue
        const img = await toPng(el, { backgroundColor: '#05031a', pixelRatio: 2, skipFonts: true })
        captures.push(img)
      }

      if (captures.length === 0) { setSharing(false); return }

      // Load all captured images
      const images = await Promise.all(captures.map(src => new Promise(resolve => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.src = src
      })))

      // Stitch vertically on one canvas
      const W = images[0].width
      const totalH = images.reduce((sum, img) => sum + img.height, 0)
      const cvs = document.createElement('canvas')
      cvs.width = W
      cvs.height = totalH
      const ctx = cvs.getContext('2d')
      let y = 0
      for (const img of images) {
        ctx.drawImage(img, 0, y)
        y += img.height
      }

      const slug = chartTitle ? chartTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase() : 'family'
      const filename = 'the-dig-' + slug + '-astrodig.png'
      const blob = await new Promise(resolve => cvs.toBlob(resolve, 'image/png'))

      // Mobile: share individual slides as separate images (saves to camera roll)
      if (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) && navigator.share) {
        const files = await Promise.all(captures.map(async (src, i) => {
          const res = await fetch(src)
          const b = await res.blob()
          return new File([b], 'the-dig-' + slug + '-' + (i + 1) + '.png', { type: 'image/png' })
        }))
        if (navigator.canShare?.({ files })) {
          await navigator.share({ files, title: 'The Dig — AstroDig', text: 'My family\'s cosmic story ✦' })
          setCurrent(savedCurrent)
          setSharing(false)
          return
        }
      }

      // Desktop: download all slides stitched vertically
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = filename
      link.href = url
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
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
      <button
        type="button"
        className="dig-close"
        style={{ right: '60px', fontSize: '0.75rem' }}
        onClick={handleShare}
        disabled={sharing}
        aria-label="Share"
      >{sharing ? '...' : '↓'}</button>
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
