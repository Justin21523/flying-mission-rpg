import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DoubleSide, type Mesh, type MeshBasicMaterial } from 'three';
import { useCombatStore } from '../../stores/game/useCombatStore';
import { robotHandle } from '../destination/robotHandle';
import { activeCombatantId } from './CombatDirector';

// Renders a translucent geometry shield around the player while a defense skill is active (front-shield /
// barrier / iframe / reflect-wall). Follows the player; fades as the defense window ends. Model-backed cover
// (cover-spawn) is rendered as a terrain spawn instead — this is the on-body shield accent.
export const DefenseEffectLayer = () => {
  const meshRef = useRef<Mesh>(null);
  const defenses = useCombatStore((s) => s.activeDefenseByCharacterId);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const id = activeCombatantId();
    const def = id ? defenses[id] : undefined;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const active = def && now < def.untilMs;
    mesh.visible = !!active;
    if (!active || !def) return;
    mesh.position.set(robotHandle.pos.x, robotHandle.pos.y + 1, robotHandle.pos.z);
    const remain = Math.max(0, Math.min(1, (def.untilMs - now) / 1500));
    const mat = mesh.material as MeshBasicMaterial;
    mat.opacity = 0.12 + remain * 0.22;
    mesh.rotation.y += 0.03;
  });

  return (
    <mesh ref={meshRef} visible={false}>
      <sphereGeometry args={[1.8, 20, 16]} />
      <meshBasicMaterial color="#38bdf8" transparent opacity={0.25} side={DoubleSide} depthWrite={false} />
    </mesh>
  );
};
