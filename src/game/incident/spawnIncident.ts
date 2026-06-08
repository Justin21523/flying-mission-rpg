import { useIncidentStore } from '../../stores/incidentStore';
import { useEditorRandomEventStore, incidentCfg } from '../../stores/editorRandomEventStore';
import { getEditorIncidents } from '../../stores/editorIncidentStore';
import { playSfx } from '../audio/sfx';

// Pick + spawn one eligible incident now (weighted-random; respects enabled/active/resolved + cap).
// Returns the spawned id or null. Used by the IncidentDirector loop and the "Spawn random now" button.
export function spawnRandomIncident(): string | null {
  const incident = useIncidentStore.getState();
  const cfg = useEditorRandomEventStore.getState();
  if (incident.activeIds.length >= cfg.maxConcurrent) return null;

  const eligible = getEditorIncidents().filter((d) =>
    incidentCfg(d.id).enabled
    && !incident.activeIds.includes(d.id)
    && !incident.isResolved(d.id));
  if (eligible.length === 0) return null;

  const total = eligible.reduce((s, d) => s + Math.max(0, incidentCfg(d.id).weight), 0);
  if (total <= 0) return null;
  let r = Math.random() * total;
  let chosen = eligible[0];
  for (const d of eligible) { r -= Math.max(0, incidentCfg(d.id).weight); if (r <= 0) { chosen = d; break; } }
  incident.spawn(chosen.id);
  playSfx('incident');
  return chosen.id;
}
