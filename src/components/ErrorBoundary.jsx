import { Component } from 'react'
import { JupiterIcon } from './JupiterIcon.jsx'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', background: '#09071a',
          color: '#ede6ff', fontFamily: 'Cinzel, serif', textAlign: 'center',
          padding: '2rem',
        }}>
          <div style={{ marginBottom: '1rem' }}><JupiterIcon size={48} /></div>
          <h2 style={{ color: '#e6c76e', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            Something went wrong
          </h2>
          <p style={{ color: '#8878aa', fontSize: '0.875rem', marginBottom: '0.75rem', maxWidth: '28rem' }}>
            An unexpected error occurred. Your saved trees are safe in localStorage.
          </p>
          <p style={{ color: '#e07070', fontSize: '0.72rem', marginBottom: '1.5rem', maxWidth: '28rem', fontFamily: 'monospace', wordBreak: 'break-word' }}>
            {this.state.error?.message}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              background: 'transparent', border: '1px solid #c9a84c', color: '#c9a84c',
              padding: '0.5rem 1.5rem', borderRadius: '6px', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '0.875rem', letterSpacing: '0.05em',
            }}
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
