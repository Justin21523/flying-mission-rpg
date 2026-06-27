import { useSettingsStore } from '../../stores/useSettingsStore';
import { GraphicsSettingsTab } from './GraphicsSettingsTab';
import { Choice, Slider, Toggle } from './settingsShared';

export const GraphicsSettingsPanel = () => {
  const settings = useSettingsStore();
  return (
    <div className="space-y-3 text-xs">
      <div className="rounded border border-slate-700 bg-slate-950/35 p-2">
        <div className="mb-1 text-[10px] font-bold uppercase text-sky-300">Demo Graphics</div>
        <Slider label="Render scale" value={settings.renderScale} min={0.6} max={1.25} step={0.05} onChange={(v) => settings.updateSettings({ renderScale: v })} />
        <Toggle label="Shadows" checked={settings.shadows} onChange={(v) => settings.updateSettings({ shadows: v })} />
        <Toggle label="Postprocessing" checked={settings.postprocessing} onChange={(v) => settings.updateSettings({ postprocessing: v })} />
        <Choice label="Fog quality" value={settings.fogQuality} options={['low', 'medium', 'high'] as const} onChange={(v) => settings.updateSettings({ fogQuality: v })} />
      </div>
      <GraphicsSettingsTab />
    </div>
  );
};
