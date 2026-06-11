import { Vector3 } from 'three';

// Non-reactive handle to the robot's live transform during DESCENT/LANDING/ground play — shared by the
// controllers (writers), the HUDs (polled) and the objective director (reader). No per-frame store writes.
export const robotHandle = {
  pos: new Vector3(0, 80, 0),
  heading: 0, // radians (ground facing)
  vSpeed: 0, // downward positive (descent)
  hSpeed: 0,
  altitude: 80,
  thrusters: false,
  flying: false, // ground-phase flight toggle (F) active
};
