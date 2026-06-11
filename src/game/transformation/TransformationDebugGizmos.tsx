import { Html } from '@react-three/drei';
import { EditableObject } from '../edit/EditableObject';
import { transformPartKey, transformStageModelKey } from './transformPartKey';
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
  </>
);
