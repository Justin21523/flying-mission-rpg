import { useCallback, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color, type Mesh, type MeshBasicMaterial } from 'three';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { getEditorCharacter, useEditorCharacterStore } from '../../stores/game/editorCharacterStore';
import { robotHandle } from './robotHandle';

// Continuous gas-jet exhaust under the robot while it is FLYING (F). A small pooled set of additive puffs
// (no per-frame allocation, no store reads in useFrame) streamed from the underside + slightly behind the
// heading, sinking and fading over a short life — gives take-off/hover a 3D thruster feel.
const POOL = 20;
const SPAWN_INTERVAL = 0.04; // seconds between puffs while flying
const LIFE = 0.55; // puff lifetime (s)
const BASE_OPACITY = 0.6;

interface Puff { t: number; x: number; y: number; z: number; vx: number; vy: number; vz: number; }

export const GroundJetExhaustLayer = () => {
  const charId = useCharacterStore((s) => s.selectedCharacterId);
  useEditorCharacterStore((s) => s.items);
  const character = charId ? getEditorCharacter(charId) : undefined;

  const meshes = useRef<(Mesh | null)[]>(Array.from({ length: POOL }, () => null));
  const mats = useRef<(MeshBasicMaterial | null)[]>(Array.from({ length: POOL }, () => null));
  const puffs = useRef<Puff[]>(Array.from({ length: POOL }, () => ({ t: -99, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 })));
  const head = useRef(0);
  const lastSpawn = useRef(0);
  const tint = useRef(new Color('#bfe9ff'));

  const setMesh = useCallback((i: number, el: Mesh | null) => { meshes.current[i] = el; }, []);
  const setMat = useCallback((i: number, m: MeshBasicMaterial | null) => { mats.current[i] = m; }, []);

  useEffect(() => { tint.current.set(character?.color ?? '#bfe9ff'); }, [character?.color]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const now = performance.now() / 1000;

    if (robotHandle.flying && now - lastSpawn.current >= SPAWN_INTERVAL) {
      lastSpawn.current = now;
      // Emit just behind the heading, under the chassis, with a downward + backward + slight-spread velocity.
      const bx = -Math.sin(robotHandle.heading);
      const bz = -Math.cos(robotHandle.heading);
      const puff = puffs.current[head.current % POOL];
      puff.t = now;
      puff.x = robotHandle.pos.x + bx * 0.35 + (Math.random() - 0.5) * 0.2;
      puff.y = robotHandle.pos.y - 0.6;
      puff.z = robotHandle.pos.z + bz * 0.35 + (Math.random() - 0.5) * 0.2;
      puff.vx = bx * 1.2 + (Math.random() - 0.5) * 0.6;
      puff.vy = -2.4 - Math.random() * 1.2;
      puff.vz = bz * 1.2 + (Math.random() - 0.5) * 0.6;
      head.current += 1;
    }

    for (let i = 0; i < POOL; i += 1) {
      const mesh = meshes.current[i];
      const puff = puffs.current[i];
      if (!mesh) continue;
      const age = now - puff.t;
      if (age < 0 || age > LIFE) { mesh.visible = false; continue; }
      const k = 1 - age / LIFE;
      puff.x += puff.vx * dt;
      puff.y += puff.vy * dt;
      puff.z += puff.vz * dt;
      mesh.visible = true;
      mesh.position.set(puff.x, puff.y, puff.z);
      const sc = 0.2 + 0.5 * (1 - k); // grows as it dissipates
      mesh.scale.setScalar(sc);
      const mat = mats.current[i];
      if (mat) { mat.opacity = BASE_OPACITY * k; mat.color.copy(tint.current); }
    }
  });

  return (
    <>
      {Array.from({ length: POOL }).map((_, i) => (
        <mesh key={i} ref={(el) => setMesh(i, el)} visible={false}>
          <sphereGeometry args={[0.5, 8, 8]} />
          <meshBasicMaterial
            ref={(el) => setMat(i, el as MeshBasicMaterial | null)}
            color="#bfe9ff"
            transparent
            opacity={0}
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </mesh>
      ))}
    </>
  );
};
