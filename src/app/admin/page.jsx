'use client'

import dynamic from 'next/dynamic'

const AdminApp = dynamic(() => import('../../admin/AdminApp.jsx'), { ssr: false })

export default function AdminPage() {
  return <AdminApp />
}
