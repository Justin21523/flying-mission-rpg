import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { usePlayerStore } from '../../stores/playerStore';
import { useBoostStore } from '../../stores/boostStore';
import { getBoostConfig } from '../../stores/editorBoostStore';
import { playerMotion } from './playerMotion';

// POLI — afterimage (分身) trail rendered while super-boost mode is active: a pool of fading ghost capsules
// dropped behind the player at the configured interval. Pure-ref updates (no per-frame allocation / no
// re-renders). Rendered as a sibling of the Player in Scene.
const MAX = 14;

interface Ghost { t: number; x: number; y: number; z: number; ry: number }

export const AfterimageLayer = () => {
  const meshes = useRef<(Mesh | null)[]>(Array.from({ length: MAX }, () => null));
  const ghosts = useRef<Ghost[]>(Array.from({ length: MAX }, () => ({ t: -99, x: 0, y: 0, z: 0, ry: 0 })));
  const head = useRef(0);
  const lastSpawn = useRef(0);

  useFrame((state) => {
    const tnow = state.clock.elapsedTime;
    const s = useBoostStore.getState();
    const cfg = getBoostConfig();
    if (s.superActive) {
      if (tnow - lastSpawn.current >= cfg.afterimageIntervalSec) {
        lastSpawn.current = tnow;
        const pp = usePlayerStore.getState().position;
        if (pp) {
          const g = ghosts.current[head.current % MAX];
          g.t = tnow; g.x = pp.x; g.y = pp.y; g.z = pp.z; g.ry = playerMotion.heading;
          head.current++;
        }
      }
    }
    const life = Math.max(0.1, cfg.afterimageLifeSec);
    for (let i = 0; i < MAX; i++) {
      const m = meshes.current[i];
      const g = ghosts.current[i];
      if (!m) continue;
      const age = tnow - g.t;
      if (age < 0 || age > life) { m.visible = false; continue; }
      m.visible = true;
      m.position.set(g.x, g.y + 0.9, g.z);
      m.rotation.y = g.ry;
      const k = 1 - age / life;
      const mat = m.material as { opacity: number };
      mat.opacity = 0.5 * k;
      const sc = 0.7 + 0.3 * k;
      m.scale.set(sc, sc, sc);
    }
  });

  return (
    <>
      {Array.from({ length: MAX }, (_, i) => (
        <mesh key={i} ref={(el) => { meshes.current[i] = el; }} visible={false}>
          <capsuleGeometry args={[0.4, 0.9, 4, 8]} />
          <meshStandardMaterial color="#38bdf8" emissive="#22d3ee" emissiveIntensity={0.8} transparent opacity={0.4} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
};
