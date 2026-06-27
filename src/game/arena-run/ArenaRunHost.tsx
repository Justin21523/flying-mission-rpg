import { useFrame } from '@react-three/fiber';
import { update as updateRun } from './RunDirector';

// Batch N — per-frame pump for the arena run loop. Mounted in DestinationScene during ARENA_RUN. It only
// drives RunDirector; BossDirector.update() is already pumped by BossHost (inside CombatRuntimeLayer), so we
// must NOT pump it here (would double-tick the boss).
export const ArenaRunHost = () => {
  useFrame(() => updateRun());
  return null;
};
