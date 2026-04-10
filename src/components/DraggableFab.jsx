import { useState, useRef, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'astrodig_fab_pos'

function loadPos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function savePos(pos) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pos)) } catch {}
}

export function DraggableFab({ onClick }) {
  const [pos, setPos] = useState(() => loadPos())
  const dragState = useRef(null)
  const fabRef = useRef(null)
  const didDrag = useRef(false)

  // Clamp position to viewport
  const clamp = useCallback((x, y) => {
    const el = fabRef.current
    if (!el) return { x, y }
    const w = el.offsetWidth
    const h = el.offsetHeight
    return {
      x: Math.max(8, Math.min(window.innerWidth - w - 8, x)),
      y: Math.max(8, Math.min(window.innerHeight - h - 8, y)),
    }
  }, [])

  // Re-clamp on resize
  useEffect(() => {
    if (!pos) return
    function onResize() {
      setPos(prev => {
        if (!prev) return prev
        const clamped = clamp(prev.x, prev.y)
        savePos(clamped)
        return clamped
      })
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [pos, clamp])

  const onPointerDown = useCallback((e) => {
    if (e.button && e.button !== 0) return
    didDrag.current = false
    const touch = e.touches?.[0] ?? e
    const el = fabRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    dragState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      offsetX: touch.clientX - rect.left,
      offsetY: touch.clientY - rect.top,
    }
    el.style.transition = 'none'
  }, [])

  const onPointerMove = useCallback((e) => {
    if (!dragState.current) return
    e.preventDefault()
    const touch = e.touches?.[0] ?? e
    const dx = Math.abs(touch.clientX - dragState.current.startX)
    const dy = Math.abs(touch.clientY - dragState.current.startY)
    if (dx > 5 || dy > 5) didDrag.current = true
    if (!didDrag.current) return
    const x = touch.clientX - dragState.current.offsetX
    const y = touch.clientY - dragState.current.offsetY
    const clamped = clamp(x, y)
    setPos(clamped)
  }, [clamp])

  const onPointerUp = useCallback(() => {
    if (!dragState.current) return
    const el = fabRef.current
    if (el) el.style.transition = ''
    dragState.current = null
    if (didDrag.current && pos) {
      savePos(pos)
    }
  }, [pos])

  useEffect(() => {
    window.addEventListener('mousemove', onPointerMove)
    window.addEventListener('mouseup', onPointerUp)
    window.addEventListener('touchmove', onPointerMove, { passive: false })
    window.addEventListener('touchend', onPointerUp)
    return () => {
      window.removeEventListener('mousemove', onPointerMove)
      window.removeEventListener('mouseup', onPointerUp)
      window.removeEventListener('touchmove', onPointerMove)
      window.removeEventListener('touchend', onPointerUp)
    }
  }, [onPointerMove, onPointerUp])

  function handleClick() {
    if (didDrag.current) return
    onClick?.()
  }

  const style = pos
    ? { position: 'fixed', left: pos.x, top: pos.y, bottom: 'auto', right: 'auto' }
    : {}

  return (
    <button
      ref={fabRef}
      type="button"
      className="cosmic-dig-fab"
      style={style}
      onMouseDown={onPointerDown}
      onTouchStart={onPointerDown}
      onClick={handleClick}
      title="The DIG — drag to reposition"
    >
      <span className="cosmic-dig-fab-icon">✦</span>
      <span className="cosmic-dig-fab-label">The DIG</span>
    </button>
  )
}
