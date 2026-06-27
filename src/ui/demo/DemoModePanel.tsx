import { useDemoModeStore } from '../../stores/useDemoModeStore';
import { DemoResetPanel } from './DemoResetPanel';
import { DemoValidationPanel } from './DemoValidationPanel';
import { RecordingModePanel } from './RecordingModePanel';

export const DemoModePanel = () => {
  const enabled = useDemoModeStore((state) => state.enabled);
  const update = useDemoModeStore((state) => state.updateDemoMode);
  return (
    <div className="pointer-events-auto fixed right-3 top-14 z-[72] w-80 rounded-xl border border-slate-700 bg-slate-950/90 p-3 text-xs text-slate-300 shadow-2xl backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <b className="text-sky-200">Demo Tools</b>
        <button className="rounded bg-slate-800 px-2 py-1" onClick={() => update({ enabled: !enabled })}>{enabled ? 'Demo on' : 'Demo off'}</button>
      </div>
      <div className="mb-2 grid grid-cols-2 gap-1">
        <Toggle label="Hints" field="enableGuidedHints" />
        <Toggle label="Controls" field="showControlsOverlay" />
        <Toggle label="Highlights" field="showFeatureHighlights" />
        <Toggle label="Hide debug" field="hideDebugByDefault" />
      </div>
      <RecordingModePanel />
      <DemoResetPanel />
      <div className="mt-2 max-h-72 overflow-auto"><DemoValidationPanel /></div>
    </div>
  );
};

const Toggle = ({ label, field }: { label: string; field: 'enableGuidedHints' | 'showControlsOverlay' | 'showFeatureHighlights' | 'hideDebugByDefault' }) => {
  const value = useDemoModeStore((state) => state[field]);
  const update = useDemoModeStore((state) => state.updateDemoMode);
  return <button className={`rounded border px-2 py-1 ${value ? 'border-sky-500 text-sky-100' : 'border-slate-700 text-slate-400'}`} onClick={() => update({ [field]: !value })}>{label}</button>;
};
