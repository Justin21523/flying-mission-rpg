import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, DoubleSide, type Mesh, type MeshBasicMaterial } from 'three';
import type { CombatEffectDefinition, GeometryAnimate } from '../../../types/game/combat';
import type { ActiveEffectInstance } from '../../../stores/game/useCombatStore';

// Model-first geometry effect — renders ONE active effect instance as a real mesh (cone/box/torus/sphere/…)
// animated over its timing window (expand / pulse / rotate / sweep / contract + fade), reusing the
// SuperAbilityFx approach (a single mesh + per-frame material/scale mutation, no per-frame allocation).

function Geometry({ def }: { def: CombatEffectDefinition }) {
  const g = def.geometry!;
  const d = g.dimensions;
  switch (g.geometryType) {
    case 'sphere': return <sphereGeometry args={[d.radius ?? 1, 24, 16]} />;
    case 'box': return <boxGeometry args={[d.width ?? 1, d.height ?? 1, d.length ?? 1]} />;
    case 'cone': return <coneGeometry args={[d.radius ?? 1, d.height ?? 0.5, 24, 1, true]} />;
    case 'cylinder': return <cylinderGeometry args={[d.radius ?? 1, d.radius ?? 1, d.height ?? 1, 24]} />;
    case 'torus':
    case 'ring': return <torusGeometry args={[d.radius ?? 1, d.width ?? 0.3, 12, 36]} />;
    case 'line':
    case 'tube': return <boxGeometry args={[d.width ?? 0.4, d.height ?? 0.4, d.length ?? 8]} />;
    case 'plane': return <planeGeometry args={[d.width ?? 1, d.height ?? 1]} />;
    default: return <sphereGeometry args={[d.radius ?? 1, 16, 12]} />;
  }
}

function applyAnimate(mesh: Mesh, animate: GeometryAnimate, k: number): void {
  // k = 0..1 progress through the effect window.
  switch (animate) {
    case 'expand': mesh.scale.setScalar(0.2 + k * 1.1); break;
    case 'contract': mesh.scale.setScalar(1.3 - k * 1.1); break;
    case 'pulse': mesh.scale.setScalar(0.8 + Math.sin(k * Math.PI) * 0.4); break;
    case 'rotate': mesh.rotation.y = k * Math.PI * 2; break;
    case 'sweep': mesh.rotation.y = (-0.5 + k) * 1.2; break;
    default: mesh.scale.setScalar(1);
  }
}

export const GeometryEffectRenderer = ({ instance, def }: { instance: ActiveEffectInstance; def: CombatEffectDefinition }) => {
  const meshRef = useRef<Mesh>(null);
  const total = useMemo(() => (def.timing.startDelaySeconds + def.timing.durationSeconds + (def.timing.fadeOutSeconds ?? 0)), [def]);
  const additive = def.geometry?.renderMode === 'additive';
  const wireframe = def.geometry?.renderMode === 'outline' || def.geometry?.renderMode === 'wireframe';
  // Cone/box/line orient along the caster forward (heading); torus/sphere stay flat on the ground.
  const flat = def.geometry?.geometryType === 'torus' || def.geometry?.geometryType === 'ring';

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const k = Math.min(1, Math.max(0, (now - instance.startedAtMs) / 1000 / Math.max(0.0001, total)));
    applyAnimate(mesh, def.geometry?.animate ?? 'none', k);
    const mat = mesh.material as MeshBasicMaterial;
    if (mat) {
      const fade = def.timing.fadeOutSeconds ? 1 - k : 1;
      mat.opacity = Math.max(0, Math.min(1, fade)) * (additive ? 0.7 : 0.5);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[instance.x, instance.y + 0.6, instance.z]}
      rotation={flat ? [-Math.PI / 2, 0, 0] : [0, instance.headingRad, 0]}
    >
      <Geometry def={def} />
      <meshBasicMaterial
        color={def.color ?? '#ffffff'}
        transparent
        opacity={0.5}
        wireframe={wireframe}
        side={DoubleSide}
        depthWrite={false}
        blending={additive ? AdditiveBlending : undefined}
      />
    </mesh>
  );
};
