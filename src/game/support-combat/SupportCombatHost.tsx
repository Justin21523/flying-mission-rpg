import { useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { initializeForZone, update, cleanup } from './SupportCombatDirector';

// Per-frame pump for support COMBAT (Batch E). Registers the MVP support characters for the zone on mount,
// ticks support-energy regen + active-effect/decoy expiry each frame, cleans up on unmount. Mounted inside
// CombatRuntimeLayer (so it only runs during ground combat phases).
export const SupportCombatHost = () => {
  useEffect(() => {
    initializeForZone();
    return () => cleanup();
  }, []);
  useFrame((_, dt) => update(Math.min(0.05, dt)));
  return null;
};
