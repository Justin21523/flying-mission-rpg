import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';
import { getEditorZoneSegment } from '../../stores/game/editorZoneSegmentStore';
import { robotHandle } from '../destination/robotHandle';
import { spawnGroupsForSegment, despawnGroup, resetSpawnDirector } from '../combat/enemySpawnDirector';
import { getSpawnGroupsForSegment } from '../../stores/game/editorCombatStore';
import * as ObstacleDirector from '../obstacles/ObstacleDirector';
import { clearRuntimeDamageables } from '../combat/enemyRuntime';

// Watches the active zone segment and loads its encounter (enemy spawn groups + obstacles) on entry; cleans
// up on leave. Ticks the ObstacleDirector each frame (syncs damage proxies → obstacle state). Mounted in
// DestinationScene during combat phases. Enemies/obstacles flow through the shared combat registry — this
// host only orchestrates spawning + cleanup per segment.
export const ZoneEncounterHost = () => {
  const loadedSegment = useRef<string | null>(null);

  const cleanupCurrent = (segId: string | null) => {
    if (segId) for (const g of getSpawnGroupsForSegment(segId)) despawnGroup(g.id);
    ObstacleDirector.cleanup();
  };

  useEffect(() => () => { cleanupCurrent(loadedSegment.current); resetSpawnDirector(); clearRuntimeDamageables(); }, []);

  useFrame(() => {
    const segId = useAdvancedMissionZoneStore.getState().activeSegmentId ?? null;
    if (segId !== loadedSegment.current) {
      cleanupCurrent(loadedSegment.current);
      loadedSegment.current = segId;
      if (segId) {
        const seg = getEditorZoneSegment(segId);
        const marker = seg?.markers.find((m) => m.type === 'objective') ?? seg?.markers[0];
        const ox = marker?.position[0] ?? robotHandle.pos.x;
        const oz = marker?.position[2] ?? robotHandle.pos.z;
        spawnGroupsForSegment(segId, ox, oz);
        ObstacleDirector.loadForSegment(segId);
      }
    }
    ObstacleDirector.update();
  });

  return null;
};
