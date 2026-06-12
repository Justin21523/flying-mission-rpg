import { useRef, type ReactNode, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { AnimatedGlbModel } from '../world/AnimatedGlbModel';
import { NormalizedGlbModel } from '../world/NormalizedGlbModel';
import { getModelAsset } from '../../data/modelLibrary';
import { EditableObject } from '../edit/EditableObject';
import { txFrame, useTxVersion } from './transformationRuntime';
import { transformModelSlotKey, transformStageModelKey } from './transformPartKey';
import type { ActiveModelClip, SlotMotion } from './TransformationTimelineRunner';
import type { TransformationDefinition, TransformationPart, PartGeometryKind, ModelSlot, TransformationTransformOffset } from '../../types/game/transformation';

// Renders the transforming character: procedural primitive parts (driven each frame by the runner's resolved
// part states) + the character's real GLB revealed as the "robot" model at the finish. Shared by play + edit
// preview (both read txFrame.snapshot), so the two always match. The root spins with the showcase yaw.
const DEG = Math.PI / 180;
const DEFAULT_OFFSET: TransformationTransformOffset = { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 };

// Apply the authored slot offset + the runner's animated motion to a model group (play / preview playback).
// Allocation-free: writes components directly, never creates objects in the frame loop.
function applySlotMotion(g: Group, off: TransformationTransformOffset, m?: SlotMotion): void {
  const mp = m ? m.position : ZERO3;
  const mr = m ? m.rotation : ZERO3;
  const ms = m ? m.scale : 1;
  g.position.set(off.position[0] + mp[0], off.position[1] + mp[1], off.position[2] + mp[2]);
  g.rotation.set((off.rotation[0] + mr[0]) * DEG, (off.rotation[1] + mr[1]) * DEG, (off.rotation[2] + mr[2]) * DEG);
  const s = off.scale * ms;
  g.scale.set(s, s, s);
}
const ZERO3: [number, number, number] = [0, 0, 0];

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
      {part.assetId && getModelAsset(part.assetId) ? (
        <NormalizedGlbModel assetId={part.assetId} target={part.modelTarget && part.modelTarget > 0 ? part.modelTarget : 1.2} />
      ) : (
        <mesh castShadow>
          <GeomFor kind={part.geometry} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} metalness={0.3} roughness={0.5} />
        </mesh>
      )}
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
  hitbox,
  initialVisible = false,
  children,
}: {
  editMode: boolean;
  objKey: string;
  editOffset?: TransformationTransformOffset;
  runtimeOffset: TransformationTransformOffset;
  groupRef: RefObject<Group | null>;
  hitbox: { center: [number, number, number]; size: [number, number, number] };
  initialVisible?: boolean;
  children: ReactNode;
}) => {
  if (editMode) {
    return (
      <EditableObject objKey={objKey} base={offsetBase(editOffset)}>
        <group ref={groupRef} visible={initialVisible}>
          {children}
          <mesh position={hitbox.center}>
            <boxGeometry args={hitbox.size} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
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
  const robotOffset = offsetForSlot(def, 'robot');
  const planeOffset = offsetForSlot(def, 'plane');
  const sharedOffset = offsetForSlot(def, 'shared');
  useFrame(() => {
    const snap = txFrame.snapshot;
    txFrame.ghostScale = (def.modelScale ?? 1) * robotOffset.scale * (snap?.modelMotion.robot.scale ?? 1);
    if (root.current) {
      const rootPosition = def.rootPosition ?? ZERO3;
      const rootRotation = def.rootRotation ?? ZERO3;
      const baseYaw = (def.baseYawDeg ?? 0) * DEG; // authored whole-character facing (always applied)
      root.current.position.set(rootPosition[0], rootPosition[1] + (editRest ? 0 : -(snap?.rootYOffset ?? 0)), rootPosition[2]);
      root.current.rotation.set(rootRotation[0] * DEG, rootRotation[1] * DEG + baseYaw + (editRest ? 0 : txFrame.showcaseYaw), rootRotation[2] * DEG);
      const exit = editRest ? 1 : (snap?.exitScaleMul ?? 1); // shrink fly-out
      root.current.scale.setScalar((def.modelScale ?? 1) * exit);
    }
    if (editRest) {
      if (robot.current) robot.current.visible = hasRobot;
      if (plane.current) plane.current.visible = hasPlane;
      if (shared.current) shared.current.visible = hasShared;
      return; // gizmo controls the slot transforms at rest
    }
    const vis = snap?.modelVisible;
    if (robot.current) { robot.current.visible = vis?.robot ?? false; applySlotMotion(robot.current, robotOffset, snap?.modelMotion.robot); }
    if (plane.current) { plane.current.visible = vis?.plane ?? false; applySlotMotion(plane.current, planeOffset, snap?.modelMotion.plane); }
    if (shared.current) { shared.current.visible = vis?.shared ?? false; applySlotMotion(shared.current, sharedOffset, snap?.modelMotion.shared); }
    // arbitrary swapped-in model — driven by model-move (refMotion) + model-visibility (activeModelVisible).
    if (extra.current) { extra.current.visible = snap?.activeModelVisible ?? true; applySlotMotion(extra.current, offsetForStageModel(def, snap?.activeModelStageId), snap?.refMotion); }
  });
  const color = def.particleColor;
  const clips = txFrame.snapshot?.activeModelClips ?? [];
  const robotClip = clipForSlot(clips, 'robot');
  const planeClip = clipForSlot(clips, 'plane');
  const sharedClip = clipForSlot(clips, 'shared');
  const extraRef = txFrame.snapshot?.activeModelRef ?? undefined;
  const extraClip = extraRef ? clipForRef(clips, extraRef) : undefined;
  const extraOffset = offsetForStageModel(def, txFrame.snapshot?.activeModelStageId);
  const editSource = editDef ?? def;
  return (
    <group ref={root} position={def.rootPosition ?? ZERO3} rotation={[(def.rootRotation?.[0] ?? 0) * DEG, ((def.rootRotation?.[1] ?? 0) + (def.baseYawDeg ?? 0)) * DEG, (def.rootRotation?.[2] ?? 0) * DEG]} scale={def.modelScale ?? 1}>
      {(def.parts ?? []).map((p) => (
        <PartMesh key={p.key} part={p} color={p.color ?? color} />
      ))}
      {/* model slots — robot defaults to the character's GLB; plane/shared from the timeline refs */}
      <EditableModelGroup editMode={editMode} objKey={transformModelSlotKey(def.id, 'robot')} editOffset={offsetForSlot(editSource, 'robot')} runtimeOffset={robotOffset} groupRef={robot} hitbox={{ center: [0, 1.1, 0], size: [2.2, 2.8, 2.2] }}>
        {(def.robotModelRef ?? charModelId) && <AnimatedGlbModel assetId={(def.robotModelRef ?? charModelId)!} animation={robotClip?.clipName} animationSpeed={robotClip?.clipSpeed} loop={robotClip?.loop} autoPlayFirstClip={!!robotClip} noCull />}
      </EditableModelGroup>
      <EditableModelGroup editMode={editMode} objKey={transformModelSlotKey(def.id, 'plane')} editOffset={offsetForSlot(editSource, 'plane')} runtimeOffset={planeOffset} groupRef={plane} hitbox={{ center: [0, 0.7, 0], size: [3.2, 1.6, 3.2] }}>
        {def.planeModelRef && <AnimatedGlbModel assetId={def.planeModelRef} animation={planeClip?.clipName} animationSpeed={planeClip?.clipSpeed} loop={planeClip?.loop} autoPlayFirstClip={!!planeClip} noCull />}
      </EditableModelGroup>
      <EditableModelGroup editMode={editMode} objKey={transformModelSlotKey(def.id, 'shared')} editOffset={offsetForSlot(editSource, 'shared')} runtimeOffset={sharedOffset} groupRef={shared} hitbox={{ center: [0, 1, 0], size: [2.6, 2.4, 2.6] }}>
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
          hitbox={{ center: [0, 1, 0], size: [2.4, 2.4, 2.4] }}
          initialVisible
        >
          <AnimatedGlbModel assetId={extraRef} animation={extraClip?.clipName} animationSpeed={extraClip?.clipSpeed} loop={extraClip?.loop} autoPlayFirstClip={!!extraClip} noCull />
        </EditableModelGroup>
      )}
    </group>
  );
};
