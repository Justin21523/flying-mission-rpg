import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, AnimationMixer, Color, DoubleSide, Mesh, MeshStandardMaterial, NormalBlending, type AnimationClip, type Material, type MeshBasicMaterial, type Group, type Object3D } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { resolveModelAsset } from '../../../../stores/modelStudioStore';
import { txFrame, useTxVersion } from '../../transformationRuntime';
import { cloneTransformAt, defaultCloneParameters, type CloneState } from '../cloneSampling';
import { anchorPosition, currentActor, effectModelId, fadeEnvelope, liveV2 } from '../effectAnchor';
import type { ActiveEffectV2, CloneEffectParameters } from '../../../../types/game/transformationEffects';

// Real multi-clone burst — a fixed pool of `cloneCount` translucent GLB copies of the character. INFLATE mode
// (default) keeps them overlapping the character CENTRE and scales them up symmetrically (stays centred in
// view), with a bright flash as they appear; they fade once huge. Deterministic from progress (scrub-correct),
// pooled, and — for perf — each clone's cloned materials are cached so the per-frame opacity update never walks
// the scene graph (the old per-frame traverse over every mesh of every clone was the slowdown with many clones).
const MAX_CLONES = 8; // animated skinned clones are GPU-heavy — cap for perf

function paramsOf(fx: ActiveEffectV2): CloneEffectParameters {
  return { ...defaultCloneParameters(), ...(fx.config.parameters as Partial<CloneEffectParameters>) };
}

function clipFor(animations: AnimationClip[], name: string | null | undefined): AnimationClip | undefined {
  if (!animations.length) return undefined;
  return (name && animations.find((a) => a.name === name)) || animations[0];
}

function buildClones(scene: Object3D, count: number, params: CloneEffectParameters, animations: AnimationClip[]): { objects: Object3D[]; perCloneMats: Material[][]; mixers: AnimationMixer[] } {
  const objects: Object3D[] = [];
  const perCloneMats: Material[][] = [];
  const mixers: AnimationMixer[] = [];
  const additive = params.cloneMaterialMode !== 'translucent';
  const animate = params.clonePlayAnimation !== false && animations.length > 0;
  for (let i = 0; i < count; i += 1) {
    const c = SkeletonUtils.clone(scene);
    const mats: Material[] = [];
    c.traverse((o: Object3D) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      const src = Array.isArray(m.material) ? m.material : [m.material];
      const cloned = src.map((mat) => {
        const cm = (mat as MeshStandardMaterial).clone();
        cm.transparent = true;
        cm.depthWrite = false;
        cm.opacity = 0;
        cm.side = DoubleSide;
        cm.blending = additive ? AdditiveBlending : NormalBlending;
        if (params.cloneMaterialMode === 'hologram' && 'emissive' in cm) cm.emissiveIntensity = params.cloneGlowIntensity;
        mats.push(cm);
        return cm;
      });
      m.material = cloned.length === 1 ? cloned[0] : cloned;
      m.castShadow = false;
      m.receiveShadow = false;
      m.frustumCulled = false; // huge centred clones must not be culled when the camera is close
      m.renderOrder = 60;
    });
    if (animate) mixers.push(new AnimationMixer(c)); // clip chosen + switched live in useFrame
    perCloneMats.push(mats);
    objects.push(c);
  }
  return { objects, perCloneMats, mixers };
}

const GlbClonePool = ({ fx, count, path }: { fx: ActiveEffectV2; count: number; path: string }) => {
  const params = useMemo(() => paramsOf(fx), [fx]);
  const { scene, animations } = useGLTF(encodeURI(path));
  const pool = useMemo(() => buildClones(scene, count, params, animations), [scene, count, params, animations]);
  const groupRefs = useRef<(Group | null)[]>([]);
  const clipName = useRef<string | null>(null);
  const matsRef = useRef<Material[][]>([]); // hold the cached materials off the memo so we may mutate opacity
  useEffect(() => {
    matsRef.current = pool.perCloneMats;
    return () => { pool.mixers.forEach((mx) => mx.stopAllAction()); pool.perCloneMats.flat().forEach((m) => m.dispose()); };
  }, [pool]);

  useFrame((_, delta) => {
    // Follow the character's CURRENT clip — switch the clones' action whenever the live activeClip changes.
    if (pool.mixers.length) {
      const want = txFrame.snapshot?.activeClip ?? animations[0]?.name ?? null;
      if (want !== clipName.current) {
        clipName.current = want;
        const clip = clipFor(animations, want);
        for (const mx of pool.mixers) { mx.stopAllAction(); if (clip) mx.clipAction(clip).play(); }
      }
      for (let i = 0; i < pool.mixers.length; i += 1) pool.mixers[i].update(delta);
    }
    const live = liveV2(fx.config.effectId, fx);
    const base = anchorPosition(live.config);
    const env = fadeEnvelope(live.config, live.progress, live.config.duration) * (live.config.intensity ?? 1);
    for (let i = 0; i < count; i += 1) {
      const g = groupRefs.current[i];
      if (!g) continue;
      const s: CloneState = cloneTransformAt(i, params, live.progress);
      g.visible = s.visible;
      if (!s.visible) continue;
      g.position.set(base[0] + s.position[0], base[1] + s.position[1], base[2] + s.position[2]);
      g.scale.setScalar(s.scale);
      g.rotation.set(0, s.rotationY, 0);
      const op = Math.max(0, Math.min(1, s.opacity * env));
      const mats = matsRef.current[i]; // cached (off-memo) — no per-frame scene-graph traversal
      if (mats) for (let m = 0; m < mats.length; m += 1) mats[m].opacity = op;
    }
  });

  return <>{pool.objects.map((obj, i) => <group key={i} ref={(el) => { groupRefs.current[i] = el; }} visible={false}><primitive object={obj} /></group>)}</>;
};

// Bright additive flash at the character centre as the clones appear (overlaps the body, quick in / out).
const CloneFlash = ({ fx }: { fx: ActiveEffectV2 }) => {
  const ref = useRef<Mesh>(null);
  const params = useMemo(() => paramsOf(fx), [fx]);
  const color = useMemo(() => new Color(params.cloneColorTint || '#ffffff'), [params.cloneColorTint]);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const live = liveV2(fx.config.effectId, fx);
    const base = anchorPosition(live.config);
    m.position.set(base[0], base[1] + 0.9, base[2]);
    const p = live.progress;
    const f = p < 0.12 ? p / 0.12 : Math.max(0, 1 - (p - 0.12) / 0.5); // quick flash in, fade out
    const mat = m.material as MeshBasicMaterial;
    mat.opacity = (params.cloneFlashStrength ?? 1) * f * 0.9;
    m.scale.setScalar(1.2 + p * 2.5);
    m.visible = mat.opacity > 0.003;
  });
  if ((params.cloneFlashStrength ?? 1) <= 0) return null;
  return (
    <mesh ref={ref} renderOrder={62} frustumCulled={false}>
      <sphereGeometry args={[1, 20, 14]} />
      <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} depthTest={false} blending={AdditiveBlending} toneMapped={false} />
    </mesh>
  );
};

// Fallback when the character GLB can't be resolved — translucent capsules still inflate so the burst reads.
const PrimitiveClonePool = ({ fx, count }: { fx: ActiveEffectV2; count: number }) => {
  const params = useMemo(() => paramsOf(fx), [fx]);
  const refs = useRef<(Group | null)[]>([]);
  useFrame(() => {
    const live = liveV2(fx.config.effectId, fx);
    const base = anchorPosition(live.config);
    const env = fadeEnvelope(live.config, live.progress, live.config.duration) * (live.config.intensity ?? 1);
    for (let i = 0; i < count; i += 1) {
      const g = refs.current[i];
      if (!g) continue;
      const s = cloneTransformAt(i, params, live.progress);
      g.visible = s.visible;
      g.position.set(base[0] + s.position[0], base[1] + s.position[1], base[2] + s.position[2]);
      g.scale.setScalar(s.scale);
      g.rotation.set(0, s.rotationY, 0);
      const mesh = g.children[0] as Mesh | undefined;
      const mat = mesh?.material as MeshStandardMaterial | undefined;
      if (mat) mat.opacity = Math.max(0, Math.min(1, s.opacity * env));
    }
  });
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <group key={i} ref={(el) => { refs.current[i] = el; }} visible={false}>
          <mesh frustumCulled={false}>
            <capsuleGeometry args={[0.45, 0.9, 4, 12]} />
            <meshStandardMaterial color={params.cloneColorTint} emissive={params.cloneColorTint} emissiveIntensity={0.6} transparent opacity={0} depthWrite={false} side={DoubleSide} blending={AdditiveBlending} />
          </mesh>
        </group>
      ))}
    </>
  );
};

export const CloneBurstRenderer = ({ fx }: { fx: ActiveEffectV2 }) => {
  const params = useMemo(() => paramsOf(fx), [fx]);
  const count = Math.max(1, Math.min(MAX_CLONES, Math.round(params.cloneCount)));
  const follow = params.cloneFollowCurrentModel !== false;
  // Use the character's CURRENT model, re-resolved ONLY when the effect/model/clip set version bumps (a model
  // swap is a stage event → version bump). Resolving in useFrame + setState re-cloned the whole pool on every
  // frame the live actor id jittered — the real cause of the lag/stutter. This re-resolves at most on swaps.
  useTxVersion((s) => s.v); // re-render on set/model/clip changes so the live model is re-resolved on a swap
  const modelId = (follow ? currentActor()?.modelId : undefined) ?? effectModelId(fx.config);
  const asset = modelId ? resolveModelAsset(modelId) : undefined;
  return (
    <>
      <CloneFlash fx={fx} />
      {asset?.path
        ? <Suspense fallback={null}><GlbClonePool fx={fx} count={count} path={asset.path} /></Suspense>
        : <PrimitiveClonePool fx={fx} count={count} />}
    </>
  );
};
