import { useFlightPreviewStore, flightPreviewHandle } from '../../../stores/game/flightPreviewStore';
import { useEditorFlightStore } from '../../../stores/game/editorFlightStore';
import { useEditorRouteStore } from '../../../stores/game/editorRouteStore';
import { useGameStore } from '../../../stores/game/useGameStore';
import { useWorldFlightEditorStore } from '../../../stores/game/worldFlightEditorStore';
import { usePoll } from '../../usePoll';
import { Field, inp, lbl, Check } from '../editorShared';
import { FlightCuesEditor } from './FlightCuesEditor';
import { FlightRouteNodeTimeline } from './FlightRouteNodeTimeline';
import { findFlightTimeTrack, removeFlightTimeKeyframeAt, removeFlightTimeTrack } from '../../../game/flight/flightTimeTracks';
import type { FlightTimelineTarget, FlightTimelineTrack } from '../../../types/game/flightTimeline';

// 🛩 Flight → Flight Preview — a transformation-style timeline for the flight legs. Drives a preview craft
// along the CURRENT flight scene's path (BASE_FLY_AROUND loop or WORLD_FLIGHT route) by progress u∈[0,1].
// Edit-only; play unchanged. Jump to a flight phase (Game State) first so the matching scene is mounted.
export const FlightPreviewPanel = () => {
  usePoll(120);
  const u = useFlightPreviewStore((s) => s.u);
  const playing = useFlightPreviewStore((s) => s.playing);
  const rangeEnd = useFlightPreviewStore((s) => s.rangeEnd);
  const speed = useFlightPreviewStore((s) => s.speed);
  const follow = useFlightPreviewStore((s) => s.follow);
  const cameraMode = useFlightPreviewStore((s) => s.cameraMode);
  const camGizmo = useFlightPreviewStore((s) => s.camGizmo);
  const tuning = useEditorFlightStore((s) => s.tuning);
  const routes = useEditorRouteStore((s) => s.items);
  const phase = useGameStore((s) => s.phase);
  const selectedRouteId = useWorldFlightEditorStore((s) => s.selectedRouteId);
  const world = phase === 'WORLD_FLIGHT' || phase === 'RETURN_FLIGHT';
  const selectedRoute = routes.find((route) => route.id === selectedRouteId) ?? routes[0];
  const tracks: readonly FlightTimelineTrack[] | undefined = world ? selectedRoute?.timeTracks : tuning.flyAroundTimeTracks;
  const durationSec = world ? tuning.worldFlightDurationSec : 1 / Math.max(0.01, speed);
  const seconds = u * durationSec;
  const craftTrack = findFlightTimeTrack(tracks, { kind: 'craft' });
  const cameraTrack = findFlightTimeTrack(tracks, { kind: 'camera' });
  const s = useFlightPreviewStore.getState();
  const removeKey = (target: FlightTimelineTarget) => {
    if (world && selectedRoute) {
      useEditorRouteStore.getState().update(selectedRoute.id, { timeTracks: removeFlightTimeKeyframeAt(selectedRoute.timeTracks, target, u) });
      return;
    }
    useEditorFlightStore.getState().update({ flyAroundTimeTracks: removeFlightTimeKeyframeAt(useEditorFlightStore.getState().tuning.flyAroundTimeTracks, target, u) });
  };
  const resetTrack = (target: FlightTimelineTarget) => {
    if (world && selectedRoute) {
      useEditorRouteStore.getState().update(selectedRoute.id, { timeTracks: removeFlightTimeTrack(selectedRoute.timeTracks, target) });
      return;
    }
    useEditorFlightStore.getState().update({ flyAroundTimeTracks: removeFlightTimeTrack(useEditorFlightStore.getState().tuning.flyAroundTimeTracks, target) });
  };
  const playAroundCurrent = () => {
    const start = Math.max(0, u - 0.08);
    s.playRange(start, Math.min(1, start + 0.18));
  };
  const camBtn = (mode: 'flight' | 'orbit') =>
    `rounded px-2 py-1 text-[11px] ${cameraMode === mode ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`;
  return (
    <div className="rounded border border-sky-700/40 bg-sky-950/15 p-2">
      <div className={lbl}>Flight preview (timeline)</div>
      <p className="mt-0.5 text-[10px] text-slate-500">Jump to BASE_FLY_AROUND or WORLD_FLIGHT (Game State), then play/scrub here to debug the route, nodes and craft.</p>
      <div className="mt-1 flex flex-wrap gap-1">
        <button onClick={() => s.play()} className="rounded bg-emerald-700/30 px-2 py-1 text-[11px] text-emerald-100 hover:bg-emerald-700/50">▶ Play</button>
        <button onClick={playAroundCurrent} className="rounded bg-fuchsia-700/30 px-2 py-1 text-[11px] text-fuchsia-100 hover:bg-fuchsia-700/50">Play Range</button>
        <button onClick={() => s.pause()} className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700">⏸ Pause</button>
        <button onClick={() => s.stop()} className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700">⏹ Stop</button>
        <span className="ml-auto self-center font-mono text-[10px] text-slate-400">u {Math.round(u * 100)}% · {seconds.toFixed(1)}s · alt {flightPreviewHandle.altitude.toFixed(0)}{playing ? ` · ▶${rangeEnd !== null ? ` to ${Math.round(rangeEnd * 100)}%` : ''}` : ''}</span>
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
      <div className="rounded border border-slate-800 bg-slate-950/35 p-1.5">
        <div className="mb-1 flex flex-wrap items-center gap-1">
          <span className={lbl}>Current-time keys</span>
          <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-300">{world ? 'world route' : 'base loop'}</span>
          <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-300">{seconds.toFixed(2)}s</span>
        </div>
        <div className="flex flex-wrap gap-1">
          <span className={`rounded px-2 py-0.5 text-[10px] ${craftTrack ? 'bg-emerald-950/40 text-emerald-200' : 'bg-slate-900 text-slate-400'}`}>craft {craftTrack?.keyframes.length ?? 0}</span>
          <button onClick={() => removeKey({ kind: 'craft' })} disabled={!craftTrack} className="rounded bg-amber-700/25 px-2 py-0.5 text-[10px] text-amber-100 hover:bg-amber-700/40 disabled:opacity-40">Delete Craft Key</button>
          <button onClick={() => resetTrack({ kind: 'craft' })} disabled={!craftTrack} className="rounded bg-rose-700/20 px-2 py-0.5 text-[10px] text-rose-200 hover:bg-rose-700/35 disabled:opacity-40">Reset Craft Track</button>
          <span className={`rounded px-2 py-0.5 text-[10px] ${cameraTrack ? 'bg-emerald-950/40 text-emerald-200' : 'bg-slate-900 text-slate-400'}`}>camera {cameraTrack?.keyframes.length ?? 0}</span>
          <button onClick={() => removeKey({ kind: 'camera' })} disabled={!cameraTrack} className="rounded bg-amber-700/25 px-2 py-0.5 text-[10px] text-amber-100 hover:bg-amber-700/40 disabled:opacity-40">Delete Camera Key</button>
          <button onClick={() => resetTrack({ kind: 'camera' })} disabled={!cameraTrack} className="rounded bg-rose-700/20 px-2 py-0.5 text-[10px] text-rose-200 hover:bg-rose-700/35 disabled:opacity-40">Reset Camera Track</button>
        </div>
      </div>
      <FlightRouteNodeTimeline />
      <FlightCuesEditor />
    </div>
  );
};
