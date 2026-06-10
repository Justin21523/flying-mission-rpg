// Phase G1 — a tiny toast bus for "an incident just happened / was missed". The directors call notifyIncident()
// when a rescue incident or traffic scenario starts (and on a missed timeout); IncidentTracker subscribes and
// shows a brief fading toast. Plain listener array — no React, no per-frame work. The persistent "active list"
// is read directly from incidentStore / incidentScenarioStore (not duplicated here).
export type IncidentNotifyKind = 'new' | 'missed' | 'resolved';
export interface IncidentNotice { kind: IncidentNotifyKind; name: string; key: number }

type Listener = (n: IncidentNotice) => void;
const listeners: Listener[] = [];
let seq = 0;

export function subscribeIncidentNotify(cb: Listener): () => void {
  listeners.push(cb);
  return () => { const i = listeners.indexOf(cb); if (i >= 0) listeners.splice(i, 1); };
}

export function notifyIncident(kind: IncidentNotifyKind, name: string): void {
  const n: IncidentNotice = { kind, name, key: seq++ };
  for (const cb of listeners) cb(n);
}
