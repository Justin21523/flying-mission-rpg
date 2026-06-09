import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Box3, Color, Vector3, MeshStandardMaterial, type Group, type Mesh } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { usePlayerStore } from '../../stores/playerStore';
import { useBoostStore } from '../../stores/boostStore';
import { getBoostConfig } from '../../stores/editorBoostStore';
import { useTransformStore } from '../../stores/transformStore';
import { getMergedPoliCharacter, useEditorPoliCharacterStore } from '../../stores/editorPoliCharacterStore';
import { CORE_TEAM } from '../../data/characters/coreTeam';
import { playerMotion } from './playerMotion';

// POLI — afterimage (分身) trail rendered while super-boost mode is active: a pool of fading ghost copies of
// the player's OWN model (current character + form) dropped behind the player at the configured interval.
// Falls back to a capsule only when the character has no GLB. Pure-ref updates (no per-frame allocation / no
// re-renders). Rendered as a sibling of the Player in Scene.
const MAX = 14;

interface Ghost { t: number; x: number; y: number; z: number; ry: number }

// One ghost = a normalized SkeletonUtils clone of the model (static bind pose) with its own ghost material, so
// the parent can fade each independently. Registers its group + material into the shared ref arrays by index.
const GhostModel = ({ index, path, height, yOff, yawRad, setGroup, setMat }: {
  index: number; path: string; height: number; yOff: number; yawRad: number;
  setGroup: (i: number, g: Group | null) => void; setMat: (i: number, m: MeshStandardMaterial | null) => void;
}) => {
  const { scene } = useGLTF(path);
  const { clone, scale, offset, mat } = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    const box = new Box3().setFromObject(c);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);
    const nativeH = Number.isFinite(size.y) && size.y > 1e-4 ? size.y : 1;
    const s = height / nativeH;
    const ox = Number.isFinite(center.x) ? -center.x * s : 0;
    const oy = (Number.isFinite(box.min.y) ? -box.min.y * s : 0) + yOff;
    const oz = Number.isFinite(center.z) ? -center.z * s : 0;
    const m = new MeshStandardMaterial({ transparent: true, opacity: 0.4, depthWrite: false, emissiveIntensity: 0.8 });
    c.traverse((o) => { const mesh = o as Mesh; if (mesh.isMesh) mesh.material = m; });
    return { clone: c, scale: s, offset: [ox, oy, oz] as [number, number, number], mat: m };
  }, [scene, height, yOff]);

  useEffect(() => {
    setMat(index, mat);
    return () => { mat.dispose(); setMat(index, null); };
  }, [mat, index, setMat]);

  return (
    <group ref={(el) => setGroup(index, el)} visible={false}>
      <group rotation={[0, yawRad, 0]}>
        <primitive object={clone} scale={scale} position={offset} />
      </group>
    </group>
  );
};

export const AfterimageLayer = () => {
  const charId = useTransformStore((s) => s.charId);
  const form = useTransformStore((s) => s.form);
  const override = useEditorPoliCharacterStore((s) => s.overrides[charId]);
  const base = CORE_TEAM.find((c) => c.id === charId);
  const path = (form === 'vehicle' ? (override?.modelVehiclePath || base?.modelVehiclePath) : (override?.modelRobotPath || base?.modelRobotPath)) || '';
  const height = form === 'vehicle' ? (override?.vehicleHeight ?? base?.vehicleHeight ?? 1.4) : (override?.robotHeight ?? base?.robotHeight ?? 1.9);
  const yOff = override?.modelYOffset ?? base?.modelYOffset ?? 0;
  const yawRad = ((override?.modelYawDeg ?? base?.modelYawDeg ?? -90) * Math.PI) / 180;

  const groups = useRef<(Group | null)[]>(Array.from({ length: MAX }, () => null));
  const mats = useRef<(MeshStandardMaterial | null)[]>(Array.from({ length: MAX }, () => null));
  const ghosts = useRef<Ghost[]>(Array.from({ length: MAX }, () => ({ t: -99, x: 0, y: 0, z: 0, ry: 0 })));
  const head = useRef(0);
  const lastSpawn = useRef(0);
  const tint = useRef(new Color('#38bdf8'));
  const setGroup = useCallback((i: number, el: Group | null) => { groups.current[i] = el; }, []);
  const setMat = useCallback((i: number, m: MeshStandardMaterial | null) => { mats.current[i] = m; }, []);

  useFrame((state) => {
    const tnow = state.clock.elapsedTime;
    const s = useBoostStore.getState();
    const cfg = getBoostConfig();
    if (s.superActive) {
      // The afterimage colour matches the CHARACTER'S colour (not a separate afterimage colour).
      const col = (base ? getMergedPoliCharacter(base).color : undefined) ?? '#38bdf8';
      tint.current.set(col);
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
      const grp = groups.current[i];
      const g = ghosts.current[i];
      if (!grp) continue;
      const age = tnow - g.t;
      if (age < 0 || age > life) { grp.visible = false; continue; }
      grp.visible = true;
      grp.position.set(g.x, g.y, g.z);
      grp.rotation.y = g.ry;
      const k = 1 - age / life;
      const sc = 0.7 + 0.3 * k;
      grp.scale.set(sc, sc, sc);
      const mat = mats.current[i];
      if (mat) {
        mat.opacity = 0.5 * k;
        mat.color.copy(tint.current);
        mat.emissive.copy(tint.current);
      }
    }
  });

  // Model ghosts when the character has a GLB; otherwise a capsule fallback. Keyed by path+form so the pool
  // reloads when you switch character / form (C / T).
  if (path) {
    return (
      <>
        {Array.from({ length: MAX }, (_, i) => (
          <GhostModel key={`${path}-${i}`} index={i} path={path} height={height} yOff={yOff} yawRad={yawRad} setGroup={setGroup} setMat={setMat} />
        ))}
      </>
    );
  }
  return (
    <>
      {Array.from({ length: MAX }, (_, i) => (
        <group key={i} ref={(el) => setGroup(i, el)} visible={false}>
          <mesh position={[0, 0.9, 0]} ref={(el) => setMat(i, el ? (el.material as MeshStandardMaterial) : null)}>
            <capsuleGeometry args={[0.4, 0.9, 4, 8]} />
            <meshStandardMaterial color="#38bdf8" emissive="#22d3ee" emissiveIntensity={0.8} transparent opacity={0.4} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </>
  );
};
