import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, useGLTF } from '@react-three/drei';
import { AnimationMixer, LoopRepeat, type AnimationAction, type Group, type Material } from 'three';
import { useCharacterStore } from '../../../stores/game/useCharacterStore';
import { getEditorCharacter, useEditorCharacterStore } from '../../../stores/game/editorCharacterStore';
import { getModelAsset } from '../../../data/modelLibrary';
import { characterModelForForm } from '../../destination/characterModel';
import { buildPlayerClone, pickHappyClip, setCloneOpacity } from '../../player/cloneUtils';
import { drainFlightCollects, type FlightCollect } from '../../../stores/game/flightScoreStore';
import { playSfx } from '../../audio/sfx';
import type { AnimRule } from '../../../types/character';

// World-flight celebration — the flight twin of KillFxLayer. On each flight pickup, a clone of the active
// character pops up at the item, plays a dance/celebrate clip, rises + fades, with +XP/+coin popups. Pooled
// (no per-frame allocation); reuses cloneUtils. Mounted in WorldFlightScene (play).
const CLONES = 5;
const POPUPS = 10;
const CLONE_LIFE = 2.4;
const POPUP_LIFE = 1.2;
const CLONE_HEIGHT = 2.2;
const _collects: FlightCollect[] = [];

interface CloneSlot { active: boolean; t: number; x: number; y: number; z: number; spin: number }
interface PopupSlot { active: boolean; t: number; x: number; y: number; z: number }

const CloneModel = ({ index, path, animRules, setGroup, setMats }: {
  index: number; path: string; animRules?: AnimRule[];
  setGroup: (i: number, g: Group | null) => void; setMats: (i: number, m: Material[]) => void;
}) => {
  const { scene, animations } = useGLTF(path);
  const { clone, scale, offset, materials } = useMemo(() => buildPlayerClone(scene, CLONE_HEIGHT, 0), [scene]);
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
      <primitive object={clone} scale={scale} position={offset} />
    </group>
  );
};

export const FlightCelebrationLayer = () => {
  const charId = useCharacterStore((s) => s.selectedCharacterId);
  useEditorCharacterStore((s) => s.items); // re-render on character edits
  const character = charId ? getEditorCharacter(charId) : undefined;
  const modelId = character ? characterModelForForm(character, 'robot') : undefined;
  const path = modelId ? getModelAsset(modelId)?.path : undefined;
  const animRules = character?.animationRules;

  const groups = useRef<(Group | null)[]>(Array.from({ length: CLONES }, () => null));
  const mats = useRef<Material[][]>(Array.from({ length: CLONES }, () => []));
  const slots = useRef<CloneSlot[]>(Array.from({ length: CLONES }, () => ({ active: false, t: 0, x: 0, y: 0, z: 0, spin: 0 })));
  const cloneHead = useRef(0);
  const setGroup = useCallback((i: number, el: Group | null) => { groups.current[i] = el; }, []);
  const setMats = useCallback((i: number, m: Material[]) => { mats.current[i] = m; }, []);

  const popupGroups = useRef<(Group | null)[]>(Array.from({ length: POPUPS }, () => null));
  const popupTexts = useRef<(({ text: string; sync: () => void }) | null)[]>(Array.from({ length: POPUPS }, () => null));
  const popupSlots = useRef<PopupSlot[]>(Array.from({ length: POPUPS }, () => ({ active: false, t: 0, x: 0, y: 0, z: 0 })));
  const popupHead = useRef(0);

  const popup = (x: number, y: number, z: number, label: string) => {
    const i = popupHead.current % POPUPS; popupHead.current++;
    const s = popupSlots.current[i];
    s.active = true; s.t = 0; s.x = x; s.y = y; s.z = z;
    const txt = popupTexts.current[i];
    if (txt) { txt.text = label; txt.sync(); }
  };

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const n = drainFlightCollects(_collects);
    if (n > 0) {
      playSfx('rescueSuccess');
      for (let c = 0; c < n; c++) {
        const ev = _collects[c];
        if (ev.label) {
          popup(ev.x, ev.y + 1.4, ev.z, `${ev.label} +${ev.exp + ev.coin}`); // milestone / perfect bonus
        } else {
          const star = ev.golden ? '★ ' : '';
          popup(ev.x - 0.5, ev.y + 1.2, ev.z, `${star}+${ev.exp} XP${ev.combo > 1 ? ` ×${ev.combo}` : ''}`);
          popup(ev.x + 0.6, ev.y + 0.8, ev.z, `+${ev.coin}`);
        }
        if (ev.noClone) continue;
        const i = cloneHead.current % CLONES; cloneHead.current++;
        const s = slots.current[i];
        s.active = true; s.t = 0; s.x = ev.x; s.y = ev.y; s.z = ev.z; s.spin = 0;
      }
    }
    for (let i = 0; i < CLONES; i++) {
      const g = groups.current[i]; const s = slots.current[i];
      if (!g) continue;
      if (!s.active) { if (g.visible) g.visible = false; continue; }
      s.t += dt;
      if (s.t >= CLONE_LIFE) { s.active = false; g.visible = false; if (mats.current[i].length) setCloneOpacity(mats.current[i], 1); continue; }
      const k = s.t / CLONE_LIFE;
      g.visible = true;
      g.position.set(s.x, s.y + k * 2.4, s.z); // rise from the pickup
      s.spin += dt * 5; g.rotation.y = s.spin;
      g.scale.setScalar(0.8 + Math.sin(k * Math.PI) * 0.2);
      if (mats.current[i].length) setCloneOpacity(mats.current[i], k < 0.55 ? 1 : Math.max(0, 1 - (k - 0.55) / 0.45));
    }
    for (let i = 0; i < POPUPS; i++) {
      const g = popupGroups.current[i]; const s = popupSlots.current[i];
      if (!g) continue;
      if (!s.active) { if (g.visible) g.visible = false; continue; }
      s.t += dt;
      if (s.t >= POPUP_LIFE) { s.active = false; g.visible = false; continue; }
      const k = s.t / POPUP_LIFE;
      g.visible = true;
      g.position.set(s.x, s.y + k * 1.6, s.z);
      g.quaternion.copy(state.camera.quaternion);
      g.scale.setScalar(k > 0.7 ? Math.max(0, 1 - (k - 0.7) / 0.3) : 1);
    }
  });

  return (
    <>
      {path && Array.from({ length: CLONES }, (_, i) => (
        <CloneModel key={`${path}-${i}`} index={i} path={path} animRules={animRules} setGroup={setGroup} setMats={setMats} />
      ))}
      {Array.from({ length: POPUPS }, (_, i) => {
        const coin = i % 2 === 1;
        return (
          <group key={`p${i}`} ref={(el) => { popupGroups.current[i] = el; }} visible={false}>
            <Text ref={(el) => { popupTexts.current[i] = el as unknown as { text: string; sync: () => void } | null; }}
              position={[0, 0, 0]} fontSize={0.5} color={coin ? '#fde68a' : '#86efac'} anchorX="left" anchorY="middle"
              outlineWidth={0.04} outlineColor="#0a0a0a" renderOrder={3}>+
            </Text>
          </group>
        );
      })}
    </>
  );
};
