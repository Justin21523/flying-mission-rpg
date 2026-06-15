import { useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAdvancedMissionZoneStore } from '../../../stores/game/useAdvancedMissionZoneStore';
import { initializeBossForSegment, update, cleanup } from '../../bosses/BossDirector';

// Per-frame pump for the boss encounter (Batch F). Starts the segment's boss when the player enters its
// segment, ticks BossDirector each frame, cleans up on unmount. Mounted inside CombatRuntimeLayer.
export const BossHost = () => {
  const activeSegmentId = useAdvancedMissionZoneStore((s) => s.activeSegmentId);

  useEffect(() => {
    if (activeSegmentId) initializeBossForSegment(activeSegmentId);
  }, [activeSegmentId]);

  useEffect(() => () => cleanup(), []);

  useFrame(() => update());
  return null;
};
