import { Html } from '@react-three/drei';
import { EditableObject } from '../edit/EditableObject';
import { transformPartKey, transformRootKey, transformStageModelKey, transformEffectKey, transformStageMoveKey, transformCameraShotKey, transformStagePartMoveKey, transformCameraLookKey } from './transformPartKey';
import { cameraShotAnchor } from './transformationOverrides';
import type { TransformationDefinition, TransformationTransformOffset } from '../../types/game/transformation';

const DEG = Math.PI / 180;
const DEFAULT_OFFSET: TransformationTransformOffset = { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 };

const Label = ({ text }: { text: string }) => (
  <Html center distanceFactor={10} position={[0, 0.3, 0]}>
    <div className="pointer-events-none whitespace-nowrap rounded bg-slate-950/80 px-1 py-0.5 text-[9px] text-sky-100">{text}</div>
  </Html>
);

const offsetBase = (offset: TransformationTransformOffset | undefined) => {
  const o = offset ?? DEFAULT_OFFSET;
  return { position: o.position, rotation: [o.rotation[0] * DEG, o.rotation[1] * DEG, o.rotation[2] * DEG] as [number, number, number], scale: o.scale };
};

const ModelAnchor = ({ objKey, label, color, offset }: { objKey: string; label: string; color: string; offset?: TransformationTransformOffset }) => (
  <EditableObject objKey={objKey} base={offsetBase(offset)}>
    <group>
      <mesh>
        <boxGeometry args={[0.32, 0.32, 0.32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} />
      </mesh>
      <Label text={label} />
    </group>
  </EditableObject>
);

// Edit-only anchors — PART anchors + model-swap stage refs use the shared SceneEditorGizmo (click → gizmo,
// W/E/R, Ctrl+Z). The robot/plane/shared MODEL SLOTS are NOT anchored here: the real models (rendered by
// TransformationCharacterPresenter via EditableModelGroup with the same keys) are the selectable gizmo
// targets, so clicking the actual character model edits it — no duplicate proxy. The tab shows live values.
export const TransformationDebugGizmos = ({ def }: { def: TransformationDefinition }) => (
  <>
    <EditableObject
      objKey={transformRootKey(def.id)}
      base={{ position: def.rootPosition ?? [0, 0, 0], rotation: [(def.rootRotation?.[0] ?? 0) * DEG, (def.rootRotation?.[1] ?? 0) * DEG, (def.rootRotation?.[2] ?? 0) * DEG], scale: def.modelScale ?? 1 }}
    >
      <group>
        <mesh>
          <boxGeometry args={[1.2, 1.8, 1.2]} />
          <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.35} wireframe transparent opacity={0.4} />
        </mesh>
        <Label text="root" />
      </group>
    </EditableObject>
    {(def.parts ?? []).map((p) => (
      <EditableObject
        key={p.key}
        objKey={transformPartKey(def.id, p.key)}
        base={{ position: p.basePosition, rotation: [p.baseRotation[0] * DEG, p.baseRotation[1] * DEG, p.baseRotation[2] * DEG], scale: p.baseScale }}
      >
        <group>
          <mesh>
            <sphereGeometry args={[0.14, 10, 10]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.6} />
          </mesh>
          <Label text={p.key} />
        </group>
      </EditableObject>
    ))}
    {def.stages.filter((s) => s.type === 'model-swap' && !!s.params.modelRef).map((s) => (
      <ModelAnchor key={s.id} objKey={transformStageModelKey(def.id, s.id)} label={s.label ?? s.id} color="#facc15" offset={s.params.modelOffset} />
    ))}
    {/* model-move stage targets — drag/rotate/scale the move destination. */}
    {def.stages.filter((s) => s.type === 'model-move').map((s) => (
      <ModelAnchor
        key={s.id}
        objKey={transformStageMoveKey(def.id, s.id)}
        label={`move ${s.label ?? s.id}`}
        color="#34d399"
        offset={{ position: s.params.toPosition ?? [0, 0, 0], rotation: s.params.toRotation ?? [0, 0, 0], scale: s.params.toScale ?? 1 }}
      />
    ))}
    {/* part-transform destinations — drag/rotate/scale where the part animates to. */}
    {def.stages.filter((s) => s.type === 'part-transform').map((s) => (
      <ModelAnchor
        key={s.id}
        objKey={transformStagePartMoveKey(def.id, s.id)}
        label={`→ ${s.params.partKey ?? s.label ?? s.id}`}
        color="#22d3ee"
        offset={{ position: s.params.toPosition ?? [0, 0, 0], rotation: s.params.toRotation ?? [0, 0, 0], scale: s.params.toScale ?? 1 }}
      />
    ))}
    {/* effect-track spawn points. */}
    {(def.effectTracks ?? []).map((fx) => (
      <EditableObject key={fx.id} objKey={transformEffectKey(def.id, fx.id)} base={{ position: fx.spawnOffset ?? [0, 0, 0], rotation: [0, 0, 0], scale: 1 }}>
        <group>
          <mesh rotation={[0, Math.PI / 4, 0]}>
            <octahedronGeometry args={[0.18, 0]} />
            <meshStandardMaterial color={fx.color ?? '#f472b6'} emissive={fx.color ?? '#f472b6'} emissiveIntensity={0.6} />
          </mesh>
          <Label text={`fx ${fx.type}`} />
        </group>
      </EditableObject>
    ))}
    {/* camera-shot orbit anchors — drag to set distance/height/angle. */}
    {(def.cameraShots ?? []).map((sh) => (
      <EditableObject key={sh.id} objKey={transformCameraShotKey(def.id, sh.id)} base={{ position: cameraShotAnchor(sh.distance, sh.height, sh.angle), rotation: [0, 0, 0], scale: 1 }}>
        <group>
          <mesh>
            <coneGeometry args={[0.16, 0.34, 8]} />
            <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.6} />
          </mesh>
          <Label text={`cam ${sh.type}`} />
        </group>
      </EditableObject>
    ))}
    {/* camera-shot look-at targets — drag the point the camera aims at. */}
    {(def.cameraShots ?? []).map((sh) => (
      <EditableObject key={sh.id} objKey={transformCameraLookKey(def.id, sh.id)} base={{ position: sh.lookAtOffset ?? [0, 0.4, 0], rotation: [0, 0, 0], scale: 1 }}>
        <group>
          <mesh>
            <sphereGeometry args={[0.12, 10, 10]} />
            <meshStandardMaterial color="#c084fc" emissive="#c084fc" emissiveIntensity={0.5} />
          </mesh>
          <Label text={`look ${sh.type}`} />
        </group>
      </EditableObject>
    ))}
  </>
);
