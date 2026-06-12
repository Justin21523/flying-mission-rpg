import { useState } from 'react';
import { useSystemMenuStore } from '../../stores/systemMenuStore';
import { useGameStore } from '../../stores/game/useGameStore';
import { GraphicsSettingsTab } from '../settings/GraphicsSettingsTab';
import { AudioSettingsTab } from '../settings/AudioSettingsTab';
import { GameplaySettingsTab } from '../settings/GameplaySettingsTab';
import { AccessibilitySettingsTab } from '../settings/AccessibilitySettingsTab';
import {
  debugSaveNow, debugExportSave, debugImportSave, debugSaveSummary,
} from '../../game/save/SaveDebugTools';

// In-game system menu overlay (aero play). Resume / Settings / Save / Abandon. Esc toggles it. Reuses the
// Batch-12 settings tabs and the Batch-13 save tools (player-friendly wrapper, not the dev panel).
const SETTINGS_TABS = [
  { id: 'graphics', label: '🖥 Graphics', node: <GraphicsSettingsTab /> },
  { id: 'audio', label: '🔊 Audio', node: <AudioSettingsTab /> },
  { id: 'gameplay', label: '🎮 Gameplay', node: <GameplaySettingsTab /> },
  { id: 'access', label: '♿ Access', node: <AccessibilitySettingsTab /> },
] as const;

export const SystemMenu = () => {
  const open = useSystemMenuStore((s) => s.open);
  const view = useSystemMenuStore((s) => s.view);
  const setView = useSystemMenuStore((s) => s.setView);
  const closeMenu = useSystemMenuStore((s) => s.closeMenu);
  const [tab, setTab] = useState<typeof SETTINGS_TABS[number]['id']>('graphics');

  if (!open) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
      <div className="w-[min(92vw,28rem)] rounded-2xl border border-slate-700 bg-slate-900/95 p-4 text-slate-100 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-lg font-bold">{view === 'root' ? '⏸ Paused' : view === 'settings' ? '⚙ Settings' : '💾 Save'}</span>
          <button onClick={closeMenu} className="rounded-lg bg-slate-800 px-3 py-1 text-sm hover:bg-slate-700">Resume ▶</button>
        </div>

        {view === 'root' && (
          <div className="flex flex-col gap-2 text-sm">
            <MenuBtn label="▶ Resume" onClick={closeMenu} />
            <MenuBtn label="⚙ Settings" onClick={() => setView('settings')} />
            <MenuBtn label="💾 Save / Load" onClick={() => setView('save')} />
            <MenuBtn label="🏠 Abandon → Mission Control" onClick={() => { useGameStore.getState().jumpTo('MISSION_CONTROL'); closeMenu(); }} />
          </div>
        )}

        {view === 'settings' && (
          <div className="text-xs">
            <div className="mb-2 flex gap-1">
              {SETTINGS_TABS.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)} className={`rounded px-2 py-1 text-[11px] ${tab === t.id ? 'bg-sky-700 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{t.label}</button>
              ))}
            </div>
            <div className="max-h-[55vh] overflow-auto pr-1">{SETTINGS_TABS.find((t) => t.id === tab)?.node}</div>
            <BackBtn onClick={() => setView('root')} />
          </div>
        )}

        {view === 'save' && <SaveView onBack={() => setView('root')} />}
      </div>
    </div>
  );
};

const SaveView = ({ onBack }: { onBack: () => void }) => {
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');
  const summary = debugSaveSummary();
  return (
    <div className="text-xs">
      <div className="rounded bg-slate-950/50 p-2 text-[11px] text-slate-300">
        Schema v{summary.schemaVersion} · {summary.missionsCompleted} missions · {summary.charactersUnlocked} characters · {Math.round(summary.playTimeSeconds / 60)} min played · saved {summary.updatedAt.slice(11, 19)}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-1">
        <MenuBtn small label="Save now" onClick={() => setMsg(debugSaveNow() ? 'saved ✓' : 'save failed')} />
        <MenuBtn small label="Export" onClick={() => setText(debugExportSave())} />
        <MenuBtn small label="Import" onClick={() => { const r = debugImportSave(text); setMsg(r.ok ? 'imported ✓' : `failed: ${r.errors[0] ?? '?'}`); }} />
      </div>
      {msg && <div className="mt-1 text-emerald-300">{msg}</div>}
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Export shows your save JSON here · paste a save then Import" className="mt-2 h-28 w-full resize-none rounded bg-slate-950/60 p-2 text-[10px] text-slate-200" />
      <BackBtn onClick={onBack} />
    </div>
  );
};

const MenuBtn = ({ label, onClick, small }: { label: string; onClick: () => void; small?: boolean }) => (
  <button onClick={onClick} className={`rounded-lg bg-slate-800 text-left text-slate-100 hover:bg-slate-700 ${small ? 'px-2 py-1 text-[10px]' : 'px-3 py-2'}`}>{label}</button>
);
const BackBtn = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="mt-2 rounded-lg bg-slate-800 px-3 py-1 text-[11px] text-slate-300 hover:bg-slate-700">← Back</button>
);
