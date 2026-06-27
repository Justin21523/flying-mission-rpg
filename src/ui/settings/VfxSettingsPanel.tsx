import { useSettingsStore } from '../../stores/useSettingsStore';
import { Choice, Toggle } from './settingsShared';

export const VfxSettingsPanel = () => {
  const settings = useSettingsStore();
  return (
    <div className="space-y-1 text-xs">
      <Choice label="VFX intensity" value={settings.vfxIntensity} options={['low', 'medium', 'high', 'cinematic'] as const} onChange={(v) => settings.updateSettings({ vfxIntensity: v })} />
      <Choice label="Screen shake" value={settings.screenShake} options={['off', 'low', 'medium', 'high'] as const} onChange={(v) => settings.updateSettings({ screenShake: v })} />
      <Toggle label="Hit stop" checked={settings.hitStop} onChange={(v) => settings.updateSettings({ hitStop: v })} />
      <Choice label="Damage numbers" value={settings.damageNumbers} options={['off', 'minimal', 'full'] as const} onChange={(v) => settings.updateSettings({ damageNumbers: v })} />
      <Choice label="Particle density" value={settings.particleDensity} options={['low', 'medium', 'high'] as const} onChange={(v) => settings.updateSettings({ particleDensity: v })} />
      <Choice label="Physics debris" value={settings.physicsDebris} options={['off', 'low', 'medium', 'high'] as const} onChange={(v) => settings.updateSettings({ physicsDebris: v })} />
      <Toggle label="Camera effects" checked={settings.cameraEffects} onChange={(v) => settings.updateSettings({ cameraEffects: v })} />
    </div>
  );
};
