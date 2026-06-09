import { RigidBody, CuboidCollider } from '@react-three/rapier';

// Shared "effectively infinite" ground extent — ZoneFloor base + the FlatPbr ground use this so the textured
// ground covers the same area the player can roam (no boundary walls).
export const GROUND_SIZE = 8000;

// Kit — the base flat ground: an effectively-infinite collidable plane so the player can never fall off the
// open map (no boundary walls). Rendered under EVERY ground type as a safety base; Heightfield / FlatPbr
// grounds layer their detailed visuals on top within the area, and beyond them this base continues forever.
// `y` lets callers drop the base slightly below detailed terrain to avoid z-fighting.
export const ZoneFloor = ({ color, size = GROUND_SIZE, collider = true, y = 0 }: { color: string; size?: number; collider?: boolean; y?: number }) => (
  <RigidBody type="fixed" colliders={false}>
    {collider && <CuboidCollider args={[size / 2, 0.1, size / 2]} position={[0, y - 0.1, 0]} />}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} receiveShadow>
      <planeGeometry args={[size, size, 12, 12]} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  </RigidBody>
);
