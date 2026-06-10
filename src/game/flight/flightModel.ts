import type { FlightTuning } from '../../types/game/flightControl';

// Pure flight-speed model (kept out of the frame loop so it's unit-testable). accelInput: +1 throttle,
// 0 coast→cruise, -1 brake. speedMult comes from the character's flightSpeed stat. Result is clamped to
// [0, maxSpeed×mult].
export function nextSpeed(speed: number, accelInput: number, tuning: FlightTuning, speedMult: number, dt: number): number {
  const max = tuning.maxSpeed * speedMult;
  const cruise = tuning.cruiseSpeed * speedMult;
  let target = cruise;
  if (accelInput > 0) target = max;
  else if (accelInput < 0) target = Math.min(cruise, tuning.stallSpeed);
  const rate = (accelInput >= 0 ? tuning.throttleAccel : tuning.brakeDecel) * dt;
  const delta = target - speed;
  const step = Math.sign(delta) * Math.min(Math.abs(delta), rate);
  return Math.max(0, Math.min(max, speed + step));
}

// Whether the craft is below stall speed (loses lift → sinks). Drives the auto-recover nudge.
export function isStalling(speed: number, tuning: FlightTuning, speedMult: number): boolean {
  return speed < tuning.stallSpeed * speedMult;
}
