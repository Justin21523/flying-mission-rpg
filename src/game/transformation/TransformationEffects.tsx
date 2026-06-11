import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import { BackSide, MeshBasicMaterial, type Group, type Mesh, type PointLight } from 'three';
import { resolveModelAsset } from '../../stores/modelStudioStore';
import { txFrame, useTxVersion } from './transformationRuntime';
import type { TransformationEffectTrack, TransformationPartKey } from '../../types/game/transformation';

// Renders the runner's currently-active effect tracks (sparse) — each keyed by id, so they mount on entry and
// UNMOUNT on exit/replay (no accumulation, no memory growth). Distinct, child-friendly visuals; followTargetPart
// pins an effect to a live part position.
function partPos(key?: TransformationPartKey): [number, number, number] {
  if (!key) return [0, 0.4, 0];
  const st = txFrame.snapshot?.parts.get(key);
  return st ? st.position : [0, 0.4, 0];
}

const EnergyRing = ({ fx }: { fx: TransformationEffectTrack }) => {
  const m = useRef<Mesh>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt;
    const k = Math.min(1, t.current / fx.duration);
    if (m.current) {
      m.current.scale.setScalar(0.4 + k * (fx.scale ?? 2));
      (m.current.material as MeshBasicMaterial).opacity = 1 - k;
    }
  });
  return (
    <mesh ref={m} position={partPos(fx.followTargetPart)} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1, 0.06, 10, 40]} />
      <meshBasicMaterial color={fx.color ?? '#7fd0ff'} toneMapped={false} transparent opacity={1} />
    </mesh>
  );
};

const WhiteFlash = ({ fx }: { fx: TransformationEffectTrack }) => {
  const m = useRef<Mesh>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt;
    const k = Math.min(1, t.current / fx.duration);
    if (m.current) (m.current.material as MeshBasicMaterial).opacity = (1 - k) * (fx.intensity ?? 1) * 0.9;
  });
  return (
    <mesh ref={m} scale={60}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color={fx.color ?? '#ffffff'} side={BackSide} toneMapped={false} transparent opacity={0.9} depthWrite={false} />
    </mesh>
  );
};

const GlowPulse = ({ fx }: { fx: TransformationEffectTrack }) => {
  const l = useRef<PointLight>(null);
  useFrame((s) => { if (l.current) l.current.intensity = 1 + Math.abs(Math.sin(s.clock.elapsedTime * 8)) * 2 * (fx.intensity ?? 1); });
  const p = partPos(fx.followTargetPart);
  return <pointLight ref={l} color={fx.color ?? '#ffffff'} distance={20} position={[p[0], p[1] + 0.5, p[2]]} />;
};

const Sparkle = ({ fx }: { fx: TransformationEffectTrack }) => {
  const g = useRef<Group>(null);
  useFrame((s, dt) => { if (g.current) g.current.rotation.y += dt * 4; void s; });
  const p = partPos(fx.followTargetPart);
  return (
    <group ref={g} position={[p[0], p[1] + 0.4, p[2]]}>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.8, Math.sin(a) * 0.4, Math.sin(a) * 0.8]}>
            <octahedronGeometry args={[0.12, 0]} />
            <meshBasicMaterial color={fx.color ?? '#fde047'} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
};

// One translucent clone of the CHARACTER'S REAL MODEL (all materials swapped for the shared ghost tint).
const GhostModelClone = ({ path, mat }: { path: string; mat: MeshBasicMaterial }) => {
  const { scene } = useGLTF(encodeURI(path));
  const cloned = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    c.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh) { m.material = mat; m.castShadow = false; }
    });
    return c;
  }, [scene, mat]);
  return <primitive object={cloned} />;
};

// The beauty shot — translucent same-colour clones of the character's OWN model bursting outward from the
// body centre: steady spread, growing until they reach the view edge, CONSTANT opacity (no fade-out); they
// persist until the track ends. `repeat` = clone count; colour = the character's particleColor.
const GhostBurst = ({ fx }: { fx: TransformationEffectTrack }) => {
  const g = useRef<Group>(null);
  const t = useRef(0);
  const count = Math.max(3, Math.round(fx.repeat ?? 6));
  const mat = useMemo(
    () => new MeshBasicMaterial({ color: fx.color ?? '#7fd0ff', transparent: true, opacity: Math.min(0.85, 0.5 * (fx.intensity ?? 1)), depthWrite: false, toneMapped: false }),
    [fx.color, fx.intensity],
  );
  useEffect(() => () => mat.dispose(), [mat]);
  const asset = txFrame.charModelId ? resolveModelAsset(txFrame.charModelId) : undefined;
  const baseScale = asset?.scale ?? 1;

  useFrame((_, dt) => {
    t.current += dt;
    const grp = g.current;
    if (!grp) return;
    const stagger = (fx.duration * 0.25) / count;
    for (let i = 0; i < grp.children.length; i++) {
      const ghost = grp.children[i];
      const life = Math.max(0, Math.min(1, (t.current - i * stagger) / (fx.duration * 0.85)));
      const ang = (i / count) * Math.PI * 2;
      const dist = life * 14 * (fx.scale ?? 1.6); // spreads all the way to the view edge by the end
      ghost.position.set(Math.cos(ang) * dist, 0.4 + life * 1.2, Math.sin(ang) * dist);
      ghost.scale.setScalar((1 + life * 2.2) * baseScale);
      ghost.rotation.y = ang;
      ghost.visible = life > 0; // constant opacity — no fade; unmounts when the track ends
    }
  });

  const fallback = (
    <mesh>
      <capsuleGeometry args={[0.45, 0.9, 4, 12]} />
      <meshBasicMaterial color={fx.color ?? '#7fd0ff'} toneMapped={false} transparent opacity={0.5} depthWrite={false} />
    </mesh>
  );
  return (
    <group ref={g}>
      {Array.from({ length: count }, (_, i) => (
        <group key={i} visible={false}>
          {asset?.path ? (
            <Suspense fallback={fallback}>
              <GhostModelClone path={asset.path} mat={mat} />
            </Suspense>
          ) : (
            fallback
          )}
        </group>
      ))}
    </group>
  );
};

const EffectViz = ({ fx }: { fx: TransformationEffectTrack }) => {
  switch (fx.type) {
    case 'energy-ring': return <EnergyRing fx={fx} />;
    case 'white-flash': return <WhiteFlash fx={fx} />;
    case 'sparkle': return <Sparkle fx={fx} />;
    case 'ghost-burst': return <GhostBurst fx={fx} />;
    case 'speed-line-burst': return null; // handled by the backdrop
    default: return <GlowPulse fx={fx} />; // glow-pulse / particle-burst / thruster-flare / outline
  }
};

export const TransformationEffects = () => {
  useTxVersion((s) => s.v); // re-render only when the active-effect set changes (director bumps it)
  const active = txFrame.snapshot?.activeEffects ?? [];
  return (
    <>
      {active.map((fx) => (
        <EffectViz key={fx.id} fx={fx} />
      ))}
    </>
  );
};
