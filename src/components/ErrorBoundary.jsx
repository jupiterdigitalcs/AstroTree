import { Component } from 'react'

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
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🪐</div>
          <h2 style={{ color: '#e6c76e', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            Something went wrong
          </h2>
          <p style={{ color: '#8878aa', fontSize: '0.875rem', marginBottom: '1.5rem', maxWidth: '28rem' }}>
            An unexpected error occurred. Your saved charts are safe in localStorage.
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
