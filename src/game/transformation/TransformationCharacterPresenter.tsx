import { useRef, type ReactNode, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { AnimatedGlbModel } from '../world/AnimatedGlbModel';
import { EditableObject } from '../edit/EditableObject';
import { txFrame, useTxVersion } from './transformationRuntime';
import { transformModelSlotKey, transformStageModelKey } from './transformPartKey';
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

function offsetBase(offset: TransformationTransformOffset | undefined) {
  const source = offset ?? DEFAULT_OFFSET;
  return {
    position: source.position,
    rotation: [source.rotation[0] * DEG, source.rotation[1] * DEG, source.rotation[2] * DEG] as [number, number, number],
    scale: source.scale,
  };
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

const EditableModelGroup = ({
  editMode,
  objKey,
  editOffset,
  runtimeOffset,
  groupRef,
  initialVisible = false,
  children,
}: {
  editMode: boolean;
  objKey: string;
  editOffset?: TransformationTransformOffset;
  runtimeOffset: TransformationTransformOffset;
  groupRef: RefObject<Group | null>;
  initialVisible?: boolean;
  children: ReactNode;
}) => {
  if (editMode) {
    return (
      <EditableObject objKey={objKey} base={offsetBase(editOffset)}>
        <group ref={groupRef} visible={initialVisible}>
          {children}
        </group>
      </EditableObject>
    );
  }
  return (
    <group
      ref={groupRef}
      visible={initialVisible}
      position={runtimeOffset.position}
      rotation={[runtimeOffset.rotation[0] * DEG, runtimeOffset.rotation[1] * DEG, runtimeOffset.rotation[2] * DEG]}
      scale={runtimeOffset.scale}
    >
      {children}
    </group>
  );
};

export const TransformationCharacterPresenter = ({
  def,
  editDef,
  editMode = false,
  previewPlaying = false,
  charModelId,
}: {
  def: TransformationDefinition;
  editDef?: TransformationDefinition;
  editMode?: boolean;
  previewPlaying?: boolean;
  charModelId?: string;
}) => {
  const root = useRef<Group>(null);
  const robot = useRef<Group>(null);
  const plane = useRef<Group>(null);
  const shared = useRef<Group>(null);
  const extra = useRef<Group>(null);
  // Re-render when the active extra model / clip changes (sparse — bumped by the director/preview driver),
  // so multi-model sequences (any number of model-swap stages) and animation-clip switches mount live.
  useTxVersion((s) => s.v);
  // Edit-AT-REST authoring view: show the real model slots that HAVE a model so they're visible + clickable,
  // and keep the root static so the gizmo target doesn't drift. Play / preview-playback follow the snapshot.
  const editRest = editMode && !previewPlaying;
  const hasRobot = !!(def.robotModelRef ?? charModelId);
  const hasPlane = !!def.planeModelRef;
  const hasShared = !!def.sharedModelRef;
  useFrame(() => {
    if (root.current) {
      root.current.rotation.y = editRest ? 0 : txFrame.showcaseYaw;
      root.current.position.y = editRest ? 0 : -(txFrame.snapshot?.rootYOffset ?? 0); // slow exit descent
    }
    if (editRest) {
      if (robot.current) robot.current.visible = hasRobot;
      if (plane.current) plane.current.visible = hasPlane;
      if (shared.current) shared.current.visible = hasShared;
      return;
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
  const editSource = editDef ?? def;
  return (
    <group ref={root} scale={def.modelScale ?? 1}>
      {(def.parts ?? []).map((p) => (
        <PartMesh key={p.key} part={p} color={p.color ?? color} />
      ))}
      {/* model slots — robot defaults to the character's GLB; plane/shared from the timeline refs */}
      <EditableModelGroup editMode={editMode} objKey={transformModelSlotKey(def.id, 'robot')} editOffset={offsetForSlot(editSource, 'robot')} runtimeOffset={robotOffset} groupRef={robot}>
        {(def.robotModelRef ?? charModelId) && <AnimatedGlbModel assetId={(def.robotModelRef ?? charModelId)!} animation={robotClip?.clipName} animationSpeed={robotClip?.clipSpeed} loop={robotClip?.loop} autoPlayFirstClip={!!robotClip} noCull />}
      </EditableModelGroup>
      <EditableModelGroup editMode={editMode} objKey={transformModelSlotKey(def.id, 'plane')} editOffset={offsetForSlot(editSource, 'plane')} runtimeOffset={planeOffset} groupRef={plane}>
        {def.planeModelRef && <AnimatedGlbModel assetId={def.planeModelRef} animation={planeClip?.clipName} animationSpeed={planeClip?.clipSpeed} loop={planeClip?.loop} autoPlayFirstClip={!!planeClip} noCull />}
      </EditableModelGroup>
      <EditableModelGroup editMode={editMode} objKey={transformModelSlotKey(def.id, 'shared')} editOffset={offsetForSlot(editSource, 'shared')} runtimeOffset={sharedOffset} groupRef={shared}>
        {def.sharedModelRef && <AnimatedGlbModel assetId={def.sharedModelRef} animation={sharedClip?.clipName} animationSpeed={sharedClip?.clipSpeed} loop={sharedClip?.loop} autoPlayFirstClip={!!sharedClip} noCull />}
      </EditableModelGroup>
      {/* arbitrary extra model (model-swap stage with a modelRef — supports chained multi-model sequences) */}
      {extraRef && (
        <EditableModelGroup
          editMode={editMode}
          objKey={transformStageModelKey(def.id, txFrame.snapshot?.activeModelStageId ?? 'active')}
          editOffset={offsetForStageModel(editSource, txFrame.snapshot?.activeModelStageId)}
          runtimeOffset={extraOffset}
          groupRef={extra}
          initialVisible
        >
          <AnimatedGlbModel assetId={extraRef} animation={extraClip?.clipName} animationSpeed={extraClip?.clipSpeed} loop={extraClip?.loop} autoPlayFirstClip={!!extraClip} noCull />
        </EditableModelGroup>
      )}
    </group>
  );
};
