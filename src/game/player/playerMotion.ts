// Per-frame player motion, shared as a plain mutable singleton (like the kit's editorSpawn) so the
// rotor + flight-jet + skid-marks can read it inside their own useFrame WITHOUT subscribing (no
// re-renders). Player / applyMovement write it every frame.
export const playerMotion = {
  heading: 0,     // current facing yaw (radians), movement direction
  moving: false,  // true while flying AND a movement key is held (drives the rotor spin)
  skidding: false, // true while the vehicle is braking/coasting fast (drives skid marks)
  speed: 0,        // current horizontal speed (m/s)
};
