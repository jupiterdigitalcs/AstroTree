'use client'

import { useState, useEffect, useRef } from 'react'

/** Animate a number from 0 to `target` over `duration` ms. Returns current value. */
export function useCountUp(target, duration = 1200, active = true) {
  const [value, setValue] = useState(0)
  const raf = useRef(null)

  useEffect(() => {
    if (!active) { setValue(0); return }
    const start = performance.now()
    function tick(now) {
      const t = Math.min((now - start) / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(eased * target))
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [target, duration, active])

  return value
}
