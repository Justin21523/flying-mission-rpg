import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useBossStore } from '../../../stores/game/useBossStore';
import { liveTargets } from '../../../stores/game/combatTargetStore';
import { getBoss, getBossPhase } from '../../../stores/game/useBossEditorStore';

// Model-first Harbor Core Sentinel placeholder (Batch F) — composed geometry (base + core stack + 2 shield
// panels + rotating energy ring + phase-color core), NOT a lone sphere. Follows the boss body CombatTarget,
// shows shield panels while shielded, tilts + dims when defeated. Phase color reflects the active phase.
export const BossRenderer = () => {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);
  const leftPanel = useRef<THREE.Mesh>(null);
  const rightPanel = useRef<THREE.Mesh>(null);
  const runtime = useBossStore((s) => s.runtime);
  useBossStore((s) => s.version);

  const boss = getBoss(runtime?.bossDefinitionId);
  const phase = getBossPhase(runtime?.activePhaseId);
  const phaseColor = phase?.editorMeta?.phaseColor ?? boss?.visual.themeColor ?? '#38bdf8';
  const defeated = runtime?.status === 'defeated';

  useFrame((_, dt) => {
    if (!runtime?.targetId) return;
    const t = liveTargets.find((x) => x.id === runtime.targetId);
    if (group.current && t) {
      group.current.position.set(t.x, t.y, t.z);
      group.current.rotation.z = defeated ? 0.5 : 0;
    }
    if (ring.current && !defeated) ring.current.rotation.z += dt * 1.2;
    const shieldUp = (t?.shield ?? 0) > 0;
    if (leftPanel.current) leftPanel.current.visible = shieldUp && !defeated;
    if (rightPanel.current) rightPanel.current.visible = shieldUp && !defeated;
    if (core.current) {
      const mat = core.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = defeated ? 0.05 : 0.8;
    }
  });

  if (!runtime) return null;
  const scale = boss?.visual.scale ?? [2.2, 2.2, 2.2];

  return (
    <group ref={group} scale={scale as [number, number, number]}>
      {/* base */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[1.2, 1.5, 0.6, 12]} />
        <meshStandardMaterial color="#1f2937" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* core stack */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh ref={core} position={[0, 1.9, 0]}>
        <octahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial color={phaseColor} emissive={phaseColor} emissiveIntensity={0.8} toneMapped={false} />
      </mesh>
      {/* rotating energy ring */}
      <mesh ref={ring} position={[0, 1.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.1, 0.07, 8, 32]} />
        <meshStandardMaterial color={phaseColor} emissive={phaseColor} emissiveIntensity={0.5} toneMapped={false} />
      </mesh>
      {/* shield panels */}
      <mesh ref={leftPanel} position={[-1.1, 1.2, 0]}>
        <boxGeometry args={[0.18, 1.6, 1.2]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.5} emissive="#38bdf8" emissiveIntensity={0.3} />
      </mesh>
      <mesh ref={rightPanel} position={[1.1, 1.2, 0]}>
        <boxGeometry args={[0.18, 1.6, 1.2]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.5} emissive="#38bdf8" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
};
