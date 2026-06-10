import type { RapierRigidBody } from '@react-three/rapier';

// Non-reactive handle to the active base vehicle's Rapier body, so the LiftPlatform can ride it down
// during the lift sequence without prop-drilling a ref through the scene. Set by BaseVehicle on mount.
export const vehicleHandle: { body: RapierRigidBody | null } = { body: null };
