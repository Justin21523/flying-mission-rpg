import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BackSide, Color, DoubleSide, type Mesh, type MeshBasicMaterial } from 'three';
import { anchorPosition, fadeEnvelope, liveV2 } from '../effectAnchor';
import type { ActiveEffectV2, LightEffectParameters } from '../../../../types/game/transformationEffects';

// Light / material / space effects — glow aura, emissive pulse, shockwave/radial rings, energy dome, screen
// flash, ground crack, rim/outline glow. A single additive primitive driven by progress; the effect type picks
// the shape/behaviour. Deterministic + cheap; the source character material is never touched.
const DEFAULTS: LightEffectParameters = { radius: 12, ringCount: 1, pulseSpeed: 2, thickness: 0.6, flashStrength: 1, shakeIntensity: 0, timeScale: 1 };

type Shape = 'ring' | 'dome' | 'flash' | 'glow';
function shapeFor(type: string): Shape {
  if (type.includes('shockwave') || type.includes('radial_burst') || type.includes('ground_crack')) return 'ring';
  if (type.includes('dome') || type.includes('distortion')) return 'dome';
  if (type.includes('flash')) return 'flash';
  return 'glow'; // glow_aura / outline_glow / emissive_pulse / rim / bloom / energy_material / hologram
}

export const LightSpaceRenderer = ({ fx }: { fx: ActiveEffectV2 }) => {
  const params = useMemo<LightEffectParameters>(() => ({ ...DEFAULTS, ...(fx.config.parameters as Partial<LightEffectParameters>) }), [fx]);
  const shape = useMemo(() => shapeFor(fx.config.effectType), [fx.config.effectType]);
  const meshRef = useRef<Mesh>(null);
  const color = useMemo(() => new Color(fx.config.color || '#7fd0ff'), [fx.config.color]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const live = liveV2(fx.config.effectId, fx);
    const base = anchorPosition(live.config);
    mesh.position.set(base[0], base[1] + (shape === 'glow' ? 0.9 : 0.05), base[2]);
    const env = fadeEnvelope(live.config, live.progress, live.config.duration) * (live.config.intensity ?? 1);
    const mat = mesh.material as MeshBasicMaterial;
    mat.color.copy(color);
    if (shape === 'ring') {
      const r = 1 + live.progress * params.radius;
      mesh.scale.set(r, r, r);
      mesh.rotation.x = -Math.PI / 2;
      mat.opacity = Math.max(0, (1 - live.progress)) * 0.8 * env;
    } else if (shape === 'dome') {
      const r = 1 + live.progress * params.radius;
      mesh.scale.set(r, r * 0.7, r);
      mat.opacity = Math.max(0, (1 - live.progress)) * 0.4 * env;
    } else if (shape === 'flash') {
      mesh.scale.setScalar(params.radius * 2);
      mat.opacity = Math.sin(Math.min(1, live.progress) * Math.PI) * params.flashStrength * env;
    } else { // glow — pulsing aura sphere
      const pulse = 1 + Math.sin(live.localTime * params.pulseSpeed * Math.PI) * 0.12;
      mesh.scale.setScalar((1.4 + live.progress * 0.6) * pulse * (live.config.scaleMultiplier || 1));
      mat.opacity = Math.sin(Math.min(1, live.progress) * Math.PI) * 0.35 * env;
    }
  });

  return (
    <mesh ref={meshRef} renderOrder={58}>
      {shape === 'ring' ? <torusGeometry args={[1, params.thickness * 0.2 + 0.06, 10, 48]} />
        : shape === 'dome' ? <sphereGeometry args={[1, 24, 16]} />
        : <sphereGeometry args={[1, 20, 14]} />}
      <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} depthTest={false} side={shape === 'dome' ? BackSide : DoubleSide} blending={AdditiveBlending} toneMapped={false} />
    </mesh>
  );
};
