import type { IncidentStateChange, IncidentNpcChange, IncidentObjectChange, IncidentObstacleChange, IncidentEnvironmentChange } from '../../types/incidentTypes';

// Terse builders for IncidentStateChange records (Batch G). Each gets a stable id so the runtime can track
// which changes were applied (for replay + rollback). Templates use slot ids ('npc#0' etc.) that the mock
// provider substitutes with live world ids.
let n = 0;
const sid = (p: string) => `sc_${p}_${n++}`;

export const npcChange = (targetId: string, change: IncidentNpcChange, value?: unknown): IncidentStateChange => ({ id: sid('npc'), targetType: 'npc', targetId, change, value });
export const objectChange = (targetId: string, change: IncidentObjectChange, value?: unknown): IncidentStateChange => ({ id: sid('obj'), targetType: 'object', targetId, change, value });
export const obstacleChange = (targetId: string, change: IncidentObstacleChange, value?: unknown): IncidentStateChange => ({ id: sid('obs'), targetType: 'obstacle', targetId, change, value });
export const envChange = (targetId: string, change: IncidentEnvironmentChange, value?: unknown): IncidentStateChange => ({ id: sid('env'), targetType: 'environment', targetId, change, value });

// Ensure every state change carries an id (manual/LLM plans may omit it).
export function ensureStateChangeIds(changes: IncidentStateChange[]): IncidentStateChange[] {
  return changes.map((c, i) => (c.id ? c : ({ ...c, id: `sc_auto_${i}` } as IncidentStateChange)));
}
