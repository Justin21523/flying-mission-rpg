// Pure: which distance milestones (multiples of `step`, exclusive of 0 and 1) lie in (prevU, u]. Used by the
// director to award a one-off bonus each time the craft passes a quarter/half/three-quarter mark of the route.
export function crossedMilestones(prevU: number, u: number, step: number): number[] {
  const out: number[] = [];
  if (step <= 0) return out;
  for (let m = step; m < 0.999; m += step) {
    const r = Math.round(m * 1000) / 1000;
    if (r > prevU && r <= u) out.push(r);
  }
  return out;
}
