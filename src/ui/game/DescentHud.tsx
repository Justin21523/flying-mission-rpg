import { usePoll } from '../usePoll';
import { robotHandle } from '../../game/destination/robotHandle';
import { getDestinationParts } from '../../stores/game/editorDestinationStore';
import { useDestinationRuntimeStore } from '../../stores/game/destinationRuntimeStore';
import { zoneAt, type LandingZoneInput } from '../../game/destination/safeLanding';

// DESCENT HUD — altitude / speeds / nearest landing zone / over-zone indicator / thrusters, plus the last
// landing evaluation when a touchdown was rejected (recoverable, reasons listed). Polls robotHandle.
export const DescentHud = () => {
  usePoll(100);
  const evaluation = useDestinationRuntimeStore((s) => s.evaluation);
  const zones: LandingZoneInput[] = getDestinationParts()
    .filter((p) => p.enabled && (p.kind === 'landing_zone' || p.kind === 'safe_zone'))
    .map((p) => ({ id: p.id, x: p.position[0], z: p.position[2], radius: p.radius ?? Math.max(p.size[0], p.size[2]) / 2, kind: p.kind as LandingZoneInput['kind'] }));
  const over = zoneAt(robotHandle.pos.x, robotHandle.pos.z, zones);
  let nearest = Infinity;
  for (const z of zones) nearest = Math.min(nearest, Math.hypot(robotHandle.pos.x - z.x, robotHandle.pos.z - z.z));

  return (
    <>
      <div className="pointer-events-none fixed left-3 top-3 z-[60] w-60 rounded-xl border border-sky-800/50 bg-slate-950/75 p-3 text-xs text-slate-200 backdrop-blur">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="font-bold text-sky-200">DESCENT</span>
          <span className={`font-mono text-[10px] ${over ? 'text-emerald-300' : 'text-amber-300'}`}>{over ? `over ${over.id}` : 'no zone below'}</span>
        </div>
        <Row label="Altitude" value={robotHandle.altitude.toFixed(1)} />
        <Row label="Fall speed" value={robotHandle.vSpeed.toFixed(1)} warn={robotHandle.vSpeed > 12} />
        <Row label="Horizontal" value={robotHandle.hSpeed.toFixed(1)} warn={robotHandle.hSpeed > 9} />
        <Row label="Nearest zone" value={Number.isFinite(nearest) ? nearest.toFixed(0) : '—'} />
        <Row label="Thrusters" value={robotHandle.thrusters ? 'ON (Shift)' : 'off'} />
      </div>

      {evaluation && !evaluation.safe && (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-[60] flex justify-center">
          <div className="max-w-md rounded-xl border border-amber-700/60 bg-slate-950/85 px-4 py-2 text-center text-xs text-amber-200 backdrop-blur">
            <div className="font-bold">Unsafe landing — bounced back up. Try again!</div>
            {evaluation.reasons.map((r, i) => (<div key={i} className="text-[10px] text-amber-300/80">{r}</div>))}
          </div>
        </div>
      )}

      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex justify-center">
        <div className="rounded-full bg-slate-950/60 px-3 py-1 text-[10px] text-slate-400 backdrop-blur">
          W/S/A/D drift · Shift thrusters (slow fall) · Space buffer burst — land slowly inside the green zone
        </div>
      </div>
    </>
  );
};

const Row = ({ label, value, warn }: { label: string; value: string; warn?: boolean }) => (
  <div className="flex justify-between">
    <span className="text-slate-400">{label}</span>
    <span className={`tabular-nums ${warn ? 'text-rose-300' : ''}`}>{value}</span>
  </div>
);
