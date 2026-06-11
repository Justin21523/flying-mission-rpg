import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { AnimatedGlbModel } from '../world/AnimatedGlbModel';
import { txFrame, useTxVersion } from './transformationRuntime';
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
  const plane = useRef<Group>(null);
  const shared = useRef<Group>(null);
  // Re-render when the active extra model / clip changes (sparse — bumped by the director/preview driver),
  // so multi-model sequences (any number of model-swap stages) and animation-clip switches mount live.
  useTxVersion((s) => s.v);
  useFrame(() => {
    if (root.current) {
      root.current.rotation.y = txFrame.showcaseYaw;
      root.current.position.y = -(txFrame.snapshot?.rootYOffset ?? 0); // slow exit descent
    }
    const vis = txFrame.snapshot?.modelVisible;
    if (robot.current) robot.current.visible = vis?.robot ?? false;
    if (plane.current) plane.current.visible = vis?.plane ?? false;
    if (shared.current) shared.current.visible = vis?.shared ?? false;
  });
  const color = def.particleColor;
  const clip = txFrame.snapshot?.activeClip ?? undefined;
  const extraRef = txFrame.snapshot?.activeModelRef ?? undefined;
  return (
    <group ref={root}>
      {(def.parts ?? []).map((p) => (
        <PartMesh key={p.key} part={p} color={p.color ?? color} />
      ))}
      {/* model slots — robot defaults to the character's GLB; plane/shared from the timeline refs */}
      <group ref={robot} visible={false}>
        {(def.robotModelRef ?? charModelId) && <AnimatedGlbModel assetId={(def.robotModelRef ?? charModelId)!} animation={clip} noCull />}
      </group>
      <group ref={plane} visible={false}>
        {def.planeModelRef && <AnimatedGlbModel assetId={def.planeModelRef} animation={clip} noCull />}
      </group>
      <group ref={shared} visible={false}>
        {def.sharedModelRef && <AnimatedGlbModel assetId={def.sharedModelRef} animation={clip} noCull />}
      </group>
      {/* arbitrary extra model (model-swap stage with a modelRef — supports chained multi-model sequences) */}
      {extraRef && <AnimatedGlbModel assetId={extraRef} animation={clip} noCull />}
    </group>
  );
};
