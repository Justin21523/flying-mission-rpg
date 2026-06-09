import { useGraphicsSettingsStore, CULL_RADIUS_MIN, CULL_RADIUS_MAX } from '../../stores/graphicsSettingsStore';
import { QUALITY_LEVELS } from '../../game/render/renderSettings';
import { PanelCard, closePanel } from './playShared';

// Kit — play-mode ⚙ Settings: graphics quality ceiling, auto-adapt toggle, on-screen perf HUD, render distance.
export const SettingsPanel = () => {
  const quality = useGraphicsSettingsStore((s) => s.quality);
  const auto = useGraphicsSettingsStore((s) => s.auto);
  const showPerfHud = useGraphicsSettingsStore((s) => s.showPerfHud);
  const cullEnabled = useGraphicsSettingsStore((s) => s.cullEnabled);
  const cullRadius = useGraphicsSettingsStore((s) => s.cullRadius);
  return (
    <PanelCard title="Settings" icon="⚙" onClose={closePanel} width="20rem">
      <div className="space-y-2 text-xs">
        <label className="flex flex-col gap-1">
          <span className="text-slate-400">Graphics quality</span>
          <select value={quality} onChange={(e) => useGraphicsSettingsStore.getState().setQuality(e.target.value as typeof quality)} className="rounded bg-slate-800 px-2 py-1 text-slate-100">
            {QUALITY_LEVELS.map((q) => <option key={q} value={q}>{q}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-slate-300"><input type="checkbox" checked={auto} onChange={(e) => useGraphicsSettingsStore.getState().setAuto(e.target.checked)} className="accent-cyan-500" /> Auto-adapt quality when FPS drops</label>
        <label className="flex items-center gap-2 text-slate-300"><input type="checkbox" checked={showPerfHud} onChange={() => useGraphicsSettingsStore.getState().togglePerfHud()} className="accent-cyan-500" /> Show performance HUD</label>
        <div className="mt-1 border-t border-slate-700/60 pt-2">
          <label className="flex items-center gap-2 text-slate-300"><input type="checkbox" checked={cullEnabled} onChange={(e) => useGraphicsSettingsStore.getState().setCullEnabled(e.target.checked)} className="accent-cyan-500" /> Distance culling (hide far objects)</label>
          <label className="mt-1 flex flex-col gap-1">
            <span className="text-slate-400">Render distance: {Math.round(cullRadius)}</span>
            <input type="range" min={CULL_RADIUS_MIN} max={CULL_RADIUS_MAX} step={5} value={cullRadius} disabled={!cullEnabled} onChange={(e) => useGraphicsSettingsStore.getState().setCullRadius(parseFloat(e.target.value))} className="accent-cyan-500 disabled:opacity-40" />
          </label>
        </div>
      </div>
    </PanelCard>
  );
};
