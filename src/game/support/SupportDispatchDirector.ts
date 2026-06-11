import { useSupportRuntimeStore, makeDispatchEntry } from '../../stores/game/supportRuntimeStore';
import { getMultiCharacterLimits, getSupportProfileForCharacter, getSupportProfiles } from '../../stores/game/editorSupportStore';
import { getEditorCharacter } from '../../stores/game/editorCharacterStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { gameEventBus } from '../core/EventBus';
import { advanceDispatch } from './SupportDispatchRuntime';
import { canRequestSupport } from './SupportDispatchQueue';
import { supportArrivalPresence } from './SupportArrivalSimulator';
import { addCharacterPresence } from '../characters/runtime/MultiCharacterManager';
import type { SupportDispatchMode } from '../../types/game/support';

export function requestSupport(characterId: string, mode?: SupportDispatchMode, nowMs = performance.now()): { ok: boolean; reason?: string } {
  const profile = getSupportProfileForCharacter(characterId);
  const runtime = useSupportRuntimeStore.getState();
  const validation = canRequestSupport(characterId, profile, runtime.dispatches, runtime.presences);
  if (!validation.ok || !profile) return validation;
  if (!getEditorCharacter(characterId)) return { ok: false, reason: 'Character does not exist.' };
  const entry = makeDispatchEntry(characterId, mode ?? profile.defaultDispatchMode, nowMs);
  entry.etaSeconds = profile.quickModeTotalSeconds;
  useSupportRuntimeStore.getState().upsertDispatch(entry);
  gameEventBus.emit('support:requested', { characterId, mode: entry.mode });
  return { ok: true };
}

export function cancelSupport(characterId: string, reason = 'Cancelled'): void {
  useSupportRuntimeStore.getState().updateDispatch(characterId, { cancelled: true, status: 'returning' });
  gameEventBus.emit('support:cancelled', { characterId, reason });
}

export function forceSupportArrival(characterId: string): void {
  const runtime = useSupportRuntimeStore.getState();
  const profile = getSupportProfileForCharacter(characterId);
  if (!profile) return;
  const controlled = runtime.ownership.controlledCharacterId ?? useCharacterStore.getState().selectedCharacterId;
  const nextPresence = supportArrivalPresence(characterId, 'active');
  const presences = addCharacterPresence(runtime.presences, nextPresence, getMultiCharacterLimits(), controlled);
  useSupportRuntimeStore.setState({ presences, dispatches: runtime.dispatches.filter((d) => d.characterId !== characterId) });
  useCharacterStore.getState().addSupport({ characterId, status: presences.find((p) => p.characterId === characterId)?.tier ?? nextPresence.tier });
  useSupportRuntimeStore.getState().pushToast(characterId, `${getEditorCharacter(characterId)?.name ?? characterId} arrived`);
  gameEventBus.emit('support:arrived', { characterId });
}

export function tickSupportDispatch(deltaSeconds: number, nowMs = performance.now()): void {
  const runtime = useSupportRuntimeStore.getState();
  if (runtime.paused) return;
  let dispatches = runtime.dispatches;
  for (const entry of runtime.dispatches) {
    const profile = getSupportProfileForCharacter(entry.characterId);
    if (!profile) continue;
    const next = advanceDispatch(entry, profile, deltaSeconds, nowMs);
    if (next.status !== entry.status) gameEventBus.emit('support:stage-changed', { characterId: entry.characterId, status: next.status });
    if (Math.ceil(next.etaSeconds) !== Math.ceil(entry.etaSeconds)) gameEventBus.emit('support:eta-updated', { characterId: entry.characterId, etaSeconds: next.etaSeconds });
    dispatches = dispatches.map((d) => (d.characterId === entry.characterId ? next : d));
    if (next.status === 'active-at-scene' && entry.status !== 'active-at-scene') forceSupportArrival(entry.characterId);
  }
  useSupportRuntimeStore.setState({ dispatches: dispatches.filter((d) => d.status !== 'active-at-scene') });
  useSupportRuntimeStore.getState().clearOldToasts(Date.now());
}

export function availableSupportCharacterIds(): string[] {
  return getSupportProfiles().filter((p) => p.canBeDispatched && getEditorCharacter(p.characterId)).map((p) => p.characterId);
}
