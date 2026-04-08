'use client'

import { useState, useCallback } from 'react'
import { loadCharts } from '../utils/storage.js'

export let _toPng = null
export async function getToPng() {
  if (!_toPng) {
    const mod = await import('html-to-image')
    _toPng = mod.toPng
  }
  return _toPng
}

// ── Shared brand-bar compositing ────────────────────────────────────────────
async function appendBrandBar(imageUrl, pixelRatio = 2) {
  await document.fonts.ready
  const img = new Image()
  img.src = imageUrl
  await new Promise(r => { img.onload = r })
  const pr = pixelRatio
  const barH = 44 * pr
  const cvs = document.createElement('canvas')
  cvs.width  = img.width
  cvs.height = img.height + barH
  const ctx = cvs.getContext('2d')
  ctx.drawImage(img, 0, 0)
  ctx.fillStyle = '#09071a'
  ctx.fillRect(0, img.height, cvs.width, barH)
  ctx.strokeStyle = 'rgba(201,168,76,0.2)'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(0, img.height); ctx.lineTo(cvs.width, img.height); ctx.stroke()
  const pad = 16 * pr
  const mid = img.height + barH / 2
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#c9a84c'
  ctx.font = `600 ${13 * pr}px Cinzel, Georgia, serif`
  ctx.textAlign = 'left'
  ctx.fillText('✦ AstroDig · Jupiter Digital', pad, mid)
  ctx.fillStyle = 'rgba(184,170,212,0.65)'
  ctx.font = `${10 * pr}px Raleway, Helvetica, sans-serif`
  ctx.textAlign = 'right'
  ctx.fillText('astrodig.com  ·  jupiterdigitalevents.com', cvs.width - pad, mid)
  return cvs.toDataURL('image/png')
}

// ── Convert data URL to blob (avoids Chrome data URL download restrictions) ──
export function dataUrlToBlob(dataUrl) {
  const [header, b64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)[1]
  const bytes = atob(b64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

// ── Mobile share or desktop download ────────────────────────────────────────
export async function shareOrDownload(dataUrl, filename, shareTitle, shareText) {
  const blob = dataUrlToBlob(dataUrl)
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
  if (isMobile && navigator.share) {
    const file = new File([blob], filename, { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: shareTitle, text: shareText })
      return
    }
  }
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = filename
  link.href = url
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function getChartSlug(savedChartId) {
  const chartTitle = loadCharts().find(c => c.id === savedChartId)?.title
  const slug = chartTitle ? chartTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase() : 'family'
  return { chartTitle, slug }
}

// ── Combine two PNG data-URLs vertically on a canvas ────────────────────────
export function combineImagesVertically(url1, url2) {
  return new Promise(resolve => {
    const img1 = new Image(), img2 = new Image()
    let loaded = 0
    const onLoad = () => {
      if (++loaded < 2) return
      const canvas = document.createElement('canvas')
      canvas.width  = Math.max(img1.width, img2.width)
      canvas.height = img1.height + img2.height
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#09071a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img1, Math.floor((canvas.width - img1.width) / 2), 0)
      ctx.drawImage(img2, Math.floor((canvas.width - img2.width) / 2), img1.height)
      resolve(canvas.toDataURL('image/png'))
    }
    img1.onload = img2.onload = onLoad
    img1.src = url1; img2.src = url2
  })
}

// ── Hook ────────────────────────────────────────────────────────────────────
export function useExport({ savedChartId, fitViewRef }) {
  const [exporting,    setExporting]    = useState(false)
  const [exportError,  setExportError]  = useState(null)

  const handleExport = useCallback(async () => {
    const el = document.querySelector('.react-flow')
    if (!el || exporting) return
    setExportError(null)
    setExporting(true)

    fitViewRef.current?.({ padding: 0.12, duration: 0 })
    await new Promise(r => setTimeout(r, 120))

    el.classList.add('exporting')
    const { chartTitle, slug } = getChartSlug(savedChartId)
    const filename = `${slug}-tree.png`

    try {
      const url = await (await getToPng())(el, {
        backgroundColor: '#09071a',
        pixelRatio: 2,
        skipFonts: true,
        filter: node => {
          const c = node.classList
          if (!c) return true
          if (c.contains('react-flow__background')) return false
          if (c.contains('react-flow__controls'))   return false
          if (c.contains('canvas-panel-btns'))      return false
          if (c.contains('connect-prompt'))         return false
          if (c.contains('canvas-brand'))           return false
          return true
        },
      })
      const finalUrl = await appendBrandBar(url, 2)
      await shareOrDownload(
        finalUrl, filename,
        chartTitle ? `${chartTitle} · AstroDig` : 'My Family Astrology Tree',
        'Check out my family astrology tree, made with AstroDig by Jupiter Digital ✦',
      )
    } catch (err) {
      if (err?.name === 'AbortError') return
      setExportError('Export failed — please try again.')
    } finally {
      el.classList.remove('exporting')
      setExporting(false)
    }
  }, [exporting, savedChartId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleZodiacExport = useCallback(async () => {
    const el = document.querySelector('.zodiac-wheel-wrap')
    if (!el || exporting) return
    setExportError(null)
    setExporting(true)

    const { chartTitle, slug } = getChartSlug(savedChartId)
    const filename = `${slug}-zodiac.png`

    try {
      const url = await (await getToPng())(el, {
        backgroundColor: '#09071a',
        pixelRatio: 2,
        skipFonts: true,
        filter: node => {
          const c = node.classList
          if (!c) return true
          if (c.contains('zodiac-tooltip'))     return false
          if (c.contains('zodiac-sign-detail')) return false
          if (c.contains('zodiac-ring-toggles')) return false
          if (c.contains('zodiac-gen-filter'))  return false
          if (c.contains('zodiac-zoom-controls')) return false
          return true
        },
      })
      const finalUrl = await appendBrandBar(url, 2)
      await shareOrDownload(
        finalUrl, filename,
        chartTitle ? `${chartTitle} · Zodiac Wheel` : 'Family Zodiac Wheel',
        'Check out my family zodiac wheel from AstroDig by Jupiter Digital ✦',
      )
    } catch (err) {
      if (err?.name === 'AbortError') return
      setExportError('Export failed — please try again.')
    } finally {
      setExporting(false)
    }
  }, [exporting, savedChartId])

  const handleConstellationExport = useCallback(async () => {
    const el = document.querySelector('.constellation-wrap')
    if (!el || exporting) return
    setExportError(null)
    setExporting(true)

    const { chartTitle, slug } = getChartSlug(savedChartId)
    const filename = `${slug}-constellation.png`

    try {
      const url = await (await getToPng())(el, {
        backgroundColor: '#09071a',
        pixelRatio: 2,
        skipFonts: true,
        filter: node => {
          const c = node.classList
          if (!c) return true
          if (c.contains('constellation-tooltip')) return false
          if (c.contains('constellation-controls')) return false
          return true
        },
      })
      const finalUrl = await appendBrandBar(url, 2)
      await shareOrDownload(
        finalUrl, filename,
        chartTitle ? `${chartTitle} · Constellation` : 'Family Constellation',
        'Check out my constellation map from AstroDig by Jupiter Digital ✦',
      )
    } catch (err) {
      if (err?.name === 'AbortError') return
      setExportError('Export failed — please try again.')
    } finally {
      setExporting(false)
    }
  }, [exporting, savedChartId])

  const handleInsightsExport = useCallback(async () => {
    const el = document.querySelector('.insights-panel')
    if (!el || exporting) return
    setExportError(null)
    setExporting(true)

    const brandEl = el.querySelector('.insights-brand-footer')
    if (brandEl) brandEl.style.display = 'flex'
    el.classList.add('insights-panel--exporting')

    // Auto-size to 3 or 4 columns for families with many insight cards
    const cardCount = el.querySelectorAll('.insight-card').length
    const sizeClass = cardCount >= 14 ? 'insights-panel--exporting--xl'
                    : cardCount >= 9  ? 'insights-panel--exporting--wide'
                    : ''
    if (sizeClass) el.classList.add(sizeClass)

    const { chartTitle, slug } = getChartSlug(savedChartId)
    const filename = `${slug}-insights.png`

    try {
      const url = await (await getToPng())(el, {
        backgroundColor: '#09071a',
        pixelRatio: 2,
        skipFonts: true,
        filter: node => {
          const c = node.classList
          if (!c) return true
          if (c.contains('insight-coming-soon'))    return false
          if (c.contains('insights-export-btn'))    return false
          if (c.contains('insight-add-more'))       return false
          if (c.contains('insight-connect-prompt')) return false
          if (c.contains('dig-launch-btn'))         return false
          if (c.contains('insights-subnav'))        return false
          if (c.contains('insight-pro-tag'))        return false
          if (c.contains('dig-teaser-card'))       return false
          return true
        },
      })
      const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
      if (isMobile && navigator.share) {
        const blob = dataUrlToBlob(url)
        const file = new File([blob], filename, { type: 'image/png' })
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: chartTitle ? `${chartTitle} · Astrology Insights` : 'Family Astrology Insights',
            text: 'Here are my family astrology insights from AstroDig by Jupiter Digital ✦',
          })
          return
        }
      }
      const blobUrl = URL.createObjectURL(dataUrlToBlob(url))
      const link = document.createElement('a')
      link.download = filename
      link.href = blobUrl
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      if (err?.name === 'AbortError') return
      setExportError('Export failed — please try again.')
    } finally {
      el.classList.remove('insights-panel--exporting', 'insights-panel--exporting--wide', 'insights-panel--exporting--xl')
      if (brandEl) brandEl.style.display = ''
      setExporting(false)
    }
  }, [exporting, savedChartId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTablesExport = useCallback(async () => {
    const el = document.querySelector('.tables-canvas-wrap')
    if (!el || exporting) return
    setExportError(null)
    setExporting(true)

    const { chartTitle, slug } = getChartSlug(savedChartId)
    const filename = `${slug}-tables.png`

    try {
      const url = await (await getToPng())(el, {
        backgroundColor: '#09071a',
        pixelRatio: 2,
        skipFonts: true,
        filter: node => {
          const c = node.classList
          if (!c) return true
          if (c.contains('tables-col-toggles')) return false
          return true
        },
      })
      const finalUrl = await appendBrandBar(url, 2)
      await shareOrDownload(
        finalUrl, filename,
        chartTitle ? `${chartTitle} · Astrology Tables` : 'Family Astrology Tables',
        'Check out my family astrology data from AstroDig by Jupiter Digital ✦',
      )
    } catch (err) {
      if (err?.name === 'AbortError') return
      setExportError('Export failed — please try again.')
    } finally {
      setExporting(false)
    }
  }, [exporting, savedChartId]) // eslint-disable-line react-hooks/exhaustive-deps

  return { exporting, exportError, handleExport, handleZodiacExport, handleConstellationExport, handleInsightsExport, handleTablesExport }
}
