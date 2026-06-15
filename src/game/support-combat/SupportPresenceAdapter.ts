import type { SupportCombatAbilityDefinition, SupportCombatStatus } from '../../types/game/supportCombat';
import { REMOTE_CAPABLE_SUPPORT_TYPES } from '../../data/support-combat/supportCombatAbilities';
import { useSupportRuntimeStore } from '../../stores/game/supportRuntimeStore';
import { activeCombatantId } from '../combat/CombatDirector';

// Bridges the existing companion DISPATCH state (presence tier + dispatch status) into support-COMBAT
// readiness (Batch E). No rewrite of dispatch — this just classifies. A hero who is the active player is
// surfaced as `remote-support` (shown + downgraded) so they can still call in remote abilities, never
// double-spawned.

export interface SupportPresenceInfo {
  characterId: string;
  status: SupportCombatStatus;
  etaSeconds?: number;
  isActivePlayer: boolean;
}

export interface AbilityAvailability {
  usable: boolean;
  reason?: string;
  downgraded?: boolean;
}

// Pure: given a presence + ability, can it be used?
export function classifyAbility(ability: SupportCombatAbilityDefinition, presence: SupportPresenceInfo, forceAvailable = false): AbilityAvailability {
  if (forceAvailable) return { usable: true };
  const s = presence.status;
  if (s === 'queued' || s === 'launching' || s === 'flying' || s === 'transforming' || s === 'arriving') {
    return { usable: false, reason: presence.etaSeconds != null ? `arriving ~${Math.ceil(presence.etaSeconds)}s` : 'arriving' };
  }
  if (s === 'unavailable' || s === 'returning' || s === 'cooldown' || s === 'available') {
    if (s === 'cooldown') return { usable: false, reason: 'cooldown' };
    if (s === 'available') return { usable: false, reason: 'not dispatched' };
    return { usable: false, reason: 'unavailable' };
  }
  // At-scene tiers.
  const required = ability.requiresSupportStatus ?? 'any';
  if (required !== 'any' && required !== s) return { usable: false, reason: `needs ${required}` };

  if (s === 'remote-support') {
    if (!REMOTE_CAPABLE_SUPPORT_TYPES.has(ability.supportType)) return { usable: false, reason: 'remote: scan/strike only' };
    return { usable: true, downgraded: true };
  }
  if (s === 'standby-at-scene') return { usable: true, downgraded: true };
  // active-at-scene
  return { usable: true };
}

// Reads the live dispatch state for a support character → presence info for combat.
export function getSupportPresence(characterId: string): SupportPresenceInfo {
  const rt = useSupportRuntimeStore.getState();
  const presence = rt.presences.find((p) => p.characterId === characterId);
  const isActivePlayer = activeCombatantId() === characterId;

  if (presence) {
    const status: SupportCombatStatus =
      presence.tier === 'active' ? 'active-at-scene' : presence.tier === 'standby' ? 'standby-at-scene' : 'remote-support';
    // If this presence IS the controlled player, treat as remote-support (they can't be their own companion).
    return { characterId, status: isActivePlayer ? 'remote-support' : status, isActivePlayer };
  }

  const dispatch = rt.dispatches.find((d) => d.characterId === characterId);
  if (dispatch) {
    // The dispatch status (queued/launching/flying/transforming/arriving/returning/available) maps 1:1 into
    // the support-combat status union; classifyAbility gates the in-flight ones as not-yet-usable + ETA.
    return { characterId, status: dispatch.status as SupportCombatStatus, etaSeconds: dispatch.etaSeconds, isActivePlayer };
  }

  // No dispatch + no presence. If this is the active player, expose as remote-support; else unavailable.
  return { characterId, status: isActivePlayer ? 'remote-support' : 'unavailable', isActivePlayer };
}
