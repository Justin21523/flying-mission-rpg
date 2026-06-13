import React, { Suspense, useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { AnimationMixer, LoopOnce, LoopRepeat, type AnimationAction, type AnimationClip, type Group } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { resolveModelAsset, useModelStudioStore } from '../../stores/modelStudioStore';
import { useDistanceCull } from '../perf/useDistanceCull';
import { pickLoopRule, type AnimState } from '../anim/animRunner';
import type { AnimRule } from '../../types/character';
import { playerKeysDown } from '../player/playerInput';

// Kit — like SceneGlbModel (resolve asset, clone via SkeletonUtils, Suspense + error-boundary fallback)
// but also *plays* an animation clip. The static model is rendered UNCONDITIONALLY — animation is attached
// best-effort via a manual AnimationMixer inside a try/catch effect, so a model with odd/no clips still
// shows (it never falls back to the placeholder just because animation setup failed). Used by NPCs,
// quest/encounter markers, and activity participants.
interface AnimatedGlbModelProps {
  assetId: string;
  animation?: string;
  animationSpeed?: number;
  animationTime?: number;
  getAnimationTime?: () => number | undefined;
  loop?: boolean;
  autoPlayFirstClip?: boolean;
  fallback?: React.ReactNode;
  noCull?: boolean; // skip distance-culling (the flight craft moves far from playerStore → must stay visible)
  // Caller-supplied animation RULES (reuse POLI pickLoopRule) + a live state getter. When rules are present
  // they drive clip selection (over the single `animation` prop / Model-Studio rules). Polled each frame.
  rules?: AnimRule[];
  getAnimState?: () => AnimState;
}

// Stable default state for rule-driven static set-pieces (no per-frame allocation).
const STATIC_STATE: AnimState = { speed: 0, moving: false, keyDown: (c) => playerKeysDown.has(c) };

const AnimatedInner = ({
  assetId,
  animation,
  animationSpeed = 1,
  animationTime,
  getAnimationTime,
  loop = true,
  autoPlayFirstClip = true,
  noCull,
  rules: callerRules,
  getAnimState,
}: {
  assetId: string;
  animation?: string;
  animationSpeed?: number;
  animationTime?: number;
  getAnimationTime?: () => number | undefined;
  loop?: boolean;
  autoPlayFirstClip?: boolean;
  noCull?: boolean;
  rules?: AnimRule[];
  getAnimState?: () => AnimState;
}) => {
  // Re-render when this asset's Model Studio tuning changes.
  useModelStudioStore((s) => s.overrides[assetId]);
  const asset = resolveModelAsset(assetId)!;
  const { scene, animations } = useGLTF(encodeURI(asset.path));
  const cloned = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const mixerRef = useRef<AnimationMixer | null>(null);
  // Caller rules (per-character) take priority, else Model-Studio rules (trigger→clip), else single clip.
  const rules = (callerRules && callerRules.length > 0) ? callerRules : (asset.animations ?? []);
  const ruled = rules.length > 0;
  const actionsRef = useRef<Map<string, AnimationAction>>(new Map());
  const curRef = useRef<AnimationAction | null>(null);
  const singleActionRef = useRef<AnimationAction | null>(null);
  const firstClipRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const clips = (animations ?? []) as AnimationClip[];
    if (clips.length === 0) return;
    try {
      const mixer = new AnimationMixer(cloned);
      mixerRef.current = mixer;
      if (ruled) {
        const map = new Map<string, AnimationAction>();
        for (const c of clips) map.set(c.name, mixer.clipAction(c));
        actionsRef.current = map;
        firstClipRef.current = clips[0]?.name;
        curRef.current = null;
      } else {
        const clip = (animation && clips.find((c) => c.name === animation)) || (autoPlayFirstClip ? clips[0] : undefined);
        if (clip) {
          const action = mixer.clipAction(clip).reset();
          action.timeScale = animationSpeed;
          action.setLoop(loop ? LoopRepeat : LoopOnce, loop ? Infinity : 1);
          action.clampWhenFinished = true;
          action.play();
          singleActionRef.current = action;
        }
      }
      return () => { mixer.stopAllAction(); mixerRef.current = null; actionsRef.current = new Map(); curRef.current = null; singleActionRef.current = null; };
    } catch {
      // Static model still renders — animation is best-effort only.
      return;
    }
  }, [cloned, animations, animation, ruled, animationSpeed, loop, autoPlayFirstClip]);

  useFrame((_, dt) => {
    const mixer = mixerRef.current;
    if (!mixer) return;
    const timelineTime = getAnimationTime ? getAnimationTime() : animationTime;
    if (!ruled && timelineTime !== undefined) {
      const action = singleActionRef.current;
      const duration = action?.getClip().duration ?? 0;
      if (action && duration > 0) {
        const t = loop ? timelineTime % duration : Math.max(0, Math.min(duration, timelineTime));
        action.time = t;
        mixer.update(0);
      }
      return;
    }
    mixer.update(dt);
    if (!ruled) return;
    // Rule-driven clip selection. Caller-supplied live state (flying/moving/ability/form/speed) drives it
    // when present; otherwise a static set-piece state (speed 0 / not moving) fires 'always'/'idle'/'key'.
    const st = getAnimState ? getAnimState() : STATIC_STATE;
    const best = pickLoopRule(rules, st, (c) => actionsRef.current.has(c));
    const clip = best?.clip ?? firstClipRef.current;
    if (!clip) return;
    const next = actionsRef.current.get(clip);
    if (next && curRef.current !== next) {
      const cf = best?.crossfadeSec ?? 0.2;
      next.reset(); next.setLoop(LoopRepeat, Infinity); next.enabled = true; next.fadeIn(cf).play();
      if (curRef.current) curRef.current.fadeOut(cf);
      curRef.current = next;
    }
  });

  const cullRef = useDistanceCull<Group>(); // hide when far from the player (Play Mode perf)
  return (
    <group ref={noCull ? undefined : cullRef} position={asset.position} rotation={asset.rotation} scale={asset.scale}>
      <primitive object={cloned} />
    </group>
  );
};

// Error boundary so a failed GLB load renders the primitive fallback.
class ModelErrorBoundary extends React.Component<{ fallback: React.ReactNode; children: React.ReactNode }, { failed: boolean }> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return <>{this.props.fallback}</>;
    return this.props.children;
  }
}

export function AnimatedGlbModel({ assetId, animation, animationSpeed, animationTime, getAnimationTime, loop, autoPlayFirstClip, fallback = null, noCull, rules, getAnimState }: AnimatedGlbModelProps) {
  if (!resolveModelAsset(assetId)) return <>{fallback}</>;
  return (
    <ModelErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <AnimatedInner assetId={assetId} animation={animation} animationSpeed={animationSpeed} animationTime={animationTime} getAnimationTime={getAnimationTime} loop={loop} autoPlayFirstClip={autoPlayFirstClip} noCull={noCull} rules={rules} getAnimState={getAnimState} />
      </Suspense>
    </ModelErrorBoundary>
  );
}
