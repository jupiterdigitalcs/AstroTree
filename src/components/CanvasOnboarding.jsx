import { useState } from 'react'
import { JupiterIcon } from './JupiterIcon.jsx'
import { DateInput } from './DateInput.jsx'

export function CanvasOnboarding({ onAdd, onDemo, onDemoCrew, onLoadCharts, onNewChart, hasUsedApp }) {
  const [name, setName] = useState('')
  const [birthdate, setBirthdate] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !birthdate) return
    onAdd({
      members: [{ name: name.trim(), birthdate }],
    })
  }

  if (hasUsedApp) {
    return (
      <div className="cosmic-onboarding">
        <JupiterIcon size={36} />
        <h2>Welcome Back</h2>
        <p>Your charts are waiting — pick up where you left off.</p>
        <button type="button" className="cosmic-onboarding-btn" onClick={onLoadCharts}>
          Load Saved Chart
        </button>
        <button type="button" className="cosmic-onboarding-skip" onClick={onNewChart}>
          + Start a New Chart
        </button>
      </div>
    )
  }

  const trimmedName = name.trim()
  const canSubmit = trimmedName && birthdate

  return (
    <div className="cosmic-onboarding">
      <JupiterIcon size={36} />
      <h2>Start Your Chart</h2>
      <p>Add the first person — yourself, a family member, or a friend. We'll reveal their sun sign, moon sign, and inner planets.</p>
      <form className="cosmic-onboarding-form" onSubmit={handleSubmit}>
        <label className="cosmic-onboarding-label">
          <span className="cosmic-onboarding-label-text">Full name</span>
          <input
            type="text"
            className="cosmic-onboarding-input"
            placeholder="e.g. Alex Rivera"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </label>
        <label className="cosmic-onboarding-label">
          <span className="cosmic-onboarding-label-text">Birthday (MM / DD / YYYY)</span>
          <DateInput
            value={birthdate}
            onChange={setBirthdate}
          />
        </label>
        <button
          type="submit"
          className="cosmic-onboarding-btn"
          disabled={!canSubmit}
        >
          {canSubmit ? `Add ${trimmedName} to Chart` : 'Add to Chart'}
        </button>
      </form>
      <div className="cosmic-onboarding-demos">
        <button type="button" className="cosmic-onboarding-demo" onClick={onDemo}>
          Try: Family Tree
        </button>
        <button type="button" className="cosmic-onboarding-demo" onClick={onDemoCrew}>
          Try: Friends & Coworkers
        </button>
      </div>
    </div>
  )
}
