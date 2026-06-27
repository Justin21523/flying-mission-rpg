import React from 'react';
import { resetPortfolioDemo } from '../../game/demo/DemoActions';
import { recordRuntimeError } from '../../game/qa/RuntimeErrorCollector';
import { useDiagnosticsStore } from '../../stores/useDiagnosticsStore';

type GameErrorBoundaryState = { error?: Error };

export class GameErrorBoundary extends React.Component<{ children: React.ReactNode }, GameErrorBoundaryState> {
  state: GameErrorBoundaryState = {};

  static getDerivedStateFromError(error: Error): GameErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    const event = recordRuntimeError({ source: 'react-boundary', message: error.message, detail: info.componentStack ?? undefined });
    useDiagnosticsStore.getState().addError(event);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950 p-6 text-slate-100">
        <div className="max-w-lg rounded-xl border border-rose-500/40 bg-slate-900 p-5 shadow-2xl">
          <div className="text-sm font-bold text-rose-200">Runtime error</div>
          <h1 className="mt-1 text-2xl font-black">The demo hit a recoverable issue.</h1>
          <p className="mt-2 text-sm text-slate-300">Try reloading, resetting demo data, or opening diagnostics from Developer Mode.</p>
          <div className="mt-3 rounded bg-slate-950/70 p-2 font-mono text-[11px] text-rose-100">{this.state.error.message}</div>
          <div className="mt-4 flex gap-2">
            <button className="rounded bg-sky-600 px-3 py-2 text-sm font-bold text-white" onClick={() => location.reload()}>Reload</button>
            <button className="rounded bg-slate-800 px-3 py-2 text-sm font-bold text-slate-100" onClick={() => { resetPortfolioDemo(); location.reload(); }}>Reset Demo</button>
          </div>
        </div>
      </div>
    );
  }
}
