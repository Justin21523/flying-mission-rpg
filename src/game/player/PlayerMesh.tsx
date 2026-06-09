import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Box3, Vector3, AnimationMixer, LoopOnce, LoopRepeat, type AnimationAction } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { useEditorPoliCharacterStore } from '../../stores/editorPoliCharacterStore';
import { useTransformStore, POLI_ROSTER, type PoliForm } from '../../stores/transformStore';
import { CORE_TEAM } from '../../data/characters/coreTeam';
import { useAnimClipStore } from '../../stores/animClipStore';
import { playerMotion } from './playerMotion';
import { playerKeysDown } from './playerInput';
import { HelicopterRotor } from './HelicopterRotor';
import { ruleMatches, pickLoopRule } from '../anim/animRunner';
import type { AnimRule } from '../../types/character';

// The player is one of the main characters (cycle with C), each with two forms (toggle with T). Both form
// models are always mounted (visibility toggled). Each model runs an AnimationMixer driven by the character's
// custom animation RULES (POLI tab): every frame the highest-priority rule whose trigger matches the live
// state plays its clip (crossfaded); `once`/`key` rules play through once (celebrate/dance). No rules → the
// model's first clip loops. Models are SkeletonUtils-cloned (rigged) + Box3-normalised (feet at y=0).

const CAR_HEIGHT = 1.4;
const ROBOT_HEIGHT = 1.9;

for (const id of POLI_ROSTER) {
  const c = CORE_TEAM.find((x) => x.id === id);
  if (c?.modelVehiclePath) useGLTF.preload(c.modelVehiclePath);
  if (c?.modelRobotPath) useGLTF.preload(c.modelRobotPath);
}

const Capsule = () => (
  <mesh castShadow position={[0, 0.95, 0]}>
    <capsuleGeometry args={[0.45, 1.0, 8, 16]} />
    <meshStandardMaterial color="#3b82f6" roughness={0.5} metalness={0.2} />
  </mesh>
);

const ModelView =({ path, height, yOffset, visible, rules, active, form }: {
  path: string; height: number; yOffset: number; visible: boolean; rules: AnimRule[]; active: boolean; form: PoliForm;
}) => {
  const { scene, animations } = useGLTF(path);
  const { clone, scale, offset } = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    const box = new Box3().setFromObject(c);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);
    const nativeH = Number.isFinite(size.y) && size.y > 1e-4 ? size.y : 1;
    const s = height / nativeH;
    const ox = Number.isFinite(center.x) ? -center.x * s : 0;
    const oy = (Number.isFinite(box.min.y) ? -box.min.y * s : 0) + yOffset;
    const oz = Number.isFinite(center.z) ? -center.z * s : 0;
    return { clone: c, scale: s, offset: [ox, oy, oz] as [number, number, number] };
  }, [scene, height, yOffset]);

  const mixer = useMemo(() => new AnimationMixer(clone), [clone]);
  const actions = useMemo(() => {
    const m = new Map<string, AnimationAction>();
    for (const c of animations ?? []) m.set(c.name, mixer.clipAction(c));
    return m;
  }, [animations, mixer]);
  const firstClip = animations?.[0]?.name;

  useEffect(() => {
    useAnimClipStore.getState().setClips(path, (animations ?? []).map((c) => c.name));
  }, [animations, path]);
  useEffect(() => () => { mixer.stopAllAction(); }, [mixer]);

  const st = useRef({ action: null as AnimationAction | null, lastAbility: 0, abilityUntil: 0, lastCelebrate: 0, celebrateUntil: 0, oneShotUntil: 0, prevOnce: new Set<string>() });

  useFrame((_, dt) => {
    mixer.update(dt);
    if (!active) return; // only the visible form drives selection
    const S = st.current;
    const tnow = performance.now() / 1000;
    const tf = useTransformStore.getState();
    // 'ability' trigger stays active for ~0.8s after each ability use.
    if (tf.abilityPulseId !== S.lastAbility) { S.lastAbility = tf.abilityPulseId; S.abilityUntil = tnow + 0.8; }
    if (tf.celebratePulseId !== S.lastCelebrate) { S.lastCelebrate = tf.celebratePulseId; S.celebrateUntil = tnow + 1.4; }
    const speed = playerMotion.speed;
    const moving = speed > 0.3 || playerMotion.moving;
    const state = {
      speed, moving,
      sprinting: playerKeysDown.has('ShiftLeft') && moving,
      flying: tf.flying,
      form,
      ability: tnow < S.abilityUntil,
      celebrate: tnow < S.celebrateUntil,
      keyDown: (c: string) => playerKeysDown.has(c),
    };

    // One-shot (once / key) rules: fire on rising edge, play through once.
    for (const r of rules) {
      if (!r.once || !actions.has(r.clip)) continue;
      const on = ruleMatches(r, state);
      const was = S.prevOnce.has(r.id);
      if (on && !was) {
        const a = actions.get(r.clip)!;
        a.reset(); a.setLoop(LoopOnce, 1); a.clampWhenFinished = true;
        a.fadeIn(r.crossfadeSec ?? 0.15).play();
        S.oneShotUntil = tnow + a.getClip().duration;
        if (S.action) S.action.fadeOut(r.crossfadeSec ?? 0.15);
        S.action = null;
      }
      if (on) S.prevOnce.add(r.id); else S.prevOnce.delete(r.id);
    }
    if (tnow < S.oneShotUntil) return; // let the one-shot finish

    // Highest-priority looping rule that matches + has a clip in this model.
    const best = pickLoopRule(rules, state, (c) => actions.has(c));
    const clip = best?.clip ?? firstClip;
    if (!clip || !actions.has(clip)) return;
    const next = actions.get(clip)!;
    if (S.action !== next) {
      const cf = best?.crossfadeSec ?? 0.2;
      next.reset(); next.setLoop(LoopRepeat, Infinity); next.enabled = true; next.fadeIn(cf).play();
      if (S.action) S.action.fadeOut(cf);
      S.action = next;
    }
  });

  return <primitive object={clone} scale={scale} position={offset} visible={visible} />;
};

const BothForms = ({ carPath, robotPath, form, carH, robotH, yOff, rules }: { carPath: string; robotPath: string; form: PoliForm; carH: number; robotH: number; yOff: number; rules: AnimRule[] }) => (
  <>
    <ModelView path={carPath} height={carH} yOffset={yOff} visible={form === 'vehicle'} active={form === 'vehicle'} form={form} rules={rules} />
    <ModelView path={robotPath} height={robotH} yOffset={yOff} visible={form === 'robot'} active={form === 'robot'} form={form} rules={rules} />
  </>
);

export const PlayerMesh = () => {
  const charId = useTransformStore((s) => s.charId);
  const form = useTransformStore((s) => s.form);
  const flying = useTransformStore((s) => s.flying);
  const override = useEditorPoliCharacterStore((s) => s.overrides[charId]);

  const base = CORE_TEAM.find((c) => c.id === charId);
  const carPath = override?.modelVehiclePath || base?.modelVehiclePath || '';
  const robotPath = override?.modelRobotPath || base?.modelRobotPath || '';
  const canFly = override?.canFly ?? base?.canFly ?? false;
  const carH = override?.vehicleHeight ?? base?.vehicleHeight ?? CAR_HEIGHT;
  const robotH = override?.robotHeight ?? base?.robotHeight ?? ROBOT_HEIGHT;
  const yOff = override?.modelYOffset ?? base?.modelYOffset ?? 0;
  const rules = override?.animations ?? base?.animations ?? [];
  // Correct the model's authored forward axis so the character faces forward (these GLBs face +X by default;
  // -90° turns that to +Z = away from the start camera = forward). Editable per character in the POLI tab.
  const yawRad = ((override?.modelYawDeg ?? base?.modelYawDeg ?? -90) * Math.PI) / 180;

  return (
    <group rotation={[0, yawRad, 0]}>
      <Suspense fallback={<Capsule />}>
        {carPath && robotPath
          ? <BothForms key={charId} carPath={carPath} robotPath={robotPath} form={form} carH={carH} robotH={robotH} yOff={yOff} rules={rules} />
          : <Capsule />}
      </Suspense>
      {canFly && flying && <HelicopterRotor />}
    </group>
  );
};
