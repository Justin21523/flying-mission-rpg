import { Html } from '@react-three/drei';
import type { TransformationDefinition } from '../../types/game/transformation';

// Edit-only overlay — labels each part's base anchor so the timeline's part references are visible in place.
export const TransformationDebugGizmos = ({ def }: { def: TransformationDefinition }) => (
  <>
    {def.parts.map((p) => (
      <group key={p.key} position={p.basePosition}>
        <mesh>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <Html center distanceFactor={10} position={[0, 0.25, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded bg-slate-950/80 px-1 py-0.5 text-[9px] text-sky-100">{p.key}</div>
        </Html>
      </group>
    ))}
  </>
);
