'use client'

import dynamic from 'next/dynamic'

const JourneyPage = dynamic(() => import('../../components/journey/JourneyPage.jsx'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100dvh', background: '#09071a',
    }} />
  ),
})

export default function JourneyClient() {
  return <JourneyPage />
}
