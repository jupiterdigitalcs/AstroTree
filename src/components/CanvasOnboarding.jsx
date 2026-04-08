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

  return (
    <div className="cosmic-onboarding">
      <JupiterIcon size={36} />
      <h2>Add Your First Person</h2>
      <p>Enter a name and birthday — we'll show you their cosmic profile.</p>
      <form className="cosmic-onboarding-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="cosmic-onboarding-input"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />
        <DateInput
          value={birthdate}
          onChange={setBirthdate}
        />
        <button
          type="submit"
          className="cosmic-onboarding-btn"
          disabled={!name.trim() || !birthdate}
        >
          Add to Chart
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
