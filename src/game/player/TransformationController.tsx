import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { useTransformationStore } from '../../stores/transformationStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useSceneEditStore } from '../../stores/sceneEditStore';
import { objKey } from '../edit/sceneEditMerge';
import { PlayerMesh } from './PlayerMesh';

interface Props {
  headingRef: { current: number };
}

// The player's visible mesh — ALWAYS rendered, in both Edit and Play mode (never hidden, never
// duplicated). Facing = movement heading + the edited yaw offset, so the model points where it's
// going while keeping any rotation correction set in Edit Mode (a relative offset). Scale honours
// the Edit-Mode override too. headingRef is written by applyMovement (camera-relative) in play, and
// seeded from the override in edit (see Player.tsx).
export const TransformationController = ({ headingRef }: Props) => {
  const mode = useTransformationStore((s) => s.mode);
  const groupRef = useRef<Group>(null);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const areaId = usePlayerStore.getState().currentAreaId;
    const ov = useSceneEditStore.getState().overrides[objKey(areaId, 'npc', 'poli')];
    const yawOffset = ov?.rotation?.[1] ?? 0;
    g.rotation.y = headingRef.current + yawOffset;
    const s = ov?.scale ?? 1;
    g.scale.set(s, s, s);
  });

  return (
    <group ref={groupRef} position={[0, 0.5, 0]}>
      <PlayerMesh mode={mode} />
    </group>
  );
};
