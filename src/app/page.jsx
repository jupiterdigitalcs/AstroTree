'use client'

import dynamic from 'next/dynamic'

// Dynamic import to avoid SSR — App uses browser APIs (localStorage, window)
const App = dynamic(() => import('../App.jsx'), { ssr: false })

export default function HomePage() {
  return <App />
}
