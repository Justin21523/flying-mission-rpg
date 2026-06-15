import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DoubleSide, type Group, type MeshStandardMaterial } from 'three';
import { useObstacleStore, liveObstacles, type LiveObstacle } from '../../stores/game/obstacleStore';
import { getObstacleDef } from '../../stores/game/editorObstacleStore';
import type { ObstacleDefinition } from '../../types/game/obstacle';

// Model-first obstacle visuals (Batch C). Each obstacle type has a distinct multi-state mesh — not an
// invisible wall: Energy Barrier = transparent panel + hex border (fades as it clears); Cracked Wall = block
// + crack lines (→ rubble when destroyed); Corrupted Device = machine box + offset rotating parts + warning
// panel (parts realign + colour goes safe when repaired). Driven by the obstacle's live state.

const EnergyBarrier = ({ o, def }: { o: LiveObstacle; def: ObstacleDefinition }) => {
  const matRef = useRef<MeshStandardMaterial>(null);
  const vs = def.visualStates[o.state];
  const opacity = vs?.opacity ?? (o.state === 'cleared' ? 0 : 0.4);
  useFrame(() => { if (matRef.current) matRef.current.emissiveIntensity = 0.4 + Math.sin(performance.now() / 300) * 0.2; });
  if (opacity <= 0.001) return null;
  return (
    <group>
      <mesh>
        <boxGeometry args={[2, 2, 1]} />
        <meshStandardMaterial ref={matRef} color={vs?.color ?? '#38bdf8'} emissive={vs?.color ?? '#38bdf8'} emissiveIntensity={0.5} transparent opacity={opacity} side={DoubleSide} depthWrite={false} />
      </mesh>
      {/* hex border frame */}
      <mesh>
        <boxGeometry args={[2.1, 2.1, 1.05]} />
        <meshBasicMaterial color={vs?.color ?? '#7dd3fc'} wireframe transparent opacity={Math.min(1, opacity * 2)} />
      </mesh>
    </group>
  );
};

// Pre-generated crack transforms (stable across renders — no impure calls in the render body).
const ALL_CRACKS = Array.from({ length: 6 }, () => ({
  pos: [(Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 2, 0.52] as [number, number, number],
  rot: Math.random() * Math.PI,
  len: 0.6 + Math.random() * 0.4,
}));

const CrackedWall = ({ o, def }: { o: LiveObstacle; def: ObstacleDefinition }) => {
  const vs = def.visualStates[o.state];
  const cracks = useMemo(() => ALL_CRACKS.slice(0, o.state === 'damaged' ? 6 : 2), [o.state]);
  if (o.state === 'destroyed') {
    // rubble chunks
    return (
      <group>
        {[[-0.5, 0.2, 0], [0.4, 0.15, 0.2], [0, 0.25, -0.3], [0.2, 0.1, 0.4]].map((p, i) => (
          <mesh key={i} position={p as [number, number, number]} rotation={[i, i * 0.7, 0]}>
            <boxGeometry args={[0.6, 0.5, 0.6]} />
            <meshStandardMaterial color={vs?.color ?? '#6b5b45'} />
          </mesh>
        ))}
      </group>
    );
  }
  return (
    <group>
      <mesh>
        <boxGeometry args={[2, 2.4, 1]} />
        <meshStandardMaterial color={vs?.color ?? '#8b7355'} />
      </mesh>
      {cracks.map((c, i) => (
        <mesh key={i} position={c.pos} rotation={[0, 0, c.rot]}>
          <boxGeometry args={[0.06, c.len, 0.02]} />
          <meshBasicMaterial color="#1c1917" />
        </mesh>
      ))}
    </group>
  );
};

const CorruptedDevice = ({ o, def }: { o: LiveObstacle; def: ObstacleDefinition }) => {
  const partsRef = useRef<Group>(null);
  const repaired = o.state === 'repaired';
  const vs = def.visualStates[o.state];
  useFrame((_, dt) => { if (partsRef.current && !repaired) partsRef.current.rotation.y += dt * 2; });
  return (
    <group>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[1.4, 1.6, 1.4]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      {/* offset/rotating core parts — realign when repaired */}
      <group ref={partsRef} position={[0, 1.6, 0]} rotation={repaired ? [0, 0, 0] : [0.3, 0, 0.2]}>
        <mesh><torusGeometry args={[0.5, 0.12, 8, 20]} /><meshStandardMaterial color={vs?.color ?? (repaired ? '#22c55e' : '#dc2626')} emissive={vs?.color ?? (repaired ? '#22c55e' : '#dc2626')} emissiveIntensity={0.6} /></mesh>
      </group>
      {/* warning / safe panel */}
      <mesh position={[0, 0.8, 0.72]}>
        <planeGeometry args={[0.8, 0.5]} />
        <meshBasicMaterial color={repaired ? '#22c55e' : '#ef4444'} />
      </mesh>
    </group>
  );
};

const ObstacleEntity = ({ o }: { o: LiveObstacle }) => {
  const def = getObstacleDef(o.defId);
  if (!def) return null;
  const s = def.transform.scale;
  return (
    <group position={[o.x, o.y, o.z]} rotation={def.transform.rotation} scale={s}>
      {def.obstacleType === 'energy-barrier' && <EnergyBarrier o={o} def={def} />}
      {def.obstacleType === 'cracked-wall' && <CrackedWall o={o} def={def} />}
      {def.obstacleType === 'corrupted-device' && <CorruptedDevice o={o} def={def} />}
    </group>
  );
};

export const ObstacleRenderer = () => {
  useObstacleStore((s) => s.version);
  return <>{liveObstacles.map((o) => <ObstacleEntity key={o.id} o={o} />)}</>;
};
