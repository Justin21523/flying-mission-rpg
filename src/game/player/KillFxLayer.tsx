import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, useGLTF } from '@react-three/drei';
import { AnimationMixer, LoopRepeat, Vector3, type AnimationAction, type Group, type Material } from 'three';
import { usePlayerStore } from '../../stores/playerStore';
import { useTransformStore } from '../../stores/transformStore';
import { useEditorPoliCharacterStore, getMergedPoliCharacter } from '../../stores/editorPoliCharacterStore';
import { CORE_TEAM } from '../../data/characters/coreTeam';
import { drainKills, type KillEvent } from '../../stores/yokaiCombatStore';
import { playSfx } from '../../game/audio/sfx';
import { buildPlayerClone, pickHappyClip, setCloneOpacity } from './cloneUtils';
import type { AnimRule } from '../../types/character';

// POLI yokai-hunt — on each yokai defeat: FOUR identical, animated player clones (真‧分身) burst toward the
// four screen diagonals (up-left / up-right / down-left / down-right), play a happy animation, and fade out;
// plus rising "+N XP" (green) / "+N" coin (gold) popups. Pooled, no per-frame allocation. Mounted in Scene.

const CLONES = 4;         // hard cap: only ever 4 clone instances (a burst reuses the same 4 slots)
const POPUPS = 8;
const CLONE_LIFE = 3.0;   // total lifetime — clones linger longer before vanishing
const POPUP_LIFE = 1.2;
const SPREAD = 2.6;       // how far the clones drift out along their diagonal (slower with the longer life)
const BURST_COOLDOWN = 1.0; // min seconds between clone bursts — rapid kills still spawn only one set of 4
const _kills: KillEvent[] = [];
// Sign pairs for the 4 screen diagonals (right, up): UL, UR, DL, DR.
const DIAG: [number, number][] = [[-1, 1], [1, 1], [-1, -1], [1, -1]];

interface CloneSlot { active: boolean; t: number; x: number; y: number; z: number; dx: number; dy: number; dz: number; spin: number }
interface PopupSlot { active: boolean; t: number; x: number; y: number; z: number }

// One pooled clone: a real-material copy of the player that loops a happy clip; exposes its group + materials
// so the parent can position + fade it.
const CloneModel = ({ index, path, height, yOff, yawRad, animRules, setGroup, setMats }: {
  index: number; path: string; height: number; yOff: number; yawRad: number; animRules?: AnimRule[];
  setGroup: (i: number, g: Group | null) => void; setMats: (i: number, m: Material[]) => void;
}) => {
  const { scene, animations } = useGLTF(path);
  const { clone, scale, offset, materials } = useMemo(() => buildPlayerClone(scene, height, yOff), [scene, height, yOff]);
  const mixer = useMemo(() => new AnimationMixer(clone), [clone]);
  useEffect(() => {
    setMats(index, materials);
    const clips = animations ?? [];
    const clipName = pickHappyClip(animations, animRules);
    const clip = clips.find((c) => c.name === clipName) ?? clips[0];
    let act: AnimationAction | undefined;
    if (clip) { act = mixer.clipAction(clip); act.setLoop(LoopRepeat, Infinity); act.play(); }
    return () => { act?.stop(); mixer.stopAllAction(); materials.forEach((m) => m.dispose()); };
  }, [mixer, animations, animRules, materials, index, setMats]);
  useFrame((_, dt) => mixer.update(Math.min(dt, 0.05)));
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
  useEditorPoliCharacterStore((s) => s.overrides[charId]); // re-render on character edits
  const base = CORE_TEAM.find((c) => c.id === charId);
  const merged = base ? getMergedPoliCharacter(base) : undefined;
  const path = (form === 'vehicle' ? merged?.modelVehiclePath : merged?.modelRobotPath) || '';
  const height = form === 'vehicle' ? (merged?.vehicleHeight ?? 1.4) : (merged?.robotHeight ?? 1.9);
  const yOff = merged?.modelYOffset ?? 0;
  const yawRad = ((merged?.modelYawDeg ?? -90) * Math.PI) / 180;
  const animRules = merged?.animations;

  const groups = useRef<(Group | null)[]>(Array.from({ length: CLONES }, () => null));
  const mats = useRef<Material[][]>(Array.from({ length: CLONES }, () => []));
  const slots = useRef<CloneSlot[]>(Array.from({ length: CLONES }, () => ({ active: false, t: 0, x: 0, y: 0, z: 0, dx: 0, dy: 0, dz: 0, spin: 0 })));
  const lastBurst = useRef(0); // throttle: one burst of 4 per BURST_COOLDOWN
  const setGroup = useCallback((i: number, el: Group | null) => { groups.current[i] = el; }, []);
  const setMats = useCallback((i: number, m: Material[]) => { mats.current[i] = m; }, []);

  const popupGroups = useRef<(Group | null)[]>(Array.from({ length: POPUPS }, () => null));
  const popupTexts = useRef<(({ text: string; sync: () => void }) | null)[]>(Array.from({ length: POPUPS }, () => null));
  const popupSlots = useRef<PopupSlot[]>(Array.from({ length: POPUPS }, () => ({ active: false, t: 0, x: 0, y: 0, z: 0 })));
  const popupHead = useRef(0);
  const _cr = useMemo(() => new Vector3(), []);
  const _cu = useMemo(() => new Vector3(), []);
  const _cf = useMemo(() => new Vector3(), []);

  const activatePopup = (x: number, y: number, z: number, label: string) => {
    const i = popupHead.current % POPUPS; popupHead.current++;
    const s = popupSlots.current[i];
    s.active = true; s.t = 0; s.x = x; s.y = y; s.z = z;
    const txt = popupTexts.current[i];
    if (txt) { txt.text = label; txt.sync(); }
  };

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const n = drainKills(_kills);
    if (n > 0) {
      const pp = usePlayerStore.getState().position;
      playSfx('rescueSuccess'); // once per batch (no spam on a kill spree)
      // +XP / +coin popups per kill (cheap, pooled).
      if (pp) for (let k = 0; k < n; k++) {
        const ev = _kills[k];
        activatePopup(pp.x - 0.5, pp.y + 2.0, pp.z, `+${ev.exp} XP`);
        activatePopup(pp.x + 0.6, pp.y + 1.6, pp.z, `+${ev.coin}`);
      }
      // Clone burst: at most ONE set of 4 per BURST_COOLDOWN. Reuses the same 4 slots, so however many yokai
      // you defeat in a short window there are never more than 4 clones (perf-safe).
      const tnow = performance.now() / 1000;
      if (pp && tnow - lastBurst.current >= BURST_COOLDOWN) {
        lastBurst.current = tnow;
        camera.matrixWorld.extractBasis(_cr, _cu, _cf); _cr.normalize(); _cu.normalize();
        for (let d = 0; d < CLONES; d++) {
          const [sx, sy] = DIAG[d];
          const s = slots.current[d];
          s.active = true; s.t = 0; s.x = pp.x; s.y = pp.y + 1.0; s.z = pp.z; s.spin = 0;
          s.dx = _cr.x * sx + _cu.x * sy;
          s.dy = _cr.y * sx + _cu.y * sy + 0.4; // bias upward so they rise as they spread
          s.dz = _cr.z * sx + _cu.z * sy;
        }
      }
    }

    // Clones: fly out along the diagonal, happy hop + spin, fade out (real materials).
    for (let i = 0; i < CLONES; i++) {
      const g = groups.current[i]; const s = slots.current[i];
      if (!g) continue;
      if (!s.active) { if (g.visible) g.visible = false; continue; }
      s.t += dt;
      if (s.t >= CLONE_LIFE) { s.active = false; g.visible = false; if (mats.current[i].length) setCloneOpacity(mats.current[i], 1); continue; }
      const k = s.t / CLONE_LIFE;
      g.visible = true;
      const hop = Math.sin(k * Math.PI) * 0.5; // happy little arc
      g.position.set(s.x + s.dx * SPREAD * k, s.y + s.dy * SPREAD * k + hop, s.z + s.dz * SPREAD * k);
      s.spin += dt * 6; g.rotation.y = s.spin;
      const sc = 0.7 + Math.sin(k * Math.PI) * 0.25; // bounce scale
      g.scale.setScalar(sc);
      // Stay fully solid for the first ~60% of the life, then fade out over the last ~40% (linger → vanish).
      if (mats.current[i].length) setCloneOpacity(mats.current[i], k < 0.6 ? 1 : Math.max(0, 1 - (k - 0.6) / 0.4));
    }

    // Popups: rise + shrink-out (reads as a fade), billboard the camera.
    for (let i = 0; i < POPUPS; i++) {
      const g = popupGroups.current[i]; const s = popupSlots.current[i];
      if (!g) continue;
      if (!s.active) { if (g.visible) g.visible = false; continue; }
      s.t += dt;
      if (s.t >= POPUP_LIFE) { s.active = false; g.visible = false; continue; }
      const k = s.t / POPUP_LIFE;
      g.visible = true;
      g.position.set(s.x, s.y + k * 1.6, s.z);
      g.quaternion.copy(camera.quaternion);
      g.scale.setScalar(k > 0.7 ? Math.max(0, 1 - (k - 0.7) / 0.3) : 1);
    }
  });

  return (
    <>
      {path && Array.from({ length: CLONES }, (_, i) => (
        <CloneModel key={`${path}-${i}`} index={i} path={path} height={height} yOff={yOff} yawRad={yawRad} animRules={animRules} setGroup={setGroup} setMats={setMats} />
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
