import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { AnimatedGlbModel } from '../world/AnimatedGlbModel';
import { txFrame, useTxVersion } from './transformationRuntime';
import type { ActiveModelClip } from './TransformationTimelineRunner';
import type { TransformationDefinition, TransformationPart, PartGeometryKind, ModelSlot, TransformationTransformOffset } from '../../types/game/transformation';

// Renders the transforming character: procedural primitive parts (driven each frame by the runner's resolved
// part states) + the character's real GLB revealed as the "robot" model at the finish. Shared by play + edit
// preview (both read txFrame.snapshot), so the two always match. The root spins with the showcase yaw.
const DEG = Math.PI / 180;
const DEFAULT_OFFSET: TransformationTransformOffset = { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 };

function offsetForSlot(def: TransformationDefinition, slot: ModelSlot): TransformationTransformOffset {
  return def.modelSlotOffsets?.[slot] ?? DEFAULT_OFFSET;
}

function offsetForStageModel(def: TransformationDefinition, stageId: string | null | undefined): TransformationTransformOffset {
  if (!stageId) return DEFAULT_OFFSET;
  return def.stages.find((s) => s.id === stageId)?.params.modelOffset ?? DEFAULT_OFFSET;
}

function clipForSlot(clips: ActiveModelClip[], slot: ModelSlot): ActiveModelClip | undefined {
  for (let i = clips.length - 1; i >= 0; i -= 1) if (clips[i]?.modelSlot === slot) return clips[i];
  return undefined;
}

function clipForRef(clips: ActiveModelClip[], modelRef: string): ActiveModelClip | undefined {
  for (let i = clips.length - 1; i >= 0; i -= 1) if (clips[i]?.modelRef === modelRef) return clips[i];
  return undefined;
}

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
  const clips = txFrame.snapshot?.activeModelClips ?? [];
  const robotClip = clipForSlot(clips, 'robot');
  const planeClip = clipForSlot(clips, 'plane');
  const sharedClip = clipForSlot(clips, 'shared');
  const extraRef = txFrame.snapshot?.activeModelRef ?? undefined;
  const extraClip = extraRef ? clipForRef(clips, extraRef) : undefined;
  const robotOffset = offsetForSlot(def, 'robot');
  const planeOffset = offsetForSlot(def, 'plane');
  const sharedOffset = offsetForSlot(def, 'shared');
  const extraOffset = offsetForStageModel(def, txFrame.snapshot?.activeModelStageId);
  return (
    <group ref={root} scale={def.modelScale ?? 1}>
      {(def.parts ?? []).map((p) => (
        <PartMesh key={p.key} part={p} color={p.color ?? color} />
      ))}
      {/* model slots — robot defaults to the character's GLB; plane/shared from the timeline refs */}
      <group ref={robot} visible={false} position={robotOffset.position} rotation={[robotOffset.rotation[0] * DEG, robotOffset.rotation[1] * DEG, robotOffset.rotation[2] * DEG]} scale={robotOffset.scale}>
        {(def.robotModelRef ?? charModelId) && <AnimatedGlbModel assetId={(def.robotModelRef ?? charModelId)!} animation={robotClip?.clipName} animationSpeed={robotClip?.clipSpeed} loop={robotClip?.loop} autoPlayFirstClip={!!robotClip} noCull />}
      </group>
      <group ref={plane} visible={false} position={planeOffset.position} rotation={[planeOffset.rotation[0] * DEG, planeOffset.rotation[1] * DEG, planeOffset.rotation[2] * DEG]} scale={planeOffset.scale}>
        {def.planeModelRef && <AnimatedGlbModel assetId={def.planeModelRef} animation={planeClip?.clipName} animationSpeed={planeClip?.clipSpeed} loop={planeClip?.loop} autoPlayFirstClip={!!planeClip} noCull />}
      </group>
      <group ref={shared} visible={false} position={sharedOffset.position} rotation={[sharedOffset.rotation[0] * DEG, sharedOffset.rotation[1] * DEG, sharedOffset.rotation[2] * DEG]} scale={sharedOffset.scale}>
        {def.sharedModelRef && <AnimatedGlbModel assetId={def.sharedModelRef} animation={sharedClip?.clipName} animationSpeed={sharedClip?.clipSpeed} loop={sharedClip?.loop} autoPlayFirstClip={!!sharedClip} noCull />}
      </group>
      {/* arbitrary extra model (model-swap stage with a modelRef — supports chained multi-model sequences) */}
      {extraRef && (
        <group position={extraOffset.position} rotation={[extraOffset.rotation[0] * DEG, extraOffset.rotation[1] * DEG, extraOffset.rotation[2] * DEG]} scale={extraOffset.scale}>
          <AnimatedGlbModel assetId={extraRef} animation={extraClip?.clipName} animationSpeed={extraClip?.clipSpeed} loop={extraClip?.loop} autoPlayFirstClip={!!extraClip} noCull />
        </group>
      )}
    </group>
  );
};
