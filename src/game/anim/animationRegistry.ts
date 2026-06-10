import { getAnimationDef } from '../../stores/editorAnimationStore';
import { requestPlayerReaction } from './reactionAnim';
import { fireProceduralReaction } from './proceduralReaction';
import { emitGameEvent } from '../collision/gameEventBus';

// Phase C — resolve an AnimationDefinition id and play it as a reaction. For the player target, the clip is
// requested on the reactionAnim bus (played once through PlayerMesh's existing one-shot mixer path, IF the GLB
// has that clip). A 'reaction' game-event is always emitted too, so CollisionReactionFx shows a guaranteed
// visible signal even when the placeholder model lacks the named clip — the registry is the mechanism, the FX
// overlay is the fallback signal. NPC/vehicle targets get wired in Phase E.
export function playReaction(targetTag: 'source' | 'target', animationId: string, anchor?: { x: number; y: number; z: number }): void {
  const def = getAnimationDef(animationId);
  if (def && targetTag === 'source') {
    requestPlayerReaction(def.clipName, def.speed, def.fadeIn);
  }
  if (targetTag === 'source') fireProceduralReaction(); // guaranteed squash even if the clip is missing
  emitGameEvent({ kind: 'reaction', payload: def?.displayName ?? animationId, on: targetTag, x: anchor?.x, y: anchor?.y, z: anchor?.z });
}
