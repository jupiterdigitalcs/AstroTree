import { useRef, useCallback, useEffect, useState } from 'react'

export function BottomSheet({ open, title, onClose, children }) {
  const contentRef = useRef(null)
  const startYRef = useRef(0)
  const sheetRef = useRef(null)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  // Track virtual keyboard via visualViewport API (works on iOS/iPadOS Safari + Chrome)
  useEffect(() => {
    if (!open) return
    const vv = window.visualViewport
    if (!vv) return

    function onResize() {
      // When keyboard opens, visualViewport.height shrinks but window.innerHeight stays the same
      const kbH = window.innerHeight - vv.height
      setKeyboardHeight(kbH > 50 ? kbH : 0) // ignore tiny diffs from URL bar
    }

    vv.addEventListener('resize', onResize)
    onResize() // check initial state (keyboard might already be open)

    return () => vv.removeEventListener('resize', onResize)
  }, [open])

  // Scroll the focused input into view when keyboard opens
  useEffect(() => {
    if (keyboardHeight === 0 || !contentRef.current) return
    const active = document.activeElement
    if (active && contentRef.current.contains(active)) {
      // Small delay so the sheet finishes resizing first
      setTimeout(() => active.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
    }
  }, [keyboardHeight])

  const handleDragStart = useCallback((e) => {
    startYRef.current = e.touches?.[0]?.clientY ?? e.clientY
  }, [])

  const handleDragEnd = useCallback((e) => {
    const endY = e.changedTouches?.[0]?.clientY ?? e.clientY
    const delta = endY - startYRef.current
    // Swipe down > 80px dismisses
    if (delta > 80) onClose()
  }, [onClose])

  // When keyboard opens, dvh already shrinks to the visible area above the keyboard,
  // so fixed-positioned bottom is already correct — only constrain maxHeight.
  const sheetStyle = keyboardHeight > 0
    ? { maxHeight: `calc(100dvh - 80px)` }
    : undefined

  return (
    <>
      {open && (
        <div className="cosmic-sheet-backdrop" onClick={onClose} />
      )}
      <div
        ref={sheetRef}
        className={`cosmic-bottom-sheet${open ? ' open' : ''}${keyboardHeight > 0 ? ' keyboard-open' : ''}`}
        style={sheetStyle}
      >
        <div
          className="cosmic-bottom-sheet-drag"
          onTouchStart={handleDragStart}
          onTouchEnd={handleDragEnd}
          onMouseDown={handleDragStart}
          onMouseUp={handleDragEnd}
        >
          <div className="cosmic-bottom-sheet-handle" />
        </div>
        <div className="cosmic-bottom-sheet-header">
          <span className="cosmic-bottom-sheet-title">{title}</span>
          <button
            type="button"
            className="cosmic-bottom-sheet-close"
            onClick={onClose}
            aria-label="Close"
          >✕</button>
        </div>
        <div ref={contentRef} className="cosmic-bottom-sheet-content">
          {children}
        </div>
      </div>
    </>
  )
}
