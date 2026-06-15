import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { type Group } from 'three';
import type { CombatEffectDefinition, ModelComponentTransformKey } from '../../../types/game/combat';
import type { ActiveEffectInstance } from '../../../stores/game/useCombatStore';

// Placeholder model-component effect runner (model-first foundation). For each declared model component it
// spawns a simple mesh at the effect root (character position + forward) and plays its transformTimeline
// (lerp position/rotation/scale/opacity). Real character GLB parts / sockets attach here in a later batch
// (no bone access yet — see AnimatedGlbModel). Future Jett/Donnie/Paul/Chase skills point a richer effect
// def's modelComponents at real parts.

function sample(keys: ModelComponentTransformKey[], t: number): ModelComponentTransformKey {
  if (keys.length === 0) return { time: 0 };
  let a = keys[0];
  let b = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (t >= keys[i].time && t <= keys[i + 1].time) { a = keys[i]; b = keys[i + 1]; break; }
  }
  const span = Math.max(1e-4, b.time - a.time);
  const k = Math.min(1, Math.max(0, (t - a.time) / span));
  const lerp3 = (p?: [number, number, number], q?: [number, number, number], def: [number, number, number] = [0, 0, 0]): [number, number, number] => {
    const pa = p ?? def, pb = q ?? p ?? def;
    return [pa[0] + (pb[0] - pa[0]) * k, pa[1] + (pb[1] - pa[1]) * k, pa[2] + (pb[2] - pa[2]) * k];
  };
  return {
    time: t,
    position: lerp3(a.position, b.position),
    rotation: lerp3(a.rotation, b.rotation),
    scale: lerp3(a.scale, b.scale, [1, 1, 1]),
    opacity: (a.opacity ?? 1) + ((b.opacity ?? 1) - (a.opacity ?? 1)) * k,
  };
}

export const ModelComponentEffectRunner = ({ instance, def }: { instance: ActiveEffectInstance; def: CombatEffectDefinition }) => {
  const rootRef = useRef<Group>(null);
  const total = def.timing.startDelaySeconds + def.timing.durationSeconds + (def.timing.fadeOutSeconds ?? 0);
  const components = def.modelComponents ?? [];

  useFrame(() => {
    const root = rootRef.current;
    if (!root) return;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const t = Math.min(1, Math.max(0, (now - instance.startedAtMs) / 1000 / Math.max(0.0001, total)));
    root.children.forEach((child, i) => {
      const keys = components[i]?.transformTimeline ?? [];
      const s = sample(keys, t);
      if (s.position) child.position.set(s.position[0], s.position[1], s.position[2]);
      if (s.rotation) child.rotation.set(s.rotation[0], s.rotation[1], s.rotation[2]);
      if (s.scale) child.scale.set(s.scale[0], s.scale[1], s.scale[2]);
    });
  });

  if (components.length === 0) return null;
  return (
    <group ref={rootRef} position={[instance.x, instance.y, instance.z]} rotation={[0, instance.headingRad, 0]}>
      {components.map((_c, i) => (
        <mesh key={i} position={[0, 0.6, 1]}>
          <boxGeometry args={[0.4, 0.4, 1]} />
          <meshStandardMaterial color={def.color ?? '#ffffff'} emissive={def.color ?? '#ffffff'} emissiveIntensity={0.6} transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
};
