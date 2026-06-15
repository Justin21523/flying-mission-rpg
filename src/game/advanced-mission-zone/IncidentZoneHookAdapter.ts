// Placeholder adapter for AI / LLM incident hooks declared on zones & segments. New Batch A only logs the
// hook ids (in dev) — a later batch wires these to the real incident generator. Kept as a single seam so
// the director never calls the incident system directly.
export function runIncidentHooks(hookIds: string[] | undefined, ctx: { zoneId?: string; segmentId?: string }): void {
  if (!hookIds || hookIds.length === 0) return;
  if (import.meta.env.DEV) {
    console.debug('[zone-incident-hook]', { hookIds, ...ctx });
  }
}
