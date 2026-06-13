import { useEditorFlightStore } from '../../../stores/game/editorFlightStore';
import type { FlightTuning } from '../../../types/game/flightControl';
import { Field, inp, lbl } from '../editorShared';
import { PathNodesEditor } from './worldTools/PathNodesEditor';
import { FlightPreviewPanel } from './FlightPreviewPanel';
import { FLIGHT_PATH_ID } from '../../../data/game/flightPath';

// 🛩 Flight — live-editable flight handling. Takes effect immediately so the feel can be tuned without
// code (per-character flightSpeed/agility further scale speed/turn at runtime).
type NumKey = { [K in keyof FlightTuning]-?: NonNullable<FlightTuning[K]> extends number ? K : never }[keyof FlightTuning];
const FIELDS: { key: NumKey; label: string; step: number }[] = [
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
  { key: 'worldMagnetRadius', label: 'Pickup magnet radius', step: 1 },
  { key: 'comboWindowSec', label: 'Combo window (s)', step: 0.5 },
  { key: 'boostSpeedMul', label: 'Boost speed ×', step: 0.1 },
  { key: 'boostDurationSec', label: 'Boost duration (s)', step: 0.5 },
  { key: 'goldenChance', label: 'Golden pickup chance', step: 0.05 },
  { key: 'goldenMultiplier', label: 'Golden reward ×', step: 1 },
  { key: 'worldCraftYawDeg', label: 'Craft yaw (deg)', step: 90 },
  { key: 'worldSteerSpeed', label: 'Steer speed (hold A/D)', step: 5 },
  { key: 'worldVertSpeed', label: 'Climb speed (hold Spc/Shift)', step: 5 },
  { key: 'worldCloudScale', label: 'Cloud size ×', step: 0.25 },
  { key: 'worldFlightDurationSec', label: 'Flight time (sec)', step: 5 },
  { key: 'launchDurationSec', label: 'Launch sprint (sec)', step: 0.5 },
  { key: 'launchTunnelLength', label: 'Launch tunnel length', step: 4 },
  { key: 'worldCraftScale', label: 'World craft size ×', step: 0.1 },
  { key: 'flyAroundCraftScale', label: 'Base-loop craft size ×', step: 0.1 },
  { key: 'flyAroundCraftYawDeg', label: 'Base-loop craft yaw (deg)', step: 15 },
  { key: 'worldSteerRange', label: 'Steer max range (A/D)', step: 10 },
  { key: 'worldVertRange', label: 'Vertical max range (↑/↓)', step: 10 },
  { key: 'worldSteerSmooth', label: 'Bank smoothing', step: 0.5 },
  { key: 'worldBankDeg', label: 'Bank angle (deg)', step: 5 },
];

// 🎥 Flight cameras — the per-leg follow camera, pulled out of the big list so it's findable. Distance /
// height / orbit-angle per leg; or drag it in 3D via Flight Preview → 🎮 Camera gizmo.
const CameraPanel = () => {
  const tuning = useEditorFlightStore((s) => s.tuning);
  const update = useEditorFlightStore((s) => s.update);
  const row = (label: string, key: NumKey, step = 0.25) => (
    <Field label={label}><input type="number" step={step} value={tuning[key]} onChange={(e) => update({ [key]: parseFloat(e.target.value) || 0 } as Partial<FlightTuning>)} className={inp} /></Field>
  );
  return (
    <div className="rounded border border-violet-700/40 bg-violet-950/10 p-2">
      <div className={lbl}>🎥 Flight cameras</div>
      <p className="mt-0.5 text-[10px] text-slate-500">Per-leg follow camera. Or drag it in 3D: Flight Preview → 🎮 Camera gizmo (scrub/pause, then drag).</p>
      <div className="mt-1 grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="text-[11px] font-semibold text-sky-200">World flight</div>
          {row('Distance', 'worldCamDistance')}{row('Height', 'worldCamHeight')}{row('Orbit angle°', 'worldCamAngleDeg', 5)}
        </div>
        <div className="space-y-1">
          <div className="text-[11px] font-semibold text-sky-200">Base fly-around</div>
          {row('Distance', 'flyAroundCamDistance')}{row('Height', 'flyAroundCamHeight')}{row('Orbit angle°', 'flyAroundCamAngleDeg', 5)}
        </div>
      </div>
    </div>
  );
};

export const FlightEditorTab = () => {
  const tuning = useEditorFlightStore((s) => s.tuning);
  const update = useEditorFlightStore((s) => s.update);
  const reset = useEditorFlightStore((s) => s.reset);
  return (
    <div className="space-y-2 text-xs">
      <CameraPanel />
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
      <Field label="World craft offset from route start (x / y / z) — gizmo-draggable in WORLD_FLIGHT edit">
        <div className="flex gap-1">
          {([0, 1, 2] as const).map((a) => (
            <input
              key={a}
              type="number"
              step={0.5}
              value={tuning.worldCraftOffset[a]}
              onChange={(e) => {
                const next = [...tuning.worldCraftOffset] as [number, number, number];
                next[a] = parseFloat(e.target.value) || 0;
                update({ worldCraftOffset: next });
              }}
              className={inp + ' w-0 flex-1 text-center'}
            />
          ))}
        </div>
      </Field>
      <Field label="Base-loop craft offset from path start (x / y / z) — gizmo-draggable in BASE_FLY_AROUND edit">
        <div className="flex gap-1">
          {([0, 1, 2] as const).map((a) => (
            <input
              key={a}
              type="number"
              step={0.5}
              value={tuning.flyAroundCraftOffset[a]}
              onChange={(e) => {
                const next = [...tuning.flyAroundCraftOffset] as [number, number, number];
                next[a] = parseFloat(e.target.value) || 0;
                update({ flyAroundCraftOffset: next });
              }}
              className={inp + ' w-0 flex-1 text-center'}
            />
          ))}
        </div>
      </Field>
      <p className="text-[10px] text-slate-500">Live. Character flightSpeed/agility scale speed/turn on top of these. The craft is selectable in WORLD/BASE flight Edit Mode (gizmo → facing/scale/offset).</p>

      <FlightPreviewPanel />

      <div className={lbl}>Base fly-around loop — path nodes</div>
      <p className="text-[10px] text-slate-500">Drag the nodes in 3D (BASE_FLY_AROUND edit) — per-node Speed× / Bank° shape the loop. The world route nodes live in 🛫 Aero World.</p>
      <PathNodesEditor pathId={FLIGHT_PATH_ID} editPhase="BASE_FLY_AROUND" />
    </div>
  );
};
