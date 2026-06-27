import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useBossStore } from '../../../stores/game/useBossStore';
import { liveTargets } from '../../../stores/game/combatTargetStore';
import { getBoss } from '../../../stores/game/useBossEditorStore';
import { getMechanicFlag } from '../../bosses/BossSignatureMechanicController';

// Wave 1 — grey-box hazard visuals for the active boss's signature mechanic. Reads the renderer flags the
// controller exposes (floodRadius / safeRadius / blackout) and draws rings + a darkening disc at the boss.
// Telegraphs for strike-type mechanics still resolve via gameplay; this is lightweight feedback only.
export const BossSignatureHazardRenderer = () => {
  useBossStore((s) => s.version);
  const floodRef = useRef<THREE.Mesh>(null);
  const safeRef = useRef<THREE.Mesh>(null);
  const darkRef = useRef<THREE.Mesh>(null);

  const rt = useBossStore.getState().runtime;
  const mech = rt ? getBoss(rt.bossDefinitionId)?.signatureMechanic : undefined;

  useFrame((state) => {
    const bt = rt?.targetId ? liveTargets.find((t) => t.id === rt.targetId) : undefined;
    const id = mech?.id;
    const flood = id ? getMechanicFlag(id, 'floodRadius') : 0;
    const safe = id ? getMechanicFlag(id, 'safeRadius') : 0;
    const blackout = id ? getMechanicFlag(id, 'blackout') : 0;
    if (floodRef.current) {
      floodRef.current.visible = !!bt && flood > 0;
      if (bt && flood > 0) { floodRef.current.position.set(bt.x, 0.12, bt.z); floodRef.current.scale.setScalar(flood); floodRef.current.rotation.z += 0.01; }
    }
    if (safeRef.current) {
      safeRef.current.visible = !!bt && safe > 0;
      if (bt && safe > 0) { safeRef.current.position.set(bt.x, 0.1, bt.z); safeRef.current.scale.setScalar(safe); const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.02; safeRef.current.scale.multiplyScalar(pulse); }
    }
    if (darkRef.current) {
      darkRef.current.visible = !!bt && blackout > 0;
      if (bt && blackout > 0) darkRef.current.position.set(bt.x, 6, bt.z);
    }
  });

  if (!mech) return null;
  return (
    <>
      {/* Flood pulse ring (unit torus scaled to floodRadius). */}
      <mesh ref={floodRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <torusGeometry args={[1, 0.04, 8, 48]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.5} depthWrite={false} />
      </mesh>
      {/* Shrinking safe-zone ring. */}
      <mesh ref={safeRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <torusGeometry args={[1, 0.03, 8, 48]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.6} depthWrite={false} />
      </mesh>
      {/* Blackout darkening disc above the arena. */}
      <mesh ref={darkRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <circleGeometry args={[40, 32]} />
        <meshBasicMaterial color="#000010" transparent opacity={0.55} depthWrite={false} />
      </mesh>
    </>
  );
};
