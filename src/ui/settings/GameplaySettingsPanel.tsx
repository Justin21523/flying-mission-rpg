import { useSettingsStore } from '../../stores/useSettingsStore';
import { GameplaySettingsTab } from './GameplaySettingsTab';
import { Slider, Toggle } from './settingsShared';

export const GameplaySettingsPanel = () => {
  const settings = useSettingsStore();
  return (
    <div className="space-y-3 text-xs">
      <div className="rounded border border-slate-700 bg-slate-950/35 p-2">
        <div className="mb-1 text-[10px] font-bold uppercase text-sky-300">Demo Gameplay</div>
        <Toggle label="Guided hints" checked={settings.guidedHints} onChange={(v) => settings.updateSettings({ guidedHints: v })} />
        <Toggle label="Auto target assist" checked={settings.autoTargetAssist} onChange={(v) => settings.updateSettings({ autoTargetAssist: v })} />
        <Toggle label="Objective markers" checked={settings.objectiveMarkers} onChange={(v) => settings.updateSettings({ objectiveMarkers: v })} />
        <Toggle label="Simplified controls" checked={settings.simplifiedControls} onChange={(v) => settings.updateSettings({ simplifiedControls: v })} />
        <Slider label="Camera sensitivity" value={settings.cameraSensitivity} min={0.5} max={1.5} step={0.05} onChange={(v) => settings.updateSettings({ cameraSensitivity: v })} />
      </div>
      <GameplaySettingsTab />
    </div>
  );
};
