import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Mesh, MeshStandardMaterial, NormalBlending, type Blending, type Group, type Material, type Object3D } from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { resolveModelAsset } from '../../../../stores/modelStudioStore';
import { anchorPosition, effectModelId, fadeEnvelope, liveV2 } from '../effectAnchor';
import { seededHash } from '../../../effects/seededHash';
import { measureNormalization } from '../../../poli/normalizeGlb';
import type { ActiveEffectV2 } from '../../../../types/game/transformationEffects';

// Model-particle system — spawns a REAL GLB model as each particle (pooled clones, translucent cloned
// materials), animated like a particle field (burst / debris / orbit / rain / rising). Deterministic from
// progress (scrub-correct), pooled + capped, materials disposed on unmount. Defaults to the character model.
const MAX = 30;
// GLBs across public/models/ have wildly different native scales/pivots (some hundreds of units tall, some
// off-centre) — so each model is NORMALIZED to this unit height + recentred (like every other GLB render path
// via normalizeGlb). particleModelScale then multiplies this consistent size. Without this, hero aircraft /
// large props render gigantic (off-camera) or far off-pivot → "invisible", and only particles show.
const VFX_TARGET_HEIGHT = 1.4;

type MaterialMode = 'solid' | 'hologram' | 'afterimage' | 'energy-outline' | 'ghost-trail';
interface MP { particleCount: number; particleLifetime: number; particleSpeed: number; particleGravity: number; particleSpreadRadius: number; particleOrbitRadius: number; particleOrbitSpeed: number; particleShape: string; particleModelScale: number; particleModelSpin: number; particleMaterialMode: MaterialMode; }
const D: MP = { particleCount: 14, particleLifetime: 1.8, particleSpeed: 7, particleGravity: 6, particleSpreadRadius: 6, particleOrbitRadius: 4, particleOrbitSpeed: 1.5, particleShape: 'burst', particleModelScale: 0.4, particleModelSpin: 2, particleMaterialMode: 'solid' };

// Per material-mode rendering recipe. 'solid' is the default (real opaque GLB clone). The rest give the clone
// abilities their "double / echo / phantom" looks (additive glow, low-opacity ghost, emissive outline). The
// per-frame opacity envelope multiplies `opacityScale`.
const MATERIAL_RECIPES: Record<MaterialMode, { blending: Blending; depthWrite: boolean; opacityScale: number; emissive: number; wireframe: boolean }> = {
  'solid': { blending: NormalBlending, depthWrite: true, opacityScale: 1, emissive: 0, wireframe: false },
  'hologram': { blending: AdditiveBlending, depthWrite: false, opacityScale: 0.85, emissive: 1.1, wireframe: false },
  'afterimage': { blending: NormalBlending, depthWrite: false, opacityScale: 0.5, emissive: 0.3, wireframe: false },
  'energy-outline': { blending: AdditiveBlending, depthWrite: false, opacityScale: 0.9, emissive: 1.6, wireframe: true },
  'ghost-trail': { blending: AdditiveBlending, depthWrite: false, opacityScale: 0.45, emissive: 0.6, wireframe: false },
};

function shapeFor(type: string, p: MP): string {
  if (p.particleShape && p.particleShape !== 'burst') return p.particleShape;
  if (type.includes('orbit')) return 'orbit';
  if (type.includes('rain')) return 'rain';
  if (type.includes('rising')) return 'rising';
  if (type.includes('debris')) return 'debris';
  return 'burst';
}
function pos(i: number, count: number, p: MP, shape: string, prog: number, out: Group, seed: number): void {
  const seeded = (n: number) => seededHash(n, seed, 53.7, 19.1); // seed 0 = original scatter; bump to re-roll
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
  // Normalize the source GLB once → uniform scale + recenter offset so ANY model renders at a predictable size.
  const norm = useMemo(() => measureNormalization(scene, VFX_TARGET_HEIGHT), [scene]);
  const recipe = MATERIAL_RECIPES[p.particleMaterialMode] ?? MATERIAL_RECIPES.solid;
  const pool = useMemo(() => {
    const objects: Object3D[] = []; const materials: Material[] = [];
    for (let i = 0; i < count; i += 1) {
      const c = SkeletonUtils.clone(scene);
      c.traverse((o) => {
        const m = o as Mesh;
        if (!m.isMesh) return;
        // VFX clones are moved every frame by a parent group; their per-mesh bounding sphere doesn't track that,
        // so the moving combat camera could cull them. VFX objects must never be culled.
        m.frustumCulled = false;
        // Clone each material so per-instance opacity fade doesn't mutate the shared GLB material. CRITICAL:
        // preserve the single-vs-array shape — assigning a 1-element ARRAY to a mesh whose geometry has no
        // groups makes three.js draw NOTHING (this is why model VFX were invisible). The material MODE picks the
        // blending/depth/emissive recipe — 'solid' = real opaque GLB; clone looks = additive/ghost/outline.
        const cloneMat = (mat: Material): Material => {
          const cm = (mat as MeshStandardMaterial).clone();
          cm.transparent = true; cm.depthWrite = recipe.depthWrite; cm.blending = recipe.blending;
          if (recipe.wireframe) cm.wireframe = true;
          if (recipe.emissive > 0 && cm.emissive) { cm.emissive.set(cm.color ?? '#ffffff'); cm.emissiveIntensity = recipe.emissive; }
          materials.push(cm); return cm;
        };
        m.material = Array.isArray(m.material) ? m.material.map(cloneMat) : cloneMat(m.material);
      });
      c.frustumCulled = false;
      objects.push(c);
    }
    return { objects, materials };
  }, [scene, count, recipe]);
  useEffect(() => () => pool.materials.forEach((m) => m.dispose()), [pool]);
  const refs = useRef<(Group | null)[]>([]);

  useFrame(() => {
    const live = liveV2(fx.config.effectId, fx);
    const base = anchorPosition(live.config);
    const env = fadeEnvelope(live.config, live.progress, live.config.duration) * (live.config.intensity ?? 1);
    for (let i = 0; i < count; i += 1) {
      const g = refs.current[i];
      if (!g) continue;
      pos(i, count, p, shape, live.progress, g, fx.config.seed ?? 0);
      g.position.x += base[0]; g.position.y += base[1]; g.position.z += base[2];
      g.scale.setScalar(p.particleModelScale);
      g.rotation.set(live.progress * p.particleModelSpin, live.progress * p.particleModelSpin * 1.3, 0);
      const op = Math.max(0, Math.min(1, env)) * recipe.opacityScale;
      g.traverse((o) => { const m = o as Mesh; if (!m.isMesh) return; (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) => { (mat as Material).opacity = op; }); });
    }
  });
  return <>{pool.objects.map((obj, i) => (
    <group key={i} ref={(el) => { refs.current[i] = el; }}>
      {/* static normalization (size + pivot) — the outer group above gets per-frame pos/scale/rotation/opacity */}
      <group scale={norm.scale} position={norm.offset}><primitive object={obj} /></group>
    </group>
  ))}</>;
};

// A failed GLB load (parse error / missing) throws past Suspense — without a boundary it would crash the whole
// CinematicVfxLayer (every effect vanishes). Mirror the world-model loader: contain failures per-model.
class ModelBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  constructor(props: { children: ReactNode }) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

export const ModelParticleRenderer = ({ fx }: { fx: ActiveEffectV2 }) => {
  const modelId = useMemo(() => (fx.config.parameters.particleModelId) || effectModelId(fx.config), [fx.config]);
  const asset = modelId ? resolveModelAsset(modelId) : undefined;
  if (!asset?.path) return null;
  return <ModelBoundary><Suspense fallback={null}><ModelPool fx={fx} path={asset.path} /></Suspense></ModelBoundary>;
};
