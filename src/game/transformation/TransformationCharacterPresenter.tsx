import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { AnimatedGlbModel } from '../world/AnimatedGlbModel';
import { txFrame } from './transformationRuntime';
import type { TransformationDefinition, TransformationPart, PartGeometryKind } from '../../types/game/transformation';

// Renders the transforming character: procedural primitive parts (driven each frame by the runner's resolved
// part states) + the character's real GLB revealed as the "robot" model at the finish. Shared by play + edit
// preview (both read txFrame.snapshot), so the two always match. The root spins with the showcase yaw.
const DEG = Math.PI / 180;

const PartMesh = ({ part, color }: { part: TransformationPart; color: string }) => {
  const g = useRef<Group>(null);
  useFrame(() => {
    const st = txFrame.snapshot?.parts.get(part.key);
    const grp = g.current;
    if (!grp || !st) return;
    grp.position.set(st.position[0], st.position[1], st.position[2]);
    grp.rotation.set(st.rotation[0] * DEG, st.rotation[1] * DEG, st.rotation[2] * DEG);
    grp.scale.setScalar(st.scale);
    grp.visible = st.visible;
  });
  return (
    <group ref={g} position={part.basePosition}>
      <mesh castShadow>
        <GeomFor kind={part.geometry} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} metalness={0.3} roughness={0.5} />
      </mesh>
    </group>
  );
};

const GeomFor = ({ kind }: { kind: PartGeometryKind }) => {
  switch (kind) {
    case 'wing': return <boxGeometry args={[1.6, 0.12, 0.6]} />;
    case 'limb': return <boxGeometry args={[0.28, 0.9, 0.28]} />;
    case 'head': return <boxGeometry args={[0.5, 0.5, 0.5]} />;
    case 'thruster': return <cylinderGeometry args={[0.18, 0.24, 0.7, 10]} />;
    default: return <boxGeometry args={[0.8, 0.8, 1.4]} />; // core
  }
};

export const TransformationCharacterPresenter = ({ def, charModelId }: { def: TransformationDefinition; charModelId?: string }) => {
  const root = useRef<Group>(null);
  const robot = useRef<Group>(null);
  useFrame(() => {
    if (root.current) root.current.rotation.y = txFrame.showcaseYaw;
    if (robot.current) robot.current.visible = txFrame.snapshot?.modelVisible.robot ?? false;
  });
  const color = def.particleColor;
  return (
    <group ref={root}>
      {def.parts.map((p) => (
        <PartMesh key={p.key} part={p} color={p.color ?? color} />
      ))}
      {/* the real character model revealed at the finish */}
      <group ref={robot} visible={false}>
        {charModelId && <AnimatedGlbModel assetId={charModelId} noCull />}
      </group>
    </group>
  );
};
