'use client'

import dynamic from 'next/dynamic'

const HourPage = dynamic(() => import('../../components/hour/HourPage.jsx'), {
  ssr: false,
  loading: () => (
    <div style={{ position: 'fixed', inset: 0, background: '#09071a' }} />
  ),
})

export default function HourClient() {
  return <HourPage />
}
