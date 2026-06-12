import { useFlightPreviewStore, flightPreviewHandle } from '../../../stores/game/flightPreviewStore';
import { usePoll } from '../../usePoll';
import { Field, inp, lbl, Check } from '../editorShared';
import { FlightCuesEditor } from './FlightCuesEditor';
import { FlightRouteNodeTimeline } from './FlightRouteNodeTimeline';

// 🛩 Flight → Flight Preview — a transformation-style timeline for the flight legs. Drives a preview craft
// along the CURRENT flight scene's path (BASE_FLY_AROUND loop or WORLD_FLIGHT route) by progress u∈[0,1].
// Edit-only; play unchanged. Jump to a flight phase (Game State) first so the matching scene is mounted.
export const FlightPreviewPanel = () => {
  usePoll(120);
  const u = useFlightPreviewStore((s) => s.u);
  const playing = useFlightPreviewStore((s) => s.playing);
  const speed = useFlightPreviewStore((s) => s.speed);
  const follow = useFlightPreviewStore((s) => s.follow);
  const cameraMode = useFlightPreviewStore((s) => s.cameraMode);
  const camGizmo = useFlightPreviewStore((s) => s.camGizmo);
  const s = useFlightPreviewStore.getState();
  const camBtn = (mode: 'flight' | 'orbit') =>
    `rounded px-2 py-1 text-[11px] ${cameraMode === mode ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`;
  return (
    <div className="rounded border border-sky-700/40 bg-sky-950/15 p-2">
      <div className={lbl}>Flight preview (timeline)</div>
      <p className="mt-0.5 text-[10px] text-slate-500">Jump to BASE_FLY_AROUND or WORLD_FLIGHT (Game State), then play/scrub here to debug the route, nodes and craft.</p>
      <div className="mt-1 flex flex-wrap gap-1">
        <button onClick={() => s.play()} className="rounded bg-emerald-700/30 px-2 py-1 text-[11px] text-emerald-100 hover:bg-emerald-700/50">▶ Play</button>
        <button onClick={() => s.pause()} className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700">⏸ Pause</button>
        <button onClick={() => s.stop()} className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700">⏹ Stop</button>
        <span className="ml-auto self-center font-mono text-[10px] text-slate-400">u {Math.round(u * 100)}% · alt {flightPreviewHandle.altitude.toFixed(0)}{playing ? ' · ▶' : ''}</span>
      </div>
      <Field label="Scrub (u 0..1)">
        <input type="range" min={0} max={1} step={0.005} value={u} onChange={(e) => s.scrub(parseFloat(e.target.value))} className="w-full" />
      </Field>
      <Field label="Camera">
        <div className="flex gap-1">
          <button onClick={() => s.setCameraMode('flight')} className={camBtn('flight')}>🎥 Flight</button>
          <button onClick={() => s.setCameraMode('orbit')} className={camBtn('orbit')}>🛰 Orbit (free-look)</button>
        </div>
      </Field>
      <p className="-mt-0.5 text-[10px] text-slate-500">{cameraMode === 'flight' ? 'Flight: adjusting 🛩 cam distance/height/angle + craft scale shows live here.' : 'Orbit: free-look; drag to inspect from any angle.'}</p>
      <Check label="🎮 Camera gizmo (drag the camera in 3D — scrub/pause first)" checked={camGizmo} onChange={() => s.toggleCamGizmo()} />
      <div className="grid grid-cols-2 items-end gap-2">
        <Field label="Speed (u/sec)"><input type="number" step={0.02} min={0.01} value={speed} onChange={(e) => s.setSpeed(parseFloat(e.target.value) || 0.12)} className={inp} /></Field>
        <Check label="Follow craft (orbit rides along)" checked={follow} onChange={() => s.toggleFollow()} />
      </div>
      <FlightRouteNodeTimeline />
      <FlightCuesEditor />
    </div>
  );
};
