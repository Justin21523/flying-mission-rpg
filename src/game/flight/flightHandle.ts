import { Vector3, Quaternion } from 'three';

// Non-reactive handle to the live aircraft transform, shared by FlightController (writer), FlightCamera,
// and the HUD (via poll) — no per-frame store writes.
export const flightHandle = {
  pos: new Vector3(0, 26, 60),
  quat: new Quaternion(),
  speed: 0, // raw units/sec (HUD display — can be huge on long routes)
  speedNorm: 0, // 0..1 normalized "speed feel" — drives the camera FOV/pullback (never explodes)
  throttle: 0,
  altitude: 26,
  routeU: 0, // 0..1 progress along the world route (set by RouteFollower)
};
