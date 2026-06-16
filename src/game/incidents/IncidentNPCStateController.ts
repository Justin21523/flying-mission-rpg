import type { IncidentNpcChange } from '../../types/incidentTypes';
import { useIncidentNpcStateStore, type IncidentNpcState } from '../../stores/useIncidentNpcStateStore';

// Applies npc state changes for an incident (Batch G §7.6) through the incident npc store (the base game has no
// rescue/panic state). Never touches other stores.
const CHANGE_TO_STATE: Record<Exclude<IncidentNpcChange, 'set-dialogue-hint'>, IncidentNpcState> = {
  'set-trapped': 'trapped', 'set-panicked': 'panicked', 'set-injured': 'injured',
  'set-waiting-rescue': 'waiting-rescue', 'set-evacuating': 'evacuating', 'set-safe': 'safe',
};

export function applyNpcChange(npcId: string, change: IncidentNpcChange, center: [number, number, number], index = 0, value?: unknown): void {
  const store = useIncidentNpcStateStore.getState();
  if (change === 'set-dialogue-hint') {
    store.setNpc(npcId, { dialogueHint: typeof value === 'string' ? value : 'Help!' });
    return;
  }
  const angle = index * 1.7;
  const pos: [number, number, number] = [center[0] + Math.cos(angle) * 3, center[1], center[2] + Math.sin(angle) * 3];
  const existing = store.npcs[npcId];
  store.setNpc(npcId, { state: CHANGE_TO_STATE[change], position: existing?.position ?? pos });
}

export function isNpcSafe(npcId: string): boolean {
  return useIncidentNpcStateStore.getState().npcs[npcId]?.state === 'safe';
}

export function cleanupIncidentNpcs(): void {
  useIncidentNpcStateStore.getState().clearAll();
}
