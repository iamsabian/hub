import { Component, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: string | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(e: unknown): State {
    return { error: e instanceof Error ? e.message : String(e) }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-8">
          <div className="text-4xl">⚠️</div>
          <p className="text-white font-semibold">Something went wrong</p>
          <p className="text-zinc-400 text-sm max-w-sm">{this.state.error}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="mt-2 px-4 py-2 bg-zinc-700 rounded-lg text-sm text-white hover:bg-zinc-600 transition-colors"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
