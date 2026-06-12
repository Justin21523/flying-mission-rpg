import { useState } from 'react';
import {
  debugSaveNow, debugReloadFromDisk, debugClearSave, debugExportSave, debugImportSave,
  debugResetProgress, debugUnlockAll, debugResetSettings, debugSaveSummary, debugSchemaVersion,
} from '../../game/save/SaveDebugTools';

// Batch 13 — debug save/reset tools (debug only). Import always validates + migrates (never trusts raw JSON).
export const SaveDebugPanel = () => {
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');

  const doImport = (): void => {
    const r = debugImportSave(text);
    setMsg(r.ok ? 'imported ✓' : `import failed: ${r.errors[0] ?? '?'}`);
  };

  return (
    <div className="pointer-events-auto fixed left-2 top-2 z-[60] w-64 rounded-lg border border-slate-700 bg-slate-950/90 p-2 font-mono text-[10px] text-slate-200 shadow-lg backdrop-blur">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-bold text-indigo-300">💾 Save Debug</span>
        <span className="text-slate-500">schema v{debugSchemaVersion()}</span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <Btn label="Save now" onClick={() => setMsg(debugSaveNow() ? 'saved ✓' : 'save failed')} />
        <Btn label="Reload" onClick={() => setMsg(`loaded: ${debugReloadFromDisk().status}`)} />
        <Btn label="Clear" onClick={() => { debugClearSave(); setMsg('cleared'); }} />
        <Btn label="Summary" onClick={() => setText(JSON.stringify(debugSaveSummary(), null, 2))} />
        <Btn label="Export" onClick={() => setText(debugExportSave())} />
        <Btn label="Import" onClick={doImport} />
        <Btn label="Reset prog" onClick={() => { debugResetProgress(); setMsg('progress reset'); }} />
        <Btn label="Unlock all" onClick={() => { debugUnlockAll(); setMsg('unlocked all'); }} />
        <Btn label="Reset settings" onClick={() => { debugResetSettings(); setMsg('settings reset'); }} />
      </div>
      {msg && <div className="mt-1 text-emerald-300">{msg}</div>}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="export shows JSON here · paste a save then Import"
        className="mt-1 h-20 w-full resize-none rounded bg-slate-900/70 p-1 text-[9px] text-slate-200"
      />
    </div>
  );
};

const Btn = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button onClick={onClick} className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-200 hover:bg-slate-700">{label}</button>
);
