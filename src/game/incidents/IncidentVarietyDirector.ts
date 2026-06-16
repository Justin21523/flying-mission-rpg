import type { IncidentTemplate } from '../../types/incidentTemplateTypes';
import type { IncidentType } from '../../types/incidentTypes';
import type { IncidentWorldStateSnapshot } from '../../types/incidentWorldStateTypes';
import { allIncidentTemplates } from '../../stores/useIncidentEditorStore';

// Incident variety director (Batch H). Picks a VARIED template for the current world — weighted to avoid the
// last-used types so successive AI incidents feel different, with a light bias toward templates whose required
// world entities are actually present. Deterministic-ish (only the random tiebreak varies). No state mutation.
const recent: IncidentType[] = [];
const RECENT_WINDOW = 3;

export function templatesByType(): Map<IncidentType, IncidentTemplate[]> {
  const map = new Map<IncidentType, IncidentTemplate[]>();
  for (const t of allIncidentTemplates()) {
    const list = map.get(t.incidentType) ?? [];
    list.push(t);
    map.set(t.incidentType, list);
  }
  return map;
}

function weightFor(t: IncidentTemplate, world: IncidentWorldStateSnapshot): number {
  let w = 10;
  // Penalise recently-used types so we cycle variety.
  const idx = recent.lastIndexOf(t.incidentType);
  if (idx >= 0) w -= (RECENT_WINDOW - (recent.length - 1 - idx)) * 3;
  // Slight bias toward templates whose device/enemy needs are met by the live world (else they use fallbacks).
  if (t.deviceSlotCount > 0 && world.deviceIds.length > 1) w += 2;
  if (t.enemyGroupSlotCount > 0 && world.enemyGroupIds.length > 1) w += 2;
  return Math.max(1, w);
}

export function pickVariedTemplate(world: IncidentWorldStateSnapshot, opts?: { excludeTypes?: IncidentType[] }): IncidentTemplate {
  const pool = allIncidentTemplates().filter((t) => t.enabled !== false && !(opts?.excludeTypes ?? []).includes(t.incidentType));
  const candidates = pool.length ? pool : allIncidentTemplates();
  const weights = candidates.map((t) => weightFor(t, world));
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  let chosen = candidates[0];
  for (let i = 0; i < candidates.length; i++) { roll -= weights[i]; if (roll <= 0) { chosen = candidates[i]; break; } }
  recent.push(chosen.incidentType);
  if (recent.length > RECENT_WINDOW) recent.shift();
  return chosen;
}

export function resetVarietyHistory(): void { recent.length = 0; }
