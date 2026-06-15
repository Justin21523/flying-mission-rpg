import type { CharacterModelSocketConfig, SocketName } from '../../types/game/characterKit';
import { robotHandle } from '../destination/robotHandle';
import { getKitForCharacter } from '../../stores/game/editorCharacterKitStore';

// Resolves character model sockets to world transforms (Batch D-kits). No real GLTF bones yet — uses the
// kit's fallbackOffset, rotated by the character facing + placed at the live robot position, so effects can
// attach to a wing / tool-arm / shield-front / scanner-head without bone data. Pure resolver + runtime helper.

export function resolveSocketOffset(config: CharacterModelSocketConfig | undefined, socketName: SocketName): { offset: [number, number, number]; rotation: [number, number, number] } {
  const s = config?.sockets.find((x) => x.socketName === socketName);
  return { offset: s?.fallbackOffset ?? [0, 1, 0], rotation: s?.fallbackRotation ?? [0, 0, 0] };
}

// World transform for a socket on the currently-controlled robot (facing-rotated fallback offset).
export function getSocketWorldTransform(characterId: string | undefined, socketName: SocketName): { x: number; y: number; z: number; headingRad: number } {
  const kit = getKitForCharacter(characterId);
  const { offset } = resolveSocketOffset(kit?.modelSocketConfig, socketName);
  const h = robotHandle.heading;
  // rotate the local offset by heading (forward = sin/cos)
  const fx = Math.sin(h), fz = Math.cos(h);
  const rx = offset[0] * fz + offset[2] * fx;
  const rz = -offset[0] * fx + offset[2] * fz;
  return { x: robotHandle.pos.x + rx, y: robotHandle.pos.y + offset[1], z: robotHandle.pos.z + rz, headingRad: h };
}
