// Batch 13 — best-effort leak/residual gauges. Systems register a named gauge fn (e.g. active audio loops,
// pooled objects); the health monitor reads them. Honest about being best-effort — there's no global
// listener census, so this surfaces the counts subsystems choose to report.
const gauges = new Map<string, () => number>();

export function registerGauge(name: string, read: () => number): () => void {
  gauges.set(name, read);
  return () => gauges.delete(name);
}

export function readGauges(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [name, read] of gauges) {
    try { out[name] = read(); } catch { out[name] = -1; }
  }
  return out;
}
