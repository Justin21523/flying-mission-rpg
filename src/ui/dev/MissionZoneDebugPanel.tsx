import { useMemo, useState } from 'react';
import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';
import { useEditorMissionZoneStore } from '../../stores/game/editorMissionZoneStore';
import { useEditorZoneSegmentStore } from '../../stores/game/editorZoneSegmentStore';
import {
  debugCompleteCurrentSegment,
  debugJumpToSegment,
  debugUnlockAllSegments,
  startMissionZone,
} from '../../game/advanced-mission-zone/AdvancedMissionZoneDirector';
import { validateMissionZone } from '../../game/advanced-mission-zone/zoneValidation';

// Developer tools for the Advanced Mission Zone — god mode, segment jump/complete/unlock, reset/reload, the
// live condition-progress readout, validation, and a runtime snapshot export. Mounted in App.tsx for the
// game-state console / Edit Mode while a zone is active.
const btn = 'rounded px-2 py-0.5 text-[11px] text-white';

export const MissionZoneDebugPanel = () => {
  const z = useAdvancedMissionZoneStore();
  const zones = useEditorMissionZoneStore((s) => s.items);
  const allSegments = useEditorZoneSegmentStore((s) => s.items);
  const [snapshot, setSnapshot] = useState<string | null>(null);

  const zone = useMemo(() => zones.find((zz) => zz.id === z.activeZoneId), [zones, z.activeZoneId]);
  const segments = useMemo(
    () => allSegments.filter((s) => s.zoneId === z.activeZoneId).sort((a, b) => a.order - b.order),
    [allSegments, z.activeZoneId],
  );
  const validation = useMemo(() => (zone ? validateMissionZone(zone, allSegments) : null), [zone, allSegments]);

  if (!zone) return null;

  const exportSnapshot = () => {
    const data = {
      activeZoneId: z.activeZoneId,
      activeSegmentId: z.activeSegmentId,
      missionZoneStatus: z.missionZoneStatus,
      completedSegmentIds: z.completedSegmentIds,
      unlockedSegmentIds: z.unlockedSegmentIds,
      currentConditionProgress: z.currentConditionProgress,
      interactedObjectIds: z.interactedObjectIds,
      clearedAreaIds: z.clearedAreaIds,
    };
    const json = JSON.stringify(data, null, 2);
    setSnapshot(json);
    void navigator.clipboard?.writeText(json).catch(() => {});
  };

  return (
    <div className="pointer-events-auto fixed bottom-4 left-4 z-40 w-80 rounded-xl border border-fuchsia-500/30 bg-slate-900/90 p-3 text-slate-100 shadow-xl backdrop-blur">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-fuchsia-300">🎯 Mission Zone Debug</div>
      <div className="mt-1 text-[10px] text-slate-400">
        <div>zone: {z.activeZoneId}</div>
        <div>segment: {z.activeSegmentId ?? '—'} · status: {z.missionZoneStatus}</div>
        <div>completed: {z.completedSegmentIds.length} / {segments.length} · unlocked: {z.unlockedSegmentIds.length}</div>
      </div>

      <label className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-300">
        <input type="checkbox" checked={z.debug.godMode} onChange={(e) => z.setDebug({ godMode: e.target.checked })} className="accent-fuchsia-500" />
        God mode (auto-satisfy conditions)
      </label>

      <div className="mt-2 flex flex-wrap gap-1">
        <button onClick={debugCompleteCurrentSegment} className={`${btn} bg-emerald-700 hover:bg-emerald-600`}>Complete segment</button>
        <button onClick={debugUnlockAllSegments} className={`${btn} bg-slate-700 hover:bg-slate-600`}>Unlock all</button>
        <button onClick={() => z.resetZone()} className={`${btn} bg-rose-700 hover:bg-rose-600`}>Reset zone</button>
        <button onClick={() => z.activeZoneId && startMissionZone(z.activeZoneId)} className={`${btn} bg-sky-700 hover:bg-sky-600`}>Reload def</button>
      </div>

      <div className="mt-2">
        <select
          value=""
          onChange={(e) => { if (e.target.value) debugJumpToSegment(e.target.value); }}
          className="w-full rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-100"
        >
          <option value="">Jump to segment…</option>
          {segments.map((s) => <option key={s.id} value={s.id}>{s.order}. {s.name}</option>)}
        </select>
      </div>

      {Object.keys(z.currentConditionProgress).length > 0 && (
        <div className="mt-2 text-[10px] text-slate-400">
          <div className="font-semibold text-slate-300">Conditions</div>
          {Object.values(z.currentConditionProgress).map((p) => (
            <div key={p.conditionId}>{p.done ? '☑' : '☐'} {p.conditionId} ({p.current}/{p.total})</div>
          ))}
        </div>
      )}

      {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="mt-2 text-[10px]">
          {validation.errors.map((e, i) => <div key={`e${i}`} className="text-rose-400">✗ {e}</div>)}
          {validation.warnings.map((w, i) => <div key={`w${i}`} className="text-amber-400">⚠ {w}</div>)}
        </div>
      )}

      <button onClick={exportSnapshot} className={`${btn} mt-2 bg-slate-700 hover:bg-slate-600`}>Export snapshot (copy)</button>
      {snapshot && <pre className="mt-1 max-h-32 overflow-auto rounded bg-slate-950/80 p-2 text-[9px] text-slate-300">{snapshot}</pre>}
    </div>
  );
};
