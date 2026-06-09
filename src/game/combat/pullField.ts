// POLI yokai-hunt — black-hole pull field. A 'blackhole' super registers a short-lived pull point here;
// YokaiCombatLayer's per-yokai movement adds pullVelocity() so yokai get sucked toward the vortex.
interface Pull { x: number; z: number; until: number; strength: number }
const pulls: Pull[] = [];
const _pv = { vx: 0, vz: 0 }; // shared return (no per-call allocation)
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

export function addPull(x: number, z: number, strength: number, durationSec: number): void {
  const t = now();
  for (let i = pulls.length - 1; i >= 0; i--) if (pulls[i].until < t) pulls.splice(i, 1); // prune
  pulls.push({ x, z, until: t + durationSec, strength });
}

// Summed pull toward all active vortices at (x,z). Returns a shared {vx,vz} — read it immediately.
export function pullVelocity(x: number, z: number): { vx: number; vz: number } {
  _pv.vx = 0; _pv.vz = 0;
  if (pulls.length === 0) return _pv;
  const t = now();
  for (const p of pulls) {
    if (p.until < t) continue;
    const dx = p.x - x, dz = p.z - z;
    const d = Math.hypot(dx, dz) || 1;
    _pv.vx += (dx / d) * p.strength;
    _pv.vz += (dz / d) * p.strength;
  }
  return _pv;
}
