import { Html } from '@react-three/drei';
import { EditableObject } from '../edit/EditableObject';
import { transformPartKey } from './transformPartKey';
import type { TransformationDefinition } from '../../types/game/transformation';

// Edit-only part anchors — each part's BASE position is a draggable EditableObject (shared SceneEditorGizmo:
// click → gizmo, W/E/R, Ctrl+Z), so the unfold origin of every part can be placed visually. The Parts
// sub-tab shows the live merged position and bakes edits into the timeline data.
export const TransformationDebugGizmos = ({ def }: { def: TransformationDefinition }) => (
  <>
    {(def.parts ?? []).map((p) => (
      <EditableObject
        key={p.key}
        objKey={transformPartKey(def.id, p.key)}
        base={{ position: p.basePosition, rotation: [0, 0, 0], scale: 1 }}
      >
        <group>
          <mesh>
            <sphereGeometry args={[0.14, 10, 10]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.6} />
          </mesh>
          <Html center distanceFactor={10} position={[0, 0.3, 0]}>
            <div className="pointer-events-none whitespace-nowrap rounded bg-slate-950/80 px-1 py-0.5 text-[9px] text-sky-100">{p.key}</div>
          </Html>
        </group>
      </EditableObject>
    ))}
  </>
);
