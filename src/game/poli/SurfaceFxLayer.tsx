import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, MeshBasicMaterial } from 'three';
import { useUiStore } from '../../stores/uiStore';
import { usePlayerStore } from '../../stores/playerStore';
import { surfaceField } from '../path/surfaceField';
import { playerMotion } from '../player/playerMotion';

// POLI (H2) — surface VFX: while the player moves over a surface zone (mud/sand/ice/…), kick up small pooled
// puff particles in the surface's colour. Fixed pool, all state mutated in useFrame (no per-frame allocation).
const POOL = 14;
const LIFE = 0.55;
const SPAWN_EVERY = 0.06;
const SURFACE_COLOR: Record<string, string> = {
  mud: '#92400e', sand: '#fcd34d', dirt: '#a16207', gravel: '#9ca3af', grass: '#65a30d',
  ice: '#bae6fd', water: '#38bdf8', boostSurface: '#22d3ee', snow: '#e2e8f0',
};

interface Slot { active: boolean; t: number; x: number; y: number; z: number; vx: number; vy: number; vz: number }

export const SurfaceFxLayer = () => {
  const editMode = useUiStore((s) => s.editMode);
  const groups = useRef<(Group | null)[]>(Array.from({ length: POOL }, () => null));
  const mats = useRef<(MeshBasicMaterial | null)[]>(Array.from({ length: POOL }, () => null));
  const slots = useRef<Slot[]>(Array.from({ length: POOL }, () => ({ active: false, t: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 })));
  const head = useRef(0);
  const spawnAcc = useRef(0);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const type = surfaceField.currentType;
    const color = SURFACE_COLOR[type];
    const pp = usePlayerStore.getState().position;

    // Spawn while moving on a coloured surface (skip in edit mode / when idle / on plain ground).
    if (!editMode && color && pp && playerMotion.speed > 1.2) {
      spawnAcc.current += dt;
      while (spawnAcc.current >= SPAWN_EVERY) {
        spawnAcc.current -= SPAWN_EVERY;
        const s = slots.current[head.current % POOL]; head.current++;
        s.active = true; s.t = 0;
        s.x = pp.x + (Math.random() - 0.5) * 0.5; s.y = pp.y + 0.1; s.z = pp.z + (Math.random() - 0.5) * 0.5;
        s.vx = (Math.random() - 0.5) * 1.2; s.vy = 1 + Math.random() * 0.8; s.vz = (Math.random() - 0.5) * 1.2;
        const m = mats.current[(head.current - 1) % POOL]; if (m) m.color.set(color);
      }
    }

    // Advance + fade each active particle.
    for (let i = 0; i < POOL; i++) {
      const s = slots.current[i];
      const g = groups.current[i];
      if (!g) continue;
      if (!s.active) { g.visible = false; continue; }
      s.t += dt;
      if (s.t >= LIFE) { s.active = false; g.visible = false; continue; }
      s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; s.vy -= 4 * dt;
      g.visible = true;
      g.position.set(s.x, s.y, s.z);
      const k = 1 - s.t / LIFE;
      const sc = 0.12 + (1 - k) * 0.14; g.scale.set(sc, sc, sc);
      const m = mats.current[i]; if (m) m.opacity = k;
    }
  });

  return (
    <>
      {Array.from({ length: POOL }, (_, i) => (
        <group key={i} ref={(el) => { groups.current[i] = el; }} visible={false}>
          <mesh raycast={() => null}>
            <sphereGeometry args={[1, 6, 5]} />
            <meshBasicMaterial ref={(m) => { mats.current[i] = m as MeshBasicMaterial; }} transparent opacity={0} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </>
  );
};
