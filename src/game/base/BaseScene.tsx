import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import { useUiStore } from '../../stores/uiStore';
import { DynamicAmbience } from '../world/DynamicAmbience';
import { EditModeAmbience } from '../edit/EditModeAmbience';
import { FollowCamera } from '../camera/FollowCamera';
import { BaseLayoutLayer } from './BaseLayoutLayer';
import { BaseVehicle } from './BaseVehicle';
import { LiftPlatform } from './LiftPlatform';
import { BASE_HALF_EXTENT, BASE_GROUND_Y } from '../../data/game/baseLayout';

// The 3D home base (hangar interior). Reuses the kit's ambience + Rapier <Physics> + FollowCamera. Ground
// + perimeter wall colliders keep the vehicle in; layout parts are editable; the vehicle + lift run in
// play mode only (Edit Mode suspends them so you can author the layout with gizmos).
const H = BASE_HALF_EXTENT;

export const BaseScene = () => {
  const editMode = useUiStore((s) => s.editMode);
  return (
    <>
      {editMode ? <EditModeAmbience /> : <DynamicAmbience />}

      <Physics gravity={[0, -9.81, 0]}>
        <RigidBody type="fixed" colliders={false}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, BASE_GROUND_Y, 0]} receiveShadow>
            <planeGeometry args={[H * 2, H * 2]} />
            <meshStandardMaterial color="#2b3340" />
          </mesh>
          {/* Floor + perimeter walls (invisible) — no fall-out, no escape. */}
          <CuboidCollider args={[H, 0.5, H]} position={[0, BASE_GROUND_Y - 0.5, 0]} />
          <CuboidCollider args={[H, 4, 0.5]} position={[0, 4, -H]} />
          <CuboidCollider args={[H, 4, 0.5]} position={[0, 4, H]} />
          <CuboidCollider args={[0.5, 4, H]} position={[-H, 4, 0]} />
          <CuboidCollider args={[0.5, 4, H]} position={[H, 4, 0]} />
        </RigidBody>

        <BaseLayoutLayer />
        {!editMode && <BaseVehicle />}
        {!editMode && <LiftPlatform />}
      </Physics>

      <FollowCamera />
    </>
  );
};
