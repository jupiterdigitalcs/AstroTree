import { useState, useEffect } from 'react'

const STORAGE_KEY = 'astrotree_insights_seen'

export function OnboardingProgress({ nodes, edges, onGoToTree, onGoToInsights }) {
  const [insightsSeen, setInsightsSeen] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === '1' } catch { return false }
  })

  useEffect(() => {
    if (insightsSeen) return
    // Mark insights as seen when user navigates there (parent sets this via prop)
  }, [insightsSeen])

  const step1Done = nodes.length > 0
  const step2Done = edges.length > 0
  const step3Done = insightsSeen

  // Auto-hide once all steps complete or app is well-used
  const allDone = step1Done && step2Done && step3Done
  const wellUsed = nodes.length >= 4 && edges.length >= 2 && step3Done
  if (allDone || wellUsed) return null

  function handleStepClick(step) {
    if (step === 2) onGoToTree?.()
    if (step === 3) {
      try { localStorage.setItem(STORAGE_KEY, '1') } catch {}
      setInsightsSeen(true)
      onGoToInsights?.()
    }
  }

  const steps = [
    { label: 'Add members', done: step1Done, active: !step1Done },
    { label: 'Connect them', done: step2Done, active: step1Done && !step2Done, onClick: () => handleStepClick(2) },
    { label: 'See Insights', done: step3Done, active: step2Done && !step3Done, onClick: () => handleStepClick(3) },
  ]

  return (
    <div className="onboarding-stepper">
      {steps.map((step, i) => (
        <div key={i} className="stepper-step-wrap">
          <button
            type="button"
            className={`stepper-step${step.done ? ' stepper-step--done' : step.active ? ' stepper-step--active' : ''}`}
            onClick={step.onClick}
            disabled={!step.active && !step.done}
          >
            <span className="stepper-num">{step.done ? '✓' : i + 1}</span>
            <span className="stepper-label">{step.label}</span>
          </button>
          {i < steps.length - 1 && (
            <span className={`stepper-connector${step.done ? ' stepper-connector--done' : ''}`} aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  )
}

export function markInsightsSeen() {
  try { localStorage.setItem(STORAGE_KEY, '1') } catch {}
}
