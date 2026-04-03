import { useState } from 'react'
import { attemptAdminLogin } from './utils/adminAuth.js'
import { JupiterIcon } from '../components/JupiterIcon.jsx'

export default function AdminLogin({ onSuccess }) {
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (attemptAdminLogin(password)) {
      onSuccess()
    } else {
      setError(true)
      setPassword('')
    }
  }

  return (
    <div className="admin-login-wrap">
      <div className="admin-login-box">
        <div className="admin-login-brand">
          <JupiterIcon size={40} />
          <h1 className="admin-login-title">AstroDig Admin</h1>
        </div>
        <form onSubmit={handleSubmit} className="admin-login-form">
          <input
            type="password"
            className="admin-input"
            placeholder="Password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false) }}
            autoFocus
          />
          {error && <p className="admin-login-error">Incorrect password</p>}
          <button type="submit" className="admin-btn admin-btn--primary">Sign in</button>
        </form>
      </div>
    </div>
  )
}
