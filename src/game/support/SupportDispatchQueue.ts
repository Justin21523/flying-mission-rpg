import type { CharacterPresence, SupportDispatchEntry, SupportDispatchProfile } from '../../types/game/support';

export function canRequestSupport(
  characterId: string,
  profile: SupportDispatchProfile | undefined,
  dispatches: readonly SupportDispatchEntry[],
  presences: readonly CharacterPresence[],
): { ok: boolean; reason?: string } {
  if (!profile) return { ok: false, reason: 'No support profile for this character.' };
  if (!profile.canBeDispatched) return { ok: false, reason: 'This character cannot be dispatched.' };
  if (dispatches.some((d) => d.characterId === characterId && !d.cancelled && d.status !== 'returning')) {
    return { ok: false, reason: 'This character is already being dispatched.' };
  }
  if (presences.some((p) => p.characterId === characterId)) return { ok: false, reason: 'This character is already at the scene.' };
  const activeInstances = dispatches.filter((d) => d.characterId === characterId && !d.cancelled).length
    + presences.filter((p) => p.characterId === characterId).length;
  if (profile.maxSimultaneousInstances != null && activeInstances >= profile.maxSimultaneousInstances) {
    return { ok: false, reason: 'This character has reached the instance limit.' };
  }
  return { ok: true };
}
