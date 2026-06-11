import { useEditorFlightStore } from '../../../stores/game/editorFlightStore';
import type { FlightTuning } from '../../../types/game/flightControl';
import { Field, inp, lbl } from '../editorShared';

// 🛩 Flight — live-editable flight handling. Takes effect immediately so the feel can be tuned without
// code (per-character flightSpeed/agility further scale speed/turn at runtime).
const FIELDS: { key: keyof FlightTuning; label: string; step: number }[] = [
  { key: 'maxSpeed', label: 'Max speed', step: 1 },
  { key: 'cruiseSpeed', label: 'Cruise speed', step: 1 },
  { key: 'stallSpeed', label: 'Stall speed', step: 1 },
  { key: 'throttleAccel', label: 'Throttle accel', step: 1 },
  { key: 'brakeDecel', label: 'Brake decel', step: 1 },
  { key: 'pitchRate', label: 'Pitch rate', step: 0.1 },
  { key: 'yawRate', label: 'Yaw rate', step: 0.1 },
  { key: 'rollRate', label: 'Roll rate', step: 0.1 },
  { key: 'turnSmooth', label: 'Turn smoothing', step: 0.5 },
  { key: 'autoLevel', label: 'Auto-level', step: 0.1 },
  { key: 'fovBase', label: 'FOV base', step: 1 },
  { key: 'fovMax', label: 'FOV max', step: 1 },
  { key: 'camDistance', label: 'Cam distance', step: 0.5 },
  { key: 'camHeight', label: 'Cam height', step: 0.5 },
  { key: 'camPullback', label: 'Cam pullback', step: 0.5 },
  { key: 'rollFollow', label: 'Cam roll follow', step: 0.05 },
  { key: 'boundaryRadius', label: 'Boundary radius', step: 10 },
  { key: 'worldCloudCount', label: 'World cloud count', step: 5 },
  { key: 'worldEventMaxActive', label: 'World event max', step: 1 },
  { key: 'worldEventSpawnGap', label: 'World event gap (s)', step: 0.2 },
  { key: 'worldCraftYawDeg', label: 'Craft yaw (deg)', step: 90 },
  { key: 'worldSteerSpeed', label: 'Steer speed (hold A/D)', step: 5 },
  { key: 'worldVertSpeed', label: 'Climb speed (hold Spc/Shift)', step: 5 },
  { key: 'worldCloudScale', label: 'Cloud size ×', step: 0.25 },
  { key: 'worldFlightDurationSec', label: 'Flight time (sec)', step: 5 },
  { key: 'launchDurationSec', label: 'Launch sprint (sec)', step: 0.5 },
  { key: 'launchTunnelLength', label: 'Launch tunnel length', step: 4 },
  { key: 'worldCraftScale', label: 'Craft size × (flight)', step: 0.1 },
  { key: 'worldCamDistance', label: 'World-flight cam distance', step: 0.25 },
  { key: 'worldCamHeight', label: 'World-flight cam height', step: 0.25 },
  { key: 'worldSteerRange', label: 'Steer max range (A/D)', step: 10 },
  { key: 'worldVertRange', label: 'Vertical max range (↑/↓)', step: 10 },
  { key: 'worldSteerSmooth', label: 'Bank smoothing', step: 0.5 },
  { key: 'worldBankDeg', label: 'Bank angle (deg)', step: 5 },
];

export const FlightEditorTab = () => {
  const tuning = useEditorFlightStore((s) => s.tuning);
  const update = useEditorFlightStore((s) => s.update);
  const reset = useEditorFlightStore((s) => s.reset);
  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <div className={lbl}>Flight Tuning</div>
        <button onClick={reset} className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700">↺ Reset</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {FIELDS.map((f) => (
          <Field key={f.key} label={f.label}>
            <input
              type="number"
              step={f.step}
              value={tuning[f.key]}
              onChange={(e) => update({ [f.key]: parseFloat(e.target.value) || 0 } as Partial<FlightTuning>)}
              className={inp}
            />
          </Field>
        ))}
      </div>
      <p className="text-[10px] text-slate-500">Live. Character flightSpeed/agility scale speed/turn on top of these.</p>
    </div>
  );
};
