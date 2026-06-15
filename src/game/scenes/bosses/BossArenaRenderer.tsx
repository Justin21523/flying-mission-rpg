import * as THREE from 'three';
import { useBossStore } from '../../../stores/game/useBossStore';
import { activeArena, isArenaLocked } from '../../bosses/BossArenaController';

// Boss arena boundary + markers (Batch F) — a translucent boundary ring (cylinder shell) shown while the
// arena is locked, plus boss-spawn / player-start markers. Geometry, not particles.
export const BossArenaRenderer = () => {
  useBossStore((s) => s.version);
  const arena = activeArena();
  if (!arena || !isArenaLocked()) return null;
  const [cx, , cz] = arena.bounds.center;
  const radius = Math.max(arena.bounds.size[0], arena.bounds.size[2]) / 2;
  const [bx, , bz] = arena.bossSpawnPosition;
  const [px, , pz] = arena.playerStartPosition;

  return (
    <group>
      {/* boundary shell */}
      <mesh position={[cx, 1.5, cz]}>
        <cylinderGeometry args={[radius, radius, 3, 48, 1, true]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* boundary ring on the ground */}
      <mesh position={[cx, 0.05, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.3, radius, 48]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* boss spawn marker */}
      <mesh position={[bx, 0.06, bz]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.4, 1.7, 24]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* player start marker */}
      <mesh position={[px, 0.06, pz]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1, 24]} />
        <meshBasicMaterial color="#34d399" transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
};
