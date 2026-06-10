import { useMemo } from 'react';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, DoubleSide } from 'three';
import { useUiStore } from '../../stores/uiStore';
import { DynamicAmbience } from '../world/DynamicAmbience';
import { EditModeAmbience } from '../edit/EditModeAmbience';
import { SceneEditorGizmo } from '../edit/SceneEditorGizmo';
import { FollowCamera } from '../camera/FollowCamera';
import { BaseLayoutLayer } from './BaseLayoutLayer';
import { BaseVehicle } from './BaseVehicle';
import { LiftPlatform } from './LiftPlatform';
import { BASE_HALF_EXTENT, BASE_GROUND_Y, BASE_CEILING_Y } from '../../data/game/baseLayout';

// The enclosed 3D home base (hangar interior). Reuses the kit's ambience + Rapier <Physics> + FollowCamera
// + the shared SceneEditorGizmo (Edit Mode). A small textured room (floor + 4 walls + ceiling) keeps it
// indoor and bounded; the vehicle + lift run in play mode only.
const H = BASE_HALF_EXTENT;
const CEIL = BASE_CEILING_Y;

// Self-made procedural panel texture (no external/copyrighted art) for the room surfaces.
function makePanelTexture(base: string, line: string): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = line;
  ctx.lineWidth = 6;
  for (let i = 0; i <= 256; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.colorSpace = SRGBColorSpace;
  t.repeat.set(H / 2, H / 4);
  return t;
}

export const BaseScene = () => {
  const editMode = useUiStore((s) => s.editMode);
  const floorTex = useMemo(() => {
    const t = makePanelTexture('#39414f', '#2a313c');
    t.repeat.set(H / 2, H / 2);
    return t;
  }, []);
  const wallTex = useMemo(() => makePanelTexture('#444b5a', '#333a47'), []);
  const ceilTex = useMemo(() => {
    const t = makePanelTexture('#2c333f', '#222831');
    t.repeat.set(H / 2, H / 2);
    return t;
  }, []);

  return (
    <>
      {editMode ? <EditModeAmbience /> : <DynamicAmbience />}

      <Physics gravity={[0, -9.81, 0]}>
        <RigidBody type="fixed" colliders={false}>
          {/* Floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, BASE_GROUND_Y, 0]} receiveShadow>
            <planeGeometry args={[H * 2, H * 2]} />
            <meshStandardMaterial map={floorTex} roughness={0.9} />
          </mesh>
          {/* Ceiling */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, CEIL, 0]}>
            <planeGeometry args={[H * 2, H * 2]} />
            <meshStandardMaterial map={ceilTex} roughness={0.95} side={DoubleSide} />
          </mesh>
          {/* Walls (visible, double-sided) */}
          <mesh position={[0, CEIL / 2, -H]}>
            <planeGeometry args={[H * 2, CEIL]} />
            <meshStandardMaterial map={wallTex} roughness={0.9} side={DoubleSide} />
          </mesh>
          <mesh position={[0, CEIL / 2, H]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[H * 2, CEIL]} />
            <meshStandardMaterial map={wallTex} roughness={0.9} side={DoubleSide} />
          </mesh>
          <mesh position={[-H, CEIL / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[H * 2, CEIL]} />
            <meshStandardMaterial map={wallTex} roughness={0.9} side={DoubleSide} />
          </mesh>
          <mesh position={[H, CEIL / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[H * 2, CEIL]} />
            <meshStandardMaterial map={wallTex} roughness={0.9} side={DoubleSide} />
          </mesh>

          {/* Colliders — floor, ceiling + perimeter walls (enclosed; no clip-out / fall-out). */}
          <CuboidCollider args={[H, 0.5, H]} position={[0, BASE_GROUND_Y - 0.5, 0]} />
          <CuboidCollider args={[H, 0.5, H]} position={[0, CEIL + 0.5, 0]} />
          <CuboidCollider args={[H, CEIL, 0.5]} position={[0, CEIL / 2, -H]} />
          <CuboidCollider args={[H, CEIL, 0.5]} position={[0, CEIL / 2, H]} />
          <CuboidCollider args={[0.5, CEIL, H]} position={[-H, CEIL / 2, 0]} />
          <CuboidCollider args={[0.5, CEIL, H]} position={[H, CEIL / 2, 0]} />
        </RigidBody>

        <BaseLayoutLayer />
        {!editMode && <BaseVehicle />}
        {!editMode && <LiftPlatform />}
      </Physics>

      <FollowCamera />
      {editMode && <SceneEditorGizmo />}
    </>
  );
};
