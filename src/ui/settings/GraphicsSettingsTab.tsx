import { useGraphicsSettingsStore, CULL_RADIUS_MIN, CULL_RADIUS_MAX } from '../../stores/graphicsSettingsStore';
import { QUALITY_TIERS } from '../../types/game/quality';
import { effectiveQualityPreset } from '../../game/performance/QualityPresetController';
import { Toggle, Slider, Choice } from './settingsShared';

// Batch 12 — Graphics settings. Quality tier maps the renderer level; individual toggles write the custom
// preset patch (switching the tier to 'custom'), so everything stays single-sourced in graphicsSettingsStore.
export const GraphicsSettingsTab = () => {
  const tier = useGraphicsSettingsStore((s) => s.tier);
  const custom = useGraphicsSettingsStore((s) => s.customPreset);
  const auto = useGraphicsSettingsStore((s) => s.auto);
  const showPerfHud = useGraphicsSettingsStore((s) => s.showPerfHud);
  const cullEnabled = useGraphicsSettingsStore((s) => s.cullEnabled);
  const cullRadius = useGraphicsSettingsStore((s) => s.cullRadius);
  void custom; // re-render when the custom patch changes
  const g = useGraphicsSettingsStore.getState();
  const p = effectiveQualityPreset();

  return (
    <div className="space-y-1 text-xs">
      <Choice label="Quality preset" value={tier} options={QUALITY_TIERS} onChange={(v) => g.setTier(v)} />
      <Toggle label="Shadows" checked={p.shadowsEnabled} onChange={(v) => g.setCustomPreset({ shadowsEnabled: v })} />
      <Toggle label="Post-processing" checked={p.postprocessingEnabled} onChange={(v) => g.setCustomPreset({ postprocessingEnabled: v })} />
      <Toggle label="Bloom" checked={p.bloomEnabled} onChange={(v) => g.setCustomPreset({ bloomEnabled: v })} />
      <Toggle label="Color grading" checked={p.colorGradingEnabled} onChange={(v) => g.setCustomPreset({ colorGradingEnabled: v })} />
      <Toggle label="Speed lines" checked={p.speedLinesEnabled} onChange={(v) => g.setCustomPreset({ speedLinesEnabled: v })} />
      <Toggle label="Air distortion" checked={p.airDistortionEnabled} onChange={(v) => g.setCustomPreset({ airDistortionEnabled: v })} />
      <Choice label="Particles" value={p.particleQuality} options={['off', 'low', 'medium', 'high'] as const} onChange={(v) => g.setCustomPreset({ particleQuality: v })} />
      <Choice label="Clouds" value={p.cloudQuality} options={['low', 'medium', 'high'] as const} onChange={(v) => g.setCustomPreset({ cloudQuality: v })} />
      <Choice label="Weather" value={p.weatherQuality} options={['off', 'low', 'medium', 'high'] as const} onChange={(v) => g.setCustomPreset({ weatherQuality: v })} />
      <div className="mt-1 border-t border-slate-700/60 pt-1" />
      <Toggle label="Auto-adapt when FPS drops" checked={auto} onChange={(v) => g.setAuto(v)} />
      <Toggle label="Show performance HUD" checked={showPerfHud} onChange={() => g.togglePerfHud()} />
      <Toggle label="Distance culling" checked={cullEnabled} onChange={(v) => g.setCullEnabled(v)} />
      <Slider label="Render distance" value={cullRadius} min={CULL_RADIUS_MIN} max={CULL_RADIUS_MAX} step={5} disabled={!cullEnabled} onChange={(v) => g.setCullRadius(v)} />
      <div className="pt-0.5 text-[10px] text-slate-500">Target FPS interface: {p.targetFps ?? '—'} · renderer level: {p.renderLevel}</div>
    </div>
  );
};
