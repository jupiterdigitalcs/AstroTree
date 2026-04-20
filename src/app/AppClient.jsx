'use client'

import dynamic from 'next/dynamic'
import { ErrorBoundary } from '../components/ErrorBoundary.jsx'

// Dynamic import to avoid SSR — App uses browser APIs (localStorage, window)
const App = dynamic(() => import('../App.jsx'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100dvh', background: '#09071a',
    }}>
      <p style={{ color: '#c9a84c', fontFamily: 'Cinzel, Georgia, serif', fontSize: '1rem', letterSpacing: '0.1em' }}>
        ✦
      </p>
    </div>
  ),
})

export default function AppClient() {
  return <ErrorBoundary><App /></ErrorBoundary>
}
