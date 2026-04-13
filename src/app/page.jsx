'use client'

import dynamic from 'next/dynamic'
import { ErrorBoundary } from '../components/ErrorBoundary.jsx'

// Dynamic import to avoid SSR — App uses browser APIs (localStorage, window)
const App = dynamic(() => import('../App.jsx'), { ssr: false })

export default function HomePage() {
  return <ErrorBoundary><App /></ErrorBoundary>
}
