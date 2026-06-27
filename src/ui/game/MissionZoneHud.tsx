import { useMemo } from 'react';
import { useUiStore } from '../../stores/uiStore';
import { useDevStore } from '../../stores/devStore';
import { useGameStore } from '../../stores/game/useGameStore';
import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';
import { useEditorMissionZoneStore } from '../../stores/game/editorMissionZoneStore';
import { useEditorZoneSegmentStore } from '../../stores/game/editorZoneSegmentStore';
import type { ZoneConditionDefinition, ZoneSegmentDefinition } from '../../types/game/advancedMissionZone';
import {
  debugCompleteCurrentSegment,
  debugJumpToSegment,
  debugUnlockAllSegments,
} from '../../game/advanced-mission-zone/AdvancedMissionZoneDirector';

// HUD for the Advanced Mission Zone — current zone + segment, the live completion-condition checklist, and
// a next-zone hint. A debug strip (when the game-state console or Edit Mode is open) exposes jump / complete
// / unlock controls. Driven entirely by the runtime store + editor data; it never mutates low-level state.

function describeCondition(c: ZoneConditionDefinition): string {
  switch (c.type) {
    case 'always': return 'Begin';
    case 'reach-marker': return 'Reach the marker';
    case 'interact-with-object': return `Activate ${c.objectId.replace(/_/g, ' ')} (E)`;
    case 'complete-existing-objective': return `Complete objective: ${c.objectiveId.replace(/_/g, ' ')}`;
    case 'wait-seconds': return `Hold position (${c.seconds}s)`;
    case 'debug-complete': return 'Debug complete';
    case 'placeholder-clear-area': return 'Secure the area';
    case 'segment-completed': return `Finish ${c.segmentId.replace(/_/g, ' ')}`;
    case 'defeat-enemy-group': return `Defeat ${c.enemyGroupId.replace(/_/g, ' ')}`;
    case 'destroy-obstacle': return `Destroy ${c.obstacleId.replace(/_/g, ' ')}`;
    case 'clear-obstacle': return `Clear ${c.obstacleId.replace(/_/g, ' ')}`;
    case 'repair-device': return `Repair ${c.deviceId.replace(/_/g, ' ')}`;
    case 'future-defeat-enemy-group': return 'Defeat the enemies (coming soon)';
    case 'future-destroy-obstacle': return 'Destroy the obstacle (coming soon)';
    case 'future-repair-device': return 'Repair the device (coming soon)';
    case 'future-resolve-incident': return 'Resolve the incident (coming soon)';
    case 'future-defeat-boss': return 'Defeat the boss (coming soon)';
    case 'defense-waves': return 'Survive the waves';
    case 'timed-rescue': return 'Rescue all targets in time';
    case 'scan-targets': return 'Scan the targets';
    default: return 'Objective';
  }
}

export const MissionZoneHud = () => {
  const phase = useGameStore((s) => s.phase);
  const editMode = useUiStore((s) => s.editMode);
  const fsmDebug = useDevStore((s) => s.fsmDebug);

  const activeZoneId = useAdvancedMissionZoneStore((s) => s.activeZoneId);
  const activeSegmentId = useAdvancedMissionZoneStore((s) => s.activeSegmentId);
  const completedSegmentIds = useAdvancedMissionZoneStore((s) => s.completedSegmentIds);
  const conditionProgress = useAdvancedMissionZoneStore((s) => s.currentConditionProgress);
  const status = useAdvancedMissionZoneStore((s) => s.missionZoneStatus);

  const zones = useEditorMissionZoneStore((s) => s.items);
  const allSegments = useEditorZoneSegmentStore((s) => s.items);

  const zone = useMemo(() => zones.find((z) => z.id === activeZoneId), [zones, activeZoneId]);
  const segments = useMemo(
    () => allSegments.filter((s) => s.zoneId === activeZoneId).sort((a, b) => a.order - b.order),
    [allSegments, activeZoneId],
  );
  const segment = useMemo(() => segments.find((s) => s.id === activeSegmentId), [segments, activeSegmentId]);

  if (!activeZoneId || !zone) return null;
  const isZonePhase = phase === 'ADVANCED_MISSION_ZONE' || phase === 'ZONE_SEGMENT_GAMEPLAY' || phase === 'ZONE_COMPLETE';
  if (!isZonePhase) return null;

  const total = segments.length;
  const index = segment ? segments.findIndex((s) => s.id === segment.id) + 1 : completedSegmentIds.length;
  const nextSeg: ZoneSegmentDefinition | undefined = segment
    ? segments.find((s) => segment.nextSegmentIds.includes(s.id))
    : undefined;

  return (
    <>
      <div className="pointer-events-none fixed right-4 top-20 z-30 w-72 rounded-xl border border-sky-500/30 bg-slate-900/80 p-3 text-slate-100 shadow-lg backdrop-blur">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-sky-300">{zone.name}</div>
        <div className="mt-0.5 flex items-baseline gap-2">
          <span className="text-sm font-bold">{segment ? segment.name : 'Loading…'}</span>
          <span className="ml-auto text-[11px] text-slate-400">Zone {Math.max(1, index)} / {total}</span>
        </div>
        {segment && <div className="text-[10px] uppercase tracking-wide text-slate-500">{segment.segmentType.replace(/-/g, ' ')}</div>}

        {segment && (
          <ul className="mt-2 space-y-1">
            {segment.completionConditions.map((c) => {
              const p = conditionProgress[c.id];
              const done = !!p?.done;
              const showCount = c.type === 'wait-seconds' && p ? ` (${p.current}/${p.total})` : '';
              return (
                <li key={c.id} className="flex items-center gap-2 text-xs">
                  <span className={done ? 'text-emerald-400' : 'text-slate-500'}>{done ? '☑' : '☐'}</span>
                  <span className={done ? 'text-slate-400 line-through' : 'text-slate-100'}>{describeCondition(c)}{showCount}</span>
                </li>
              );
            })}
          </ul>
        )}

        {nextSeg && <div className="mt-2 text-[10px] text-slate-400">Next: {nextSeg.name}</div>}

        {(fsmDebug || editMode) && (
          <div className="pointer-events-auto mt-3 border-t border-slate-700/60 pt-2 text-[10px] text-slate-400">
            <div>zone: {activeZoneId}</div>
            <div>segment: {activeSegmentId ?? '—'} · status: {status}</div>
            <div>done: {completedSegmentIds.length} · unlocked: {useAdvancedMissionZoneStore.getState().unlockedSegmentIds.length}</div>
            <div className="mt-1 flex flex-wrap gap-1">
              <button onClick={debugCompleteCurrentSegment} className="rounded bg-emerald-700/70 px-2 py-0.5 text-white hover:bg-emerald-600">Complete</button>
              <button onClick={debugUnlockAllSegments} className="rounded bg-slate-700 px-2 py-0.5 text-white hover:bg-slate-600">Unlock all</button>
              <select
                value=""
                onChange={(e) => { if (e.target.value) debugJumpToSegment(e.target.value); }}
                className="rounded bg-slate-800 px-1 py-0.5 text-slate-100"
              >
                <option value="">Jump to…</option>
                {segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {phase === 'ZONE_COMPLETE' && (
        <div className="pointer-events-none fixed left-1/2 top-1/3 z-40 -translate-x-1/2 rounded-xl border border-emerald-400/40 bg-slate-900/90 px-6 py-3 text-center shadow-xl backdrop-blur">
          <div className="text-xs uppercase tracking-widest text-emerald-300">Zone Complete</div>
          <div className="text-lg font-bold text-white">{segment?.name ?? ''}</div>
        </div>
      )}
    </>
  );
};
