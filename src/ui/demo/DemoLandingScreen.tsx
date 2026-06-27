import { useUiStore } from '../../stores/uiStore';
import { useDemoModeStore } from '../../stores/useDemoModeStore';
import { useSystemMenuStore } from '../../stores/systemMenuStore';
import { startPortfolioDemo } from '../../game/demo/DemoActions';
import { DemoFeatureHighlights } from './DemoFeatureHighlights';
import { DemoQuickStartPanel } from './DemoQuickStartPanel';
import { DemoValidationPanel } from './DemoValidationPanel';

export const DemoLandingScreen = () => {
  const show = useDemoModeStore((state) => state.enabled && !state.landingDismissed);
  const dismiss = useDemoModeStore((state) => state.dismissLanding);
  if (!show) return null;
  return (
    <div className="pointer-events-auto fixed inset-0 z-[95] overflow-auto bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-full max-w-6xl flex-col justify-center gap-5 px-6 py-10">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.35em] text-sky-300">Portfolio Demo</div>
          <h1 className="mt-2 text-4xl font-black tracking-wide text-white">Aero Rescue RPG</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
            A playable Web 3D rescue-action vertical slice with campaign progression, stage runtime, combat skills, support calls, AI incidents, bosses, and in-game authoring tools.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <button className="rounded-lg bg-sky-600 px-4 py-3 text-left text-sm font-black text-white hover:bg-sky-500" onClick={() => startPortfolioDemo()}>Start Demo</button>
          <button className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-left text-sm font-bold text-slate-100 hover:bg-slate-800" onClick={dismiss}>Continue</button>
          <button className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-left text-sm font-bold text-slate-100 hover:bg-slate-800" onClick={() => { dismiss(); useSystemMenuStore.getState().openMenu(); useSystemMenuStore.getState().setView('settings'); }}>Settings</button>
          <button className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-left text-sm font-bold text-slate-100 hover:bg-slate-800" onClick={() => { dismiss(); startPortfolioDemo(); }}>Stage Select</button>
          <button className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-left text-sm font-bold text-slate-100 hover:bg-slate-800" onClick={() => { dismiss(); useUiStore.getState().setEditMode(true); }}>Edit Mode Showcase</button>
          <button className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-left text-sm font-bold text-slate-100 hover:bg-slate-800" onClick={() => useDemoModeStore.getState().updateDemoMode({ showControlsOverlay: true })}>Controls</button>
        </div>
        <DemoQuickStartPanel />
        <DemoFeatureHighlights />
        <details className="rounded-xl border border-slate-700 bg-slate-900/60 p-3">
          <summary className="cursor-pointer text-sm font-bold text-sky-200">About This Project / Demo Checklist</summary>
          <div className="mt-3"><DemoValidationPanel /></div>
        </details>
      </div>
    </div>
  );
};
