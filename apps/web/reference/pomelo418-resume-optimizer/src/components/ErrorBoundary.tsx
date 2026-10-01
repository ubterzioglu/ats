import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props  { children: ReactNode }
interface State  { error: Error | null }

/**
 * Catches any unhandled render errors below this boundary and shows a
 * friendly message instead of a blank page.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-red-100 p-8 space-y-4 text-center">
            <div className="text-4xl">⚠️</div>
            <h2 className="text-lg font-semibold text-gray-800">Something went wrong</h2>
            <p className="text-sm text-gray-500 font-mono bg-gray-50 rounded-lg p-3 text-left break-all">
              {this.state.error.message}
            </p>
            <button
              onClick={() => this.setState({ error: null })}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
