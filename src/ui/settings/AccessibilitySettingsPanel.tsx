import { useSettingsStore } from '../../stores/useSettingsStore';
import { AccessibilitySettingsTab } from './AccessibilitySettingsTab';
import { Toggle } from './settingsShared';

export const AccessibilitySettingsPanel = () => {
  const settings = useSettingsStore();
  return (
    <div className="space-y-3 text-xs">
      <div className="rounded border border-slate-700 bg-slate-950/35 p-2">
        <div className="mb-1 text-[10px] font-bold uppercase text-sky-300">Demo Accessibility</div>
        <Toggle label="Reduce flashing" checked={settings.reduceFlashing} onChange={(v) => settings.updateSettings({ reduceFlashing: v })} />
        <Toggle label="Larger UI text" checked={settings.largerUiText} onChange={(v) => settings.updateSettings({ largerUiText: v })} />
        <Toggle label="High contrast objective marker" checked={settings.highContrastObjectiveMarker} onChange={(v) => settings.updateSettings({ highContrastObjectiveMarker: v })} />
        <Toggle label="Damage numbers off" checked={settings.damageNumbers === 'off'} onChange={(v) => settings.updateSettings({ damageNumbers: v ? 'off' : 'minimal' })} />
      </div>
      <AccessibilitySettingsTab />
    </div>
  );
};
