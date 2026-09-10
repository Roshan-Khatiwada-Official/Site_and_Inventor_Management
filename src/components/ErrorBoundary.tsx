import React from 'react';

/**
 * Catches render-time errors so the app shows a readable message and a way
 * back instead of a blank white screen.
 */
export class ErrorBoundary extends React.Component<any, { error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: any, info: any) {
    console.error('App crashed:', error, info);
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 text-xl">
            !
          </div>
          <h1 className="text-lg font-bold">Something went wrong</h1>
          <p className="text-sm text-slate-400 max-w-md">
            The screen failed to load. Reloading usually fixes it. If it keeps happening,
            share the message below.
          </p>
          <pre className="text-[11px] text-rose-300 bg-slate-900 border border-slate-800 rounded-lg p-3 max-w-lg overflow-auto text-left">
            {error.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition"
          >
            Reload app
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
