import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, DoubleSide, Mesh, MeshStandardMaterial, NormalBlending, type Group, type Material, type Object3D } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { resolveModelAsset } from '../../../../stores/modelStudioStore';
import { anchorPosition, effectModelId, fadeEnvelope, liveV2 } from '../effectAnchor';
import type { ActiveEffectV2 } from '../../../../types/game/transformationEffects';

// Model-particle system — spawns a REAL GLB model as each particle (pooled clones, translucent cloned
// materials), animated like a particle field (burst / debris / orbit / rain / rising). Deterministic from
// progress (scrub-correct), pooled + capped, materials disposed on unmount. Defaults to the character model.
const MAX = 30;
const seeded = (n: number) => { const x = Math.sin(n * 53.7 + 19.1) * 43758.5453; return x - Math.floor(x); };

interface MP { particleCount: number; particleLifetime: number; particleSpeed: number; particleGravity: number; particleSpreadRadius: number; particleOrbitRadius: number; particleOrbitSpeed: number; particleShape: string; particleModelScale: number; particleModelSpin: number; }
const D: MP = { particleCount: 14, particleLifetime: 1.8, particleSpeed: 7, particleGravity: 6, particleSpreadRadius: 6, particleOrbitRadius: 4, particleOrbitSpeed: 1.5, particleShape: 'burst', particleModelScale: 0.4, particleModelSpin: 2 };

function shapeFor(type: string, p: MP): string {
  if (p.particleShape && p.particleShape !== 'burst') return p.particleShape;
  if (type.includes('orbit')) return 'orbit';
  if (type.includes('rain')) return 'rain';
  if (type.includes('rising')) return 'rising';
  if (type.includes('debris')) return 'debris';
  return 'burst';
}
function pos(i: number, count: number, p: MP, shape: string, prog: number, out: Group): void {
  const t = prog * p.particleLifetime;
  const a = (i / count) * Math.PI * 2 + seeded(i) * 0.5;
  const phi = Math.acos(2 * seeded(i * 3) - 1);
  const d = p.particleSpeed * t;
  if (shape === 'orbit') { const ang = a + prog * p.particleOrbitSpeed * Math.PI * 2; out.position.set(Math.cos(ang) * p.particleOrbitRadius, 0.6 + Math.sin(ang * 2) * 0.7, Math.sin(ang) * p.particleOrbitRadius); }
  else if (shape === 'rain') out.position.set((seeded(i) - 0.5) * p.particleSpreadRadius, p.particleSpreadRadius - t * p.particleSpeed, (seeded(i * 3) - 0.5) * p.particleSpreadRadius);
  else if (shape === 'rising') out.position.set((seeded(i) - 0.5) * p.particleSpreadRadius, t * p.particleSpeed * 0.6, (seeded(i * 3) - 0.5) * p.particleSpreadRadius);
  else if (shape === 'debris') out.position.set(Math.sin(phi) * Math.cos(a) * d, Math.cos(phi) * d - 0.5 * p.particleGravity * t * t * 0.2, Math.sin(phi) * Math.sin(a) * d);
  else out.position.set(Math.sin(phi) * Math.cos(a) * d, Math.cos(phi) * d, Math.sin(phi) * Math.sin(a) * d); // burst
}

const ModelPool = ({ fx, path }: { fx: ActiveEffectV2; path: string }) => {
  const p = useMemo<MP>(() => ({ ...D, ...(fx.config.parameters as Partial<MP>) }), [fx]);
  const count = Math.max(1, Math.min(MAX, Math.round(p.particleCount)));
  const shape = useMemo(() => shapeFor(fx.config.effectType, p), [fx.config.effectType, p]);
  const { scene } = useGLTF(encodeURI(path));
  const pool = useMemo(() => {
    const objects: Object3D[] = []; const materials: Material[] = [];
    for (let i = 0; i < count; i += 1) {
      const c = SkeletonUtils.clone(scene);
      c.traverse((o) => { const m = o as Mesh; if (!m.isMesh) return; const src = Array.isArray(m.material) ? m.material : [m.material]; m.material = src.map((mat) => { const cm = (mat as MeshStandardMaterial).clone(); cm.transparent = true; cm.depthWrite = false; cm.side = DoubleSide; cm.blending = fx.config.blendMode === 'additive' ? AdditiveBlending : NormalBlending; materials.push(cm); return cm; }) as Material[]; });
      objects.push(c);
    }
    return { objects, materials };
  }, [scene, count, fx.config.blendMode]);
  useEffect(() => () => pool.materials.forEach((m) => m.dispose()), [pool]);
  const refs = useRef<(Group | null)[]>([]);

  useFrame(() => {
    const live = liveV2(fx.config.effectId, fx);
    const base = anchorPosition(live.config);
    const env = fadeEnvelope(live.config, live.progress, live.config.duration) * (live.config.intensity ?? 1);
    for (let i = 0; i < count; i += 1) {
      const g = refs.current[i];
      if (!g) continue;
      pos(i, count, p, shape, live.progress, g);
      g.position.x += base[0]; g.position.y += base[1]; g.position.z += base[2];
      g.scale.setScalar(p.particleModelScale);
      g.rotation.y += 0; g.rotation.set(live.progress * p.particleModelSpin, live.progress * p.particleModelSpin * 1.3, 0);
      const op = Math.max(0, Math.min(1, env));
      g.traverse((o) => { const m = o as Mesh; if (!m.isMesh) return; (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) => { (mat as Material).opacity = op; }); });
    }
  });
  return <>{pool.objects.map((obj, i) => <group key={i} ref={(el) => { refs.current[i] = el; }}><primitive object={obj} /></group>)}</>;
};

export const ModelParticleRenderer = ({ fx }: { fx: ActiveEffectV2 }) => {
  const modelId = useMemo(() => (fx.config.parameters.particleModelId) || effectModelId(fx.config), [fx.config]);
  const asset = modelId ? resolveModelAsset(modelId) : undefined;
  if (!asset?.path) return null;
  return <Suspense fallback={null}><ModelPool fx={fx} path={asset.path} /></Suspense>;
};
