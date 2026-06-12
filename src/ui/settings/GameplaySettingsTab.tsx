import { useFlightRuntimeStore } from '../../stores/game/flightRuntimeStore';
import { useGraphicsSettingsStore } from '../../stores/graphicsSettingsStore';
import { effectiveQualityPreset } from '../../game/performance/QualityPresetController';
import { Toggle, Choice } from './settingsShared';
import type { FlightMode } from '../../types/game/flightControl';

// Batch 12 — Gameplay settings. Flight control mode + camera comfort live in the flight runtime store;
// dynamic FOV / camera shake are quality-preset knobs (written to the custom patch). Transform-mode
// preference & auto-skip are deferred (DEFERRED_WORK) — they are chosen at dispatch time today.
export const GameplaySettingsTab = () => {
  const mode = useFlightRuntimeStore((s) => s.mode);
  const comfort = useFlightRuntimeStore((s) => s.comfort);
  const custom = useGraphicsSettingsStore((s) => s.customPreset);
  void custom;
  const g = useGraphicsSettingsStore.getState();
  const p = effectiveQualityPreset();

  return (
    <div className="space-y-1 text-xs">
      <Choice<FlightMode> label="Flight control mode" value={mode} options={['simple', 'advanced']} onChange={(v) => useFlightRuntimeStore.getState().setMode(v)} />
      <Toggle label="Camera comfort mode (less roll)" checked={comfort} onChange={() => useFlightRuntimeStore.getState().toggleComfort()} />
      <Toggle label="Dynamic FOV (speed widens view)" checked={p.dynamicFovEnabled} onChange={(v) => g.setCustomPreset({ dynamicFovEnabled: v })} />
      <Toggle label="Camera shake" checked={p.cameraShakeEnabled} onChange={(v) => g.setCustomPreset({ cameraShakeEnabled: v })} />
    </div>
  );
};
