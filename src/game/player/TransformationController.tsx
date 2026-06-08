import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { Group } from 'three';
import { useTransformationStore } from '../../stores/transformationStore';
import { useUiStore } from '../../stores/uiStore';
import { useEditorPoliCharacterStore } from '../../stores/editorPoliCharacterStore';
import { PlayerMesh } from './PlayerMesh';

interface Props {
  headingRef: { current: number };
}

export const TransformationController = ({ headingRef }: Props) => {
  const mode = useTransformationStore((s) => s.mode);
  const editMode = useUiStore((s) => s.editMode);
  const groupRef = useRef<Group>(null);

  // Face the movement direction each frame (both modes) so the capsule nose / model points
  // the way you're going. headingRef is written by applyMovement (camera-relative).
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = headingRef.current;
    }
  });

  // In Edit Mode the player is clickable → opens the 🤖 POLI tab on the player so its model
  // (and other data) can be swapped. An invisible grab box guarantees a reliable hit target.
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!useUiStore.getState().editMode) return;
    e.stopPropagation();
    useEditorPoliCharacterStore.getState().selectPoli('poli');
  };

  return (
    <group ref={groupRef} position={[0, 0.5, 0]} onClick={onClick}>
      <PlayerMesh mode={mode} />
      {editMode && (
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[1.2, 2.2, 1.2]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
};
