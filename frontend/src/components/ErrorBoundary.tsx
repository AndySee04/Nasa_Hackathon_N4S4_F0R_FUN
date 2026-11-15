import { Component, type ErrorInfo, type ReactNode } from 'react'
import Paper from './Paper'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Shows a friendly message instead of a blank page if part of the site crashes.
 * Give it a `key` (such as the current URL) so navigating away clears the error.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('N4S4 F0R FUN crashed:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="mx-auto max-w-xl px-4 py-24" role="alert">
        <Paper tilt={-1} innerClassName="flex flex-col items-center gap-4 px-6 py-10 text-center">
          <p className="text-5xl" aria-hidden="true">🛰️</p>
          <h1 className="text-3xl">Houston, we have a problem</h1>
          <p className="text-lg">This part of the museum hit a glitch. Try reloading the page.</p>
          <button type="button" className="cbtn c-yellow" onClick={() => window.location.reload()}>
            Reload
          </button>
        </Paper>
      </div>
    )
  }
}
