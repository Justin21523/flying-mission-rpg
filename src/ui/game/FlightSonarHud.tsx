import { Vector3 } from 'three';
import { usePoll } from '../usePoll';
import { flightHandle } from '../../game/flight/flightHandle';
import { getActivePathId } from '../../game/flight/world/worldRoute';
import { getPath } from '../../stores/editorPathStore';
import { getCurve, samplePos } from '../../game/path/pathCurve';
import { FLIGHT_EVENT_POOL } from '../../game/flight/world/flightEventPool';

// 🛰 Flight sonar scope (top-centre) — reuses the POLI radar look (top-down ring + scan cone fixed to the
// craft's heading). Plots the route ahead (cyan trail), the destination bearing (amber ★), and active
// flight events (their colours), all transformed into the craft's local frame. Polled, not per-frame.
const R = 58;
const RANGE = 1400;
const SCALE = R / RANGE;

const _fwd = new Vector3();
const _right = new Vector3();
const _rel = new Vector3();
const _p = new Vector3();

// Project a world point into the scope (forward = up). Returns clamped {px, py} pixels from centre.
function project(p: Vector3): { px: number; py: number } {
  _rel.copy(p).sub(flightHandle.pos);
  let px = _rel.dot(_right) * SCALE;
  let py = -_rel.dot(_fwd) * SCALE;
  const d = Math.hypot(px, py);
  if (d > R - 4) {
    const k = (R - 4) / d;
    px *= k;
    py *= k;
  }
  return { px, py };
}

const Blip = ({ px, py, color, size = 6 }: { px: number; py: number; color: string; size?: number }) => (
  <div
    className="absolute rounded-full"
    style={{ left: `calc(50% + ${px}px)`, top: `calc(50% + ${py}px)`, width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, background: color, boxShadow: `0 0 6px ${color}` }}
  />
);

export const FlightSonarHud = () => {
  usePoll(150);
  _fwd.set(0, 0, -1).applyQuaternion(flightHandle.quat);
  _right.set(-_fwd.z, 0, _fwd.x).normalize();

  const def = getPath(getActivePathId());
  const cc = def ? getCurve(def) : null;
  const u = flightHandle.routeU;

  // route trail ahead
  const trail: { px: number; py: number }[] = [];
  let dest: { px: number; py: number } | null = null;
  if (cc) {
    for (let i = 1; i <= 6; i++) {
      const su = Math.min(1, u + i * 0.012);
      samplePos(cc.curve, su, _p);
      trail.push(project(_p));
    }
    samplePos(cc.curve, 1, _p);
    dest = project(_p);
  }

  const events = FLIGHT_EVENT_POOL.filter((s) => s.active && s.def);

  return (
    <div className="pointer-events-none fixed left-1/2 top-3 z-[60] flex -translate-x-1/2 flex-col items-center">
      <div className="mb-1 rounded-full bg-slate-950/70 px-3 py-0.5 text-[11px] font-bold text-cyan-100 shadow backdrop-blur">🛰 SONAR</div>
      <div className="relative overflow-hidden rounded-full border-2 border-cyan-500/40 shadow-xl" style={{ width: R * 2, height: R * 2, background: 'radial-gradient(circle, rgba(8,47,73,0.55) 0%, rgba(2,6,23,0.85) 75%)' }}>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/20" style={{ width: R, height: R }} />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/15" style={{ width: R * 1.6, height: R * 1.6 }} />
        {/* scan cone — fixed pointing up (the craft's heading) */}
        <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 235deg, rgba(34,211,238,0.30), rgba(34,211,238,0) 70deg)' }} />
        {/* route trail */}
        {trail.map((t, i) => (
          <Blip key={`t${i}`} px={t.px} py={t.py} color="#22d3ee" size={3} />
        ))}
        {/* events */}
        {events.map((s, i) => (
          <Blip key={`e${i}`} px={project(s.pos).px} py={project(s.pos).py} color={s.def!.color} size={7} />
        ))}
        {/* destination */}
        {dest && <Blip px={dest.px} py={dest.py} color="#f59e0b" size={8} />}
        {/* craft (centre) */}
        <div className="absolute left-1/2 top-1/2 h-0 w-0 -translate-x-1/2 -translate-y-1/2" style={{ borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: '9px solid #e2e8f0' }} />
      </div>
    </div>
  );
};
