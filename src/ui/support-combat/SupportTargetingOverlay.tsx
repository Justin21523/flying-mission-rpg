import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useSupportCombatStore } from '../../stores/game/useSupportCombatStore';
import { getSupportAbility } from '../../stores/game/useSupportCombatEditorStore';
import { robotHandle } from '../../game/destination/robotHandle';

// In-Canvas range preview for the selected support ability (Batch E). Renders a translucent ground ring
// (sphere/area/strike) or forward cone footprint sized by the ability's targeting, following the player.
// Shown when an ability is selected or debug.showSupportTargeting is on. Mounted in CombatRuntimeLayer.
export const SupportTargetingOverlay = () => {
  const group = useRef<THREE.Group>(null);
  const abilityId = useSupportCombatStore((s) => s.selectedSupportAbilityId);
  const showDebug = useSupportCombatStore((s) => s.debug.showSupportTargeting);

  useFrame(() => {
    if (group.current) {
      group.current.position.set(robotHandle.pos.x, 0.12, robotHandle.pos.z);
      group.current.rotation.y = -robotHandle.heading;
    }
  });

  const ability = getSupportAbility(abilityId);
  if (!ability || !(abilityId || showDebug)) return null;

  const t = ability.targeting;
  const r = Math.max(1, t.radius ?? t.maxRange ?? 6);
  const color = ability.editorMeta?.themeColor ?? '#60a5fa';
  const isCone = t.rangeShape === 'cone';

  return (
    <group ref={group}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[Math.max(0.2, r - 0.35), r, 56]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {isCone && (
        <mesh position={[0, 0.05, r * 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[r, 32, -((t.angleDegrees ?? 60) * Math.PI) / 360 + Math.PI / 2, ((t.angleDegrees ?? 60) * Math.PI) / 180]} />
          <meshBasicMaterial color={color} transparent opacity={0.18} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
};
