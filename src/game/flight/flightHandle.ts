import { Vector3, Quaternion } from 'three';

// Non-reactive handle to the live aircraft transform, shared by FlightController (writer), FlightCamera,
// and the HUD (via poll) — no per-frame store writes.
export const flightHandle = {
  pos: new Vector3(0, 26, 60),
  quat: new Quaternion(),
  speed: 0,
  throttle: 0,
  altitude: 26,
};
