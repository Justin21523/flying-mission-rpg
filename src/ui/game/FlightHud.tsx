import { usePoll } from '../usePoll';
import { useGameStore } from '../../stores/game/useGameStore';
import { useFlightRuntimeStore } from '../../stores/game/flightRuntimeStore';
import { getFlightTuning } from '../../stores/game/editorFlightStore';
import { getNavpoints } from '../../stores/game/editorExteriorStore';
import { flightHandle } from '../../game/flight/flightHandle';
import { playUiSound } from '../../game/audio/uiSound';

// Flight HUD: speed/altitude/throttle, mode + comfort toggles, navpoint guidance, launch notices, and a
// speed overlay at high velocity. Polls flightHandle (no per-frame re-render).
export const FlightHud = () => {
  usePoll(100);
  const phase = useGameStore((s) => s.phase);
  const mode = useFlightRuntimeStore((s) => s.mode);
  const comfort = useFlightRuntimeStore((s) => s.comfort);
  const navIndex = useFlightRuntimeStore((s) => s.navIndex);

  const tuning = getFlightTuning();
  const speed = flightHandle.speed;
  const alt = flightHandle.altitude;
  const speedPct = Math.min(1, speed / Math.max(1, tuning.maxSpeed));

  const nav = getNavpoints();
  const target = nav[navIndex];
  const navDist = target
    ? Math.round(Math.hypot(flightHandle.pos.x - target.position[0], flightHandle.pos.y - target.position[1], flightHandle.pos.z - target.position[2]))
    : null;

  const fast = speedPct > 0.6;

  return (
    <>
      {/* forward speed vignette at high velocity */}
      {fast && (
        <div
          className="pointer-events-none fixed inset-0 z-[55]"
          style={{ background: `radial-gradient(ellipse at center, rgba(0,0,0,0) ${70 - speedPct * 25}%, rgba(0,0,0,${0.18 + speedPct * 0.25}) 100%)` }}
        />
      )}

      <div className="pointer-events-none fixed left-3 top-3 z-[60] w-52 rounded-xl border border-sky-800/50 bg-slate-950/75 p-3 text-xs text-slate-200 backdrop-blur">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="font-bold text-sky-200">FLIGHT</span>
          <span className="font-mono text-[10px] text-slate-500">{phase}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Speed</span>
          <span className="tabular-nums">{Math.round(speed)}</span>
        </div>
        <div className="my-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-sky-400" style={{ width: `${speedPct * 100}%` }} />
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Altitude</span>
          <span className="tabular-nums">{Math.round(alt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Throttle</span>
          <span className="tabular-nums">{flightHandle.throttle > 0 ? '▲' : flightHandle.throttle < 0 ? '▼ brake' : '—'}</span>
        </div>
        {navDist !== null && (
          <div className="mt-1 text-[11px] text-amber-200">→ {target?.label ?? 'navpoint'} · {navDist}m</div>
        )}
      </div>

      {/* mode / comfort toggles */}
      <div className="pointer-events-auto fixed right-3 top-3 z-[60] flex gap-1.5">
        <button
          onClick={() => {
            playUiSound('select');
            useFlightRuntimeStore.getState().setMode(mode === 'simple' ? 'advanced' : 'simple');
          }}
          className="rounded-lg border border-slate-600/60 bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-800"
        >
          Mode: {mode}
        </button>
        <button
          onClick={() => {
            playUiSound('select');
            useFlightRuntimeStore.getState().toggleComfort();
          }}
          className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${comfort ? 'border-emerald-600/50 bg-emerald-700/25 text-emerald-100' : 'border-slate-600/60 bg-slate-900/80 text-slate-200 hover:bg-slate-800'}`}
        >
          Comfort {comfort ? 'on' : 'off'}
        </button>
      </div>

      {/* bottom prompts */}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex flex-col items-center gap-1.5">
        {phase === 'LAUNCH_TUNNEL' && (
          <div className="rounded-full bg-slate-950/85 px-5 py-2 text-base font-bold text-amber-200 backdrop-blur">Launching…</div>
        )}
        {phase === 'BASE_FLY_AROUND' && (
          <div className="rounded-full bg-slate-950/80 px-4 py-1.5 text-xs text-slate-200 backdrop-blur">
            Fly around the base — follow the glowing navpoints
          </div>
        )}
        {phase === 'CLOUD_ASCENT' && (
          <div className="rounded-full bg-slate-950/80 px-4 py-1.5 text-xs text-slate-200 backdrop-blur">
            Climb the navpoints to the Sky Gate — World Flight arrives in Batch 5
          </div>
        )}
        <div className="rounded-full bg-slate-950/60 px-3 py-1 text-[10px] text-slate-400 backdrop-blur">
          W throttle · S brake · A/D turn · ↑/↓ climb/dive{mode === 'advanced' ? ' · Q/E roll' : ''}
        </div>
      </div>
    </>
  );
};
