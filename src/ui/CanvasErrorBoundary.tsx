import { Component, type ErrorInfo, type ReactNode } from 'react';

// Guards the R3F <Canvas>. If a render-loop error throws (which would otherwise leave a frozen /
// black scene that only a manual reload clears), we catch it and show a Reload button so the user
// can recover instantly instead of staring at a dead canvas.
interface Props { children: ReactNode }
interface State { error: Error | null }

export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // No silent catch — surface it for debugging.
    console.error('[CanvasErrorBoundary] 3D scene crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-slate-950 text-slate-100">
          <div className="text-lg font-bold">The 3D scene hit an error.</div>
          <div className="max-w-md px-6 text-center text-xs text-slate-400">{this.state.error.message}</div>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
