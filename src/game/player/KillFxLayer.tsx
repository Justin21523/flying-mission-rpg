import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useGLTF } from '@react-three/drei';
import { Box3, Vector3, MeshStandardMaterial, type Group, type Mesh } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { usePlayerStore } from '../../stores/playerStore';
import { useTransformStore } from '../../stores/transformStore';
import { useEditorPoliCharacterStore, getMergedPoliCharacter } from '../../stores/editorPoliCharacterStore';
import { CORE_TEAM } from '../../data/characters/coreTeam';
import { drainKills, type KillEvent } from '../../stores/yokaiCombatStore';
import { playSfx } from '../../game/audio/sfx';

// POLI yokai-hunt (Phase C) — on each yokai defeat (drained from the kill queue): a bright clone of the player
// pops above their head and floats up while fading + spinning (the "分身"), and rising "+N XP" (green) / "+N"
// (gold) popups with a little icon dot fade upward. Pooled, no per-frame allocation. Mounted in Scene (play).

const CLONES = 6;
const POPUPS = 8;
const CLONE_LIFE = 1.1;
const POPUP_LIFE = 1.2;
const _kills: KillEvent[] = [];

interface CloneSlot { active: boolean; t: number; x: number; y: number; z: number }
interface PopupSlot { active: boolean; t: number; x: number; y: number; z: number; coin: boolean }

// A normalized, independent clone of one model (shared bright material for fading).
const CloneModel = ({ index, path, height, yOff, yawRad, setGroup, setMat }: {
  index: number; path: string; height: number; yOff: number; yawRad: number;
  setGroup: (i: number, g: Group | null) => void; setMat: (i: number, m: MeshStandardMaterial | null) => void;
}) => {
  const { scene } = useGLTF(path);
  const { clone, scale, offset, mat } = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    const box = new Box3().setFromObject(c);
    const size = new Vector3(); const center = new Vector3();
    box.getSize(size); box.getCenter(center);
    const nativeH = Number.isFinite(size.y) && size.y > 1e-4 ? size.y : 1;
    const s = height / nativeH;
    const ox = Number.isFinite(center.x) ? -center.x * s : 0;
    const oy = (Number.isFinite(box.min.y) ? -box.min.y * s : 0) + yOff;
    const oz = Number.isFinite(center.z) ? -center.z * s : 0;
    const m = new MeshStandardMaterial({ color: '#ffffff', emissive: '#fde68a', emissiveIntensity: 0.6, transparent: true, opacity: 0, depthWrite: false });
    c.traverse((o) => { const mesh = o as Mesh; if (mesh.isMesh) mesh.material = m; });
    return { clone: c, scale: s, offset: [ox, oy, oz] as [number, number, number], mat: m };
  }, [scene, height, yOff]);
  useEffect(() => { setMat(index, mat); return () => { mat.dispose(); setMat(index, null); }; }, [mat, index, setMat]);
  return (
    <group ref={(el) => setGroup(index, el)} visible={false}>
      <group rotation={[0, yawRad, 0]}><primitive object={clone} scale={scale} position={offset} /></group>
    </group>
  );
};

export const KillFxLayer = () => {
  const { camera } = useThree();
  const charId = useTransformStore((s) => s.charId);
  const form = useTransformStore((s) => s.form);
  const override = useEditorPoliCharacterStore((s) => s.overrides[charId]);
  const base = CORE_TEAM.find((c) => c.id === charId);
  const path = (form === 'vehicle' ? (override?.modelVehiclePath || base?.modelVehiclePath) : (override?.modelRobotPath || base?.modelRobotPath)) || '';
  const merged = base ? getMergedPoliCharacter(base) : undefined;
  const height = form === 'vehicle' ? (merged?.vehicleHeight ?? 1.4) : (merged?.robotHeight ?? 1.9);
  const yOff = merged?.modelYOffset ?? 0;
  const yawRad = ((merged?.modelYawDeg ?? -90) * Math.PI) / 180;

  const cloneGroups = useRef<(Group | null)[]>(Array.from({ length: CLONES }, () => null));
  const cloneMats = useRef<(MeshStandardMaterial | null)[]>(Array.from({ length: CLONES }, () => null));
  const cloneSlots = useRef<CloneSlot[]>(Array.from({ length: CLONES }, () => ({ active: false, t: 0, x: 0, y: 0, z: 0 })));
  const cloneHead = useRef(0);
  const setCloneGroup = useCallback((i: number, el: Group | null) => { cloneGroups.current[i] = el; }, []);
  const setCloneMat = useCallback((i: number, m: MeshStandardMaterial | null) => { cloneMats.current[i] = m; }, []);

  const popupGroups = useRef<(Group | null)[]>(Array.from({ length: POPUPS }, () => null));
  const popupTexts = useRef<(({ text: string; sync: () => void }) | null)[]>(Array.from({ length: POPUPS }, () => null));
  const popupSlots = useRef<PopupSlot[]>(Array.from({ length: POPUPS }, () => ({ active: false, t: 0, x: 0, y: 0, z: 0, coin: false })));
  const popupHead = useRef(0);

  const activatePopup = (x: number, y: number, z: number, coin: boolean, label: string) => {
    const i = popupHead.current % POPUPS; popupHead.current++;
    const s = popupSlots.current[i];
    s.active = true; s.t = 0; s.x = x; s.y = y; s.z = z; s.coin = coin;
    const txt = popupTexts.current[i];
    if (txt) { txt.text = label; txt.sync(); }
  };

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    // Drain new defeats → spawn a clone above the player + two rising popups + sfx.
    const n = drainKills(_kills);
    if (n > 0) {
      const pp = usePlayerStore.getState().position;
      for (let k = 0; k < n; k++) {
        const ev = _kills[k];
        playSfx('rescueSuccess');
        if (pp) {
          const ci = cloneHead.current % CLONES; cloneHead.current++;
          const cs = cloneSlots.current[ci];
          cs.active = true; cs.t = 0; cs.x = pp.x; cs.y = pp.y + 1.8; cs.z = pp.z;
          activatePopup(pp.x - 0.5, pp.y + 2.0, pp.z, false, `+${ev.exp} XP`);
          activatePopup(pp.x + 0.6, pp.y + 1.6, pp.z, true, `+${ev.coin}`);
        }
      }
    }

    // Clones: float up, spin, fade out.
    for (let i = 0; i < CLONES; i++) {
      const g = cloneGroups.current[i]; const s = cloneSlots.current[i]; const mat = cloneMats.current[i];
      if (!g) continue;
      if (!s.active) { if (g.visible) g.visible = false; continue; }
      s.t += dt;
      if (s.t >= CLONE_LIFE) { s.active = false; g.visible = false; continue; }
      const k = s.t / CLONE_LIFE;
      g.visible = true;
      g.position.set(s.x, s.y + k * 2.2, s.z);
      g.rotation.y += dt * 4;
      const sc = 0.6 + k * 0.2;
      g.scale.setScalar(sc);
      if (mat) mat.opacity = (1 - k) * 0.9;
    }

    // Popups: rise + fade (face the camera). Fade via fillOpacity won't animate cheaply → shrink + rise reads
    // as a fade; visible toggles off at the end.
    for (let i = 0; i < POPUPS; i++) {
      const g = popupGroups.current[i]; const s = popupSlots.current[i];
      if (!g) continue;
      if (!s.active) { if (g.visible) g.visible = false; continue; }
      s.t += dt;
      if (s.t >= POPUP_LIFE) { s.active = false; g.visible = false; continue; }
      const k = s.t / POPUP_LIFE;
      g.visible = true;
      g.position.set(s.x, s.y + k * 1.6, s.z);
      g.quaternion.copy(camera.quaternion); // billboard
      const sc = k > 0.7 ? Math.max(0, 1 - (k - 0.7) / 0.3) : 1; // shrink out at the end
      g.scale.setScalar(sc);
    }
  });

  return (
    <>
      {path && Array.from({ length: CLONES }, (_, i) => (
        <CloneModel key={`${path}-${i}`} index={i} path={path} height={height} yOff={yOff} yawRad={yawRad} setGroup={setCloneGroup} setMat={setCloneMat} />
      ))}
      {Array.from({ length: POPUPS }, (_, i) => {
        const coin = i % 2 === 1;
        return (
          <group key={`p${i}`} ref={(el) => { popupGroups.current[i] = el; }} visible={false}>
            <mesh position={[-0.45, 0, 0]}>
              <sphereGeometry args={[0.14, 10, 8]} />
              <meshBasicMaterial color={coin ? '#fbbf24' : '#4ade80'} />
            </mesh>
            <Text ref={(el) => { popupTexts.current[i] = el as unknown as { text: string; sync: () => void } | null; }}
              position={[0, 0, 0]} fontSize={0.42} color={coin ? '#fde68a' : '#86efac'} anchorX="left" anchorY="middle"
              outlineWidth={0.04} outlineColor="#0a0a0a" renderOrder={3}>+
            </Text>
          </group>
        );
      })}
    </>
  );
};
