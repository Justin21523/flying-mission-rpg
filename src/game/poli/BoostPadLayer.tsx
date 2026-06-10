import { useRef } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { DoubleSide } from 'three';
import { useUiStore } from '../../stores/uiStore';
import { useEditorBoostPadStore } from '../../stores/editorBoostPadStore';
import { getPath } from '../../stores/editorPathStore';
import { DataBackedPlacement } from '../edit/DataBackedPlacement';
import { triggerDash } from '../combat/dashImpulse';
import { enterPathFollow } from '../combat/pathFollow';
import { playSfx } from '../audio/sfx';
import type { BoostPadConfig } from '../../types/boostPad';

// POLI (Phase B) — BoostPads. Play Mode: a Rapier sensor the player walks onto → a per-pad cooldown guards
// re-fire, then the pad either flings the player onto its linked PathFollow (enterPathFollow) or applies a
// forward/custom-direction speed burst via the dashImpulse bus. Edit Mode: each pad is a DataBackedPlacement
// (drag to move → writes back to the store); the full attribute panel arrives in Phase D. Sibling layer in
// AreaRenderer (kit seam #1) — no kit-core edits.
const PAD_HALF = 1.4;   // sensor / disc half-extent (world units)
const NO_RAYCAST = () => null;

const PadVisual = ({ pad }: { pad: BoostPadConfig }) => {
  const color = pad.enabled ? '#22d3ee' : '#64748b';
  return (
    <group>
      {/* glowing pad disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} raycast={NO_RAYCAST}>
        <circleGeometry args={[PAD_HALF, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} side={DoubleSide} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} raycast={NO_RAYCAST}>
        <ringGeometry args={[PAD_HALF - 0.18, PAD_HALF, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} side={DoubleSide} depthWrite={false} />
      </mesh>
      {/* debug arrow: a cone pointing along the pad's local +Z (the boost/forward direction) */}
      <mesh position={[0, 0.5, PAD_HALF * 0.6]} rotation={[Math.PI / 2, 0, 0]} raycast={NO_RAYCAST}>
        <coneGeometry args={[0.32, 0.9, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} />
      </mesh>
    </group>
  );
};

// Resolve the boost direction in world space from the pad's mode (used only for non-path boosts).
function boostDir(pad: BoostPadConfig): { x: number; z: number } {
  if (pad.boostMode === 'customDirection' && pad.customDirection) {
    const [x, , z] = pad.customDirection;
    const len = Math.hypot(x, z) || 1;
    return { x: x / len, z: z / len };
  }
  // 'forward' / fallback — pad's local +Z rotated by its yaw.
  const yaw = pad.rotation?.[1] ?? 0;
  return { x: Math.sin(yaw), z: Math.cos(yaw) };
}

const PlayPad = ({ pad }: { pad: BoostPadConfig }) => {
  const pos = pad.position ?? [0, 0, 0];
  const rot = pad.rotation ?? [0, 0, 0];
  const lastFire = useRef(0);

  const fire = () => {
    if (!pad.enabled) return;
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
    if (now < lastFire.current + pad.cooldown) return; // per-pad cooldown — never fire every frame
    lastFire.current = now;
    if (pad.activationSound) playSfx('ui');

    if (pad.enterPathFollow && pad.linkedPathId) {
      const path = getPath(pad.linkedPathId);
      enterPathFollow(pad.linkedPathId, pad.pathControlMode ?? 'forwardLocked', {
        u: 0,
        dir: 1,
        speed: path?.defaultSpeed ?? pad.boostSpeed,
        exit: pad.exitBehavior,
      });
      return;
    }
    // Plain speed burst — reuse the dash lunge bus (a real forward drive for a brief window).
    const d = boostDir(pad);
    triggerDash(d.x, d.z, pad.boostSpeed, pad.duration);
  };

  return (
    <group position={pos} rotation={rot}>
      <PadVisual pad={pad} />
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[PAD_HALF, 0.6, PAD_HALF]} position={[0, 0.6, 0]} sensor onIntersectionEnter={fire} />
      </RigidBody>
    </group>
  );
};

const EditPad = ({ pad }: { pad: BoostPadConfig }) => {
  const pos = pad.position ?? [0, 0, 0];
  const updatePadPosition = useEditorBoostPadStore((s) => s.updatePadPosition);
  return (
    <DataBackedPlacement
      objKey={`${pad.id}#pad`}
      position={pos}
      color="#22d3ee"
      onMove={(p) => updatePadPosition(pad.id, p)}
    >
      <group rotation={pad.rotation ?? [0, 0, 0]}>
        <PadVisual pad={pad} />
      </group>
    </DataBackedPlacement>
  );
};

export const BoostPadLayer = ({ areaId }: { areaId: string }) => {
  const editMode = useUiStore((s) => s.editMode);
  const pads = useEditorBoostPadStore((s) => s.pads).filter((p) => (p.areaId ?? 'rescue_hq') === areaId);
  if (pads.length === 0) return null;
  return <>{pads.map((p) => (editMode ? <EditPad key={p.id} pad={p} /> : <PlayPad key={p.id} pad={p} />))}</>;
};
