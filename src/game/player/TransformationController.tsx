import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { useTransformationStore } from '../../stores/transformationStore';
import { PlayerMesh } from './PlayerMesh';

interface Props {
  headingRef: { current: number };
}

export const TransformationController = ({ headingRef }: Props) => {
  const mode = useTransformationStore((s) => s.mode);
  const groupRef = useRef<Group>(null);

  // Rotate vehicle mesh to match heading each frame — no allocation.
  useFrame(() => {
    if (mode === 'vehicle' && groupRef.current) {
      groupRef.current.rotation.y = headingRef.current;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.5, 0]}>
      <PlayerMesh mode={mode} />
    </group>
  );
};
