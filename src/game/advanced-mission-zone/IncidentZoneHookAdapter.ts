import { generateAndStart } from '../incidents/AIIncidentDirector';

// Zone → AI incident seam (Batch G). When a zone/segment declares aiIncidentHooks, each hook id is treated as
// an incident TEMPLATE id; on the trigger we generate a validated mock IncidentPlan for that template + the
// current world and apply it. The generated incident gets a DETERMINISTIC id (`incident_<segmentId>`) so a
// `resolve-incident` zone condition can reference it. The director never lets an invalid plan touch the world.
export function runIncidentHooks(hookIds: string[] | undefined, ctx: { zoneId?: string; segmentId?: string }): void {
  if (!hookIds || hookIds.length === 0) return;
  const incidentId = ctx.segmentId ? `incident_${ctx.segmentId}` : undefined;
  for (const templateId of hookIds) {
    generateAndStart({ mode: 'mock', templateId, incidentId });
    break; // one incident at a time in this foundation batch
  }
  if (import.meta.env.DEV) console.debug('[zone-incident-hook]', { hookIds, ...ctx, incidentId });
}

// Stable incident id a segment's resolve-incident condition should reference.
export function incidentIdForSegment(segmentId: string): string {
  return `incident_${segmentId}`;
}
