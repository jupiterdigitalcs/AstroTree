'use client'

import { useState } from 'react'
import { isAdminAuthed, adminLogout } from './utils/adminAuth.js'
import AdminLogin from './AdminLogin.jsx'
import AdminDashboard from './AdminDashboard.jsx'
import { JupiterIcon } from '../components/JupiterIcon.jsx'

export default function AdminApp() {
  const [authed, setAuthed] = useState(() => isAdminAuthed())

  if (!authed) {
    return <AdminLogin onSuccess={() => setAuthed(true)} />
  }

  return (
    <div className="admin-app">
      <header className="admin-header">
        <div className="admin-header-brand">
          <JupiterIcon size={28} />
          <span className="admin-header-title">AstroDig Admin</span>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn--ghost"
          onClick={() => { adminLogout(); setAuthed(false) }}
        >
          Sign out
        </button>
      </header>
      <main className="admin-main">
        <AdminDashboard />
      </main>
    </div>
  )
}
