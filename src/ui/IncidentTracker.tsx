import { useEffect, useState } from 'react';
import { usePoll } from './usePoll';
import { useIncidentStore } from '../stores/incidentStore';
import { useIncidentScenarioStore } from '../stores/incidentScenarioStore';
import { getScenarios } from '../stores/editorTrafficScenarioStore';
import { usePlayerStore } from '../stores/playerStore';
import { subscribeIncidentNotify, type IncidentNotice } from '../game/incident/incidentNotify';
import { useT } from '../i18n/useT';

// Phase G1 — player-facing incident awareness: a top-left tracker listing active incidents in the current area
// (rescue incidents + traffic scenarios) with distance + a "📞 Go" dispatch hint (or "✅ On scene" when near),
// plus brief toasts when one starts / is missed. Reads the live stores directly; polled for distance.
const ON_SCENE = 6;

interface Row { id: string; name: string; severity: number; x: number; z: number }

const NOTICE_LIFE = 3.2;

export const IncidentTracker = () => {
  const t = useT();
  // Subscribe so the list re-renders when incidents/scenarios change; poll for live distance.
  const activeIds = useIncidentStore((s) => s.activeIds);
  const instances = useIncidentScenarioStore((s) => s.instances);
  usePoll(250);

  // Toasts (spawn / missed / resolved).
  const [toasts, setToasts] = useState<IncidentNotice[]>([]);
  useEffect(() => subscribeIncidentNotify((n) => {
    setToasts((cur) => [...cur, n].slice(-3));
    window.setTimeout(() => setToasts((cur) => cur.filter((x) => x.key !== n.key)), NOTICE_LIFE * 1000);
  }), []);

  const areaId = usePlayerStore.getState().currentAreaId;
  const pp = usePlayerStore.getState().position;
  void activeIds; // dependency for re-render only

  const rows: Row[] = [];
  for (const d of useIncidentStore.getState().getActiveForArea(areaId)) {
    rows.push({ id: d.id, name: d.title, severity: d.difficulty ?? 1, x: d.markerPosition[0], z: d.markerPosition[2] });
  }
  for (const inst of instances) {
    if (inst.areaId !== areaId) continue;
    const sev = getScenarios().find((s) => s.id === inst.scenarioId)?.severity ?? 1;
    rows.push({ id: inst.instanceId, name: inst.name, severity: sev, x: inst.position[0], z: inst.position[2] });
  }

  const toastLabel = (n: IncidentNotice) => `${n.kind === 'new' ? '🚨 ' + t('inc_new') : n.kind === 'missed' ? '⌛ ' + t('inc_missed') : '✅ ' + t('inc_resolved')} · ${n.name}`;

  if (rows.length === 0 && toasts.length === 0) return null;

  return (
    <>
      {/* Toasts (top-centre, under the radar) */}
      {toasts.length > 0 && (
        <div className="pointer-events-none absolute left-1/2 top-36 z-[71] flex -translate-x-1/2 flex-col items-center gap-1">
          {toasts.map((n) => (
            <div key={n.key} className={`rounded-full px-3 py-1 text-xs font-bold shadow-xl backdrop-blur-md ${n.kind === 'missed' ? 'bg-amber-950/80 text-amber-200' : n.kind === 'resolved' ? 'bg-emerald-950/80 text-emerald-200' : 'bg-rose-950/85 text-rose-100'}`} style={{ animation: 'rescueToolFlash 0.3s ease-out' }}>
              {toastLabel(n)}
            </div>
          ))}
        </div>
      )}

      {/* Active list (top-left, under the License badge) */}
      {rows.length > 0 && (
        <div className="pointer-events-none absolute left-4 top-28 z-[60] w-60 rounded-lg border border-rose-500/50 bg-slate-900/85 p-3 text-white shadow-2xl backdrop-blur-md">
          <h2 className="mb-2 flex items-center gap-2 border-b border-rose-600/40 pb-1 text-sm font-bold text-rose-200"><span>🚨</span> {t('inc_title')} · {rows.length}</h2>
          <ul className="space-y-1.5">
            {rows.map((r) => {
              const d = pp ? Math.hypot(pp.x - r.x, pp.z - r.z) : 999;
              const near = d <= ON_SCENE;
              return (
                <li key={r.id} className="text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-rose-300">{'⚠'.repeat(Math.max(1, Math.min(3, r.severity)))}</span>
                    <span className="flex-1 truncate text-slate-100">{r.name}</span>
                  </div>
                  <div className={`text-[10px] ${near ? 'text-emerald-300' : 'text-amber-200'}`}>
                    {near ? `✅ ${t('inc_onScene')}` : `📞 ${t('inc_go')} · ${Math.round(d)}m`}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
};
