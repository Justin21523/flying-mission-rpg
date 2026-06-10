import React, { Suspense, useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { AnimationMixer, LoopRepeat, type AnimationAction, type AnimationClip, type Group } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { resolveModelAsset, useModelStudioStore } from '../../stores/modelStudioStore';
import { useDistanceCull } from '../perf/useDistanceCull';
import { pickLoopRule } from '../anim/animRunner';
import { playerKeysDown } from '../player/playerInput';

// Kit — like SceneGlbModel (resolve asset, clone via SkeletonUtils, Suspense + error-boundary fallback)
// but also *plays* an animation clip. The static model is rendered UNCONDITIONALLY — animation is attached
// best-effort via a manual AnimationMixer inside a try/catch effect, so a model with odd/no clips still
// shows (it never falls back to the placeholder just because animation setup failed). Used by NPCs,
// quest/encounter markers, and activity participants.
interface AnimatedGlbModelProps {
  assetId: string;
  animation?: string;
  fallback?: React.ReactNode;
  noCull?: boolean; // skip distance-culling (the flight craft moves far from playerStore → must stay visible)
}

const AnimatedInner = ({ assetId, animation, noCull }: { assetId: string; animation?: string; noCull?: boolean }) => {
  // Re-render when this asset's Model Studio tuning changes.
  useModelStudioStore((s) => s.overrides[assetId]);
  const asset = resolveModelAsset(assetId)!;
  const { scene, animations } = useGLTF(encodeURI(asset.path));
  const cloned = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const mixerRef = useRef<AnimationMixer | null>(null);
  // Model-Studio anim RULES (trigger→clip) take priority over the single `animation` clip when authored.
  const rules = asset.animations ?? [];
  const ruled = rules.length > 0;
  const actionsRef = useRef<Map<string, AnimationAction>>(new Map());
  const curRef = useRef<AnimationAction | null>(null);
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
        const clip = (animation && clips.find((c) => c.name === animation)) || clips[0];
        if (clip) mixer.clipAction(clip).reset().play();
      }
      return () => { mixer.stopAllAction(); mixerRef.current = null; actionsRef.current = new Map(); curRef.current = null; };
    } catch {
      // Static model still renders — animation is best-effort only.
      return;
    }
  }, [cloned, animations, animation, ruled]);

  useFrame((_, dt) => {
    const mixer = mixerRef.current;
    if (!mixer) return;
    mixer.update(dt);
    if (!ruled) return;
    // Rule-driven clip selection (static set-piece: speed 0 / not moving → 'always'/'idle'/'key' rules fire).
    const best = pickLoopRule(rules, { speed: 0, moving: false, keyDown: (c) => playerKeysDown.has(c) }, (c) => actionsRef.current.has(c));
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

export function AnimatedGlbModel({ assetId, animation, fallback = null, noCull }: AnimatedGlbModelProps) {
  if (!resolveModelAsset(assetId)) return <>{fallback}</>;
  return (
    <ModelErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <AnimatedInner assetId={assetId} animation={animation} noCull={noCull} />
      </Suspense>
    </ModelErrorBoundary>
  );
}
