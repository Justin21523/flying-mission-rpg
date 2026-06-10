import type { GameplayCollisionEvent, ReactionAction } from '../../types/collision';
import { playReaction } from '../anim/animationRegistry';
import { playSfx, type SfxName } from '../audio/sfx';
import { triggerPlayerHit } from '../combat/playerHitBus';
import { enterPathFollow, exitPathFollow } from '../combat/pathFollow';
import { useIncidentStore } from '../../stores/incidentStore';
import { useRelationshipStore } from '../../stores/relationshipStore';
import { useDialogueStore } from '../../stores/dialogueStore';
import { emitGameEvent } from './gameEventBus';

// Phase C — execute one ReactionAction against an existing system. Every branch resolves to real behaviour or
// is surfaced on the game-event bus (+ dev console) — never a silent no-op. Called by the reaction engine.
const VALID_SFX = new Set<SfxName>(['transform', 'ability', 'rescueSuccess', 'rescueFail', 'incident', 'questComplete', 'ui']);

export function runReactionAction(a: ReactionAction, e: GameplayCollisionEvent): void {
  switch (a.type) {
    case 'playAnimation': {
      const p = e.contactPoint;
      playReaction(a.on, a.animationId, p ? { x: p[0], y: p[1], z: p[2] } : undefined);
      return;
    }
    case 'playSound': {
      if (VALID_SFX.has(a.soundId as SfxName)) playSfx(a.soundId as SfxName);
      else emitGameEvent({ kind: 'gameEvent', payload: `sound:${a.soundId}` }); // unknown cue → surfaced, not swallowed
      return;
    }
    case 'spawnEffect':
      emitGameEvent({ kind: 'spawnEffect', payload: a.effectId, ...anchor(e) });
      return;
    case 'applyForce': {
      // Only the player is force-driven today (knockback bus). Zero direction = shove away along the contact
      // normal (target → source); otherwise use the authored horizontal direction.
      if (a.on !== 'source') { emitGameEvent({ kind: 'gameEvent', payload: 'applyForce:target' }); return; }
      let dx = a.direction[0], dz = a.direction[2];
      if (dx === 0 && dz === 0 && e.contactNormal) { dx = e.contactNormal[0]; dz = e.contactNormal[2]; }
      const len = Math.hypot(dx, dz) || 1;
      triggerPlayerHit(dx / len, dz / len, a.strength);
      return;
    }
    case 'changeState':
      emitGameEvent({ kind: 'changeState', payload: a.state, on: a.on });
      return;
    case 'startDialogue':
      useDialogueStore.getState().startDialogue(a.dialogueTreeId);
      return;
    case 'triggerNpcReaction':
      emitGameEvent({ kind: 'npcReaction', payload: a.reaction });
      return;
    case 'startIncident':
      useIncidentStore.getState().spawn(a.incidentId);
      return;
    case 'enterPathFollow':
      enterPathFollow(a.pathId, a.mode);
      return;
    case 'exitPathFollow':
      exitPathFollow();
      return;
    case 'modifyRelationship': {
      const rel = useRelationshipStore.getState();
      if (a.amount >= 0) rel.increaseTrust(a.characterId, a.amount);
      else rel.decreaseTrust(a.characterId, -a.amount);
      return;
    }
    case 'emitGameEvent':
      emitGameEvent({ kind: 'gameEvent', payload: a.event, ...anchor(e) });
      return;
  }
}

function anchor(e: GameplayCollisionEvent): { x?: number; y?: number; z?: number } {
  const p = e.contactPoint;
  return p ? { x: p[0], y: p[1], z: p[2] } : {};
}
