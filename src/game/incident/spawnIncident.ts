import { useIncidentStore } from '../../stores/incidentStore';
import { useEditorRandomEventStore, incidentCfg } from '../../stores/editorRandomEventStore';
import { getEditorIncidents } from '../../stores/editorIncidentStore';
import { useWorldClockStore } from '../../stores/worldClockStore';
import { useRescueLicenseStore } from '../../stores/rescueLicenseStore';
import { playSfx } from '../audio/sfx';

// Pick + spawn one eligible incident now (weighted-random; respects enabled/active/resolved + cap, plus
// each incident's spawn conditions: time-of-day, weather, and required-rescues license gate).
// Returns the spawned id or null. Used by the IncidentDirector loop + traffic AI + "Spawn now".
export function spawnRandomIncident(): string | null {
  const incident = useIncidentStore.getState();
  const cfg = useEditorRandomEventStore.getState();
  if (incident.activeIds.length >= cfg.maxConcurrent) return null;

  const clock = useWorldClockStore.getState();
  const rescues = useRescueLicenseStore.getState().rescuesCompleted;
  const matches = (cond: string | undefined, current: string) => !cond || cond === 'any' || cond === current;

  const eligible = getEditorIncidents().filter((d) =>
    incidentCfg(d.id).enabled
    && !incident.activeIds.includes(d.id)
    && !incident.isResolved(d.id)
    && matches(d.spawnTimeOfDay, clock.timeOfDay)
    && matches(d.spawnWeather, clock.weather)
    && rescues >= (d.requiredRescues ?? 0));
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
