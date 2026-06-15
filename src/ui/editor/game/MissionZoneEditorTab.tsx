import { useMemo, useState } from 'react';
import { nanoid } from 'nanoid';
import { useEditorMissionZoneStore } from '../../../stores/game/editorMissionZoneStore';
import { useEditorZoneSegmentStore } from '../../../stores/game/editorZoneSegmentStore';
import {
  ZONE_SEGMENT_TYPES,
  ZONE_MARKER_TYPES,
  ZONE_CONDITION_TYPES,
  FUTURE_CONDITION_TYPES,
} from '../../../types/game/advancedMissionZone';
import type {
  MissionZoneDefinition,
  ZoneSegmentDefinition,
  ZoneConditionDefinition,
  ZoneConditionType,
  ZoneMarkerDefinition,
} from '../../../types/game/advancedMissionZone';
import { validateMissionZone } from '../../../game/advanced-mission-zone/zoneValidation';
import { Field, inp, lbl, Check, FocusButton, csv, parseCsv } from '../editorShared';

// 🎯 Mission Zone — author Advanced Mission Zones + their ordered Zone Segments. Conditions and markers are
// edited inline on the selected segment (matching the rest of the editor). Validate before relying on a
// draft; markers can be focused in 3D. Position editing is form-based this batch (no dedicated gizmo).
const num = (v: string) => parseFloat(v) || 0;

const makeZone = (): MissionZoneDefinition => ({
  id: `mz_${nanoid(6)}`,
  locationId: 'loc_sunnyharbor',
  name: 'New Mission Zone',
  segmentIds: [],
  startSegmentId: '',
  finalSegmentIds: [],
  zoneMode: 'semi-linear',
  allowBacktracking: true,
  enabled: true,
});

const makeSegment = (zoneId: string, order: number): ZoneSegmentDefinition => ({
  id: `seg_${nanoid(6)}`,
  zoneId,
  name: 'New Segment',
  order,
  segmentType: 'exploration',
  entryConditions: [{ id: `c_${nanoid(4)}`, type: 'always' }],
  completionConditions: [{ id: `c_${nanoid(4)}`, type: 'debug-complete' }],
  nextSegmentIds: [],
  markers: [],
  enabled: true,
});

function defaultCondition(type: ZoneConditionType, id: string): ZoneConditionDefinition {
  switch (type) {
    case 'reach-marker': return { id, type, markerId: '', radius: 4 };
    case 'interact-with-object': return { id, type, objectId: '' };
    case 'complete-existing-objective': return { id, type, objectiveId: '' };
    case 'wait-seconds': return { id, type, seconds: 5 };
    case 'placeholder-clear-area': return { id, type, areaId: '' };
    case 'segment-completed': return { id, type, segmentId: '' };
    case 'future-defeat-enemy-group': return { id, type, enemyGroupId: '' };
    case 'future-destroy-obstacle': return { id, type, obstacleId: '' };
    case 'future-repair-device': return { id, type, deviceId: '' };
    case 'future-resolve-incident': return { id, type, incidentId: '' };
    case 'future-defeat-boss': return { id, type, bossId: '' };
    case 'debug-complete': return { id, type };
    case 'always':
    default: return { id, type: 'always' };
  }
}

const ConditionRow = ({ c, onChange, onRemove }: { c: ZoneConditionDefinition; onChange: (next: ZoneConditionDefinition) => void; onRemove: () => void }) => {
  const isFuture = FUTURE_CONDITION_TYPES.includes(c.type);
  return (
    <div className="rounded border border-slate-800 p-1.5">
      <div className="flex items-center gap-1">
        <select value={c.type} onChange={(e) => onChange(defaultCondition(e.target.value as ZoneConditionType, c.id))} className={inp + ' flex-1'}>
          {ZONE_CONDITION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={onRemove} className="rounded bg-rose-700/20 px-1.5 text-[11px] text-rose-300 hover:bg-rose-700/30">🗑</button>
      </div>
      {c.type === 'reach-marker' && (
        <div className="mt-1 flex gap-1">
          <input value={c.markerId} placeholder="markerId" onChange={(e) => onChange({ ...c, markerId: e.target.value })} className={inp + ' flex-1'} />
          <input type="number" step={0.5} value={c.radius} onChange={(e) => onChange({ ...c, radius: num(e.target.value) })} className={inp + ' w-16'} />
        </div>
      )}
      {c.type === 'interact-with-object' && <input value={c.objectId} placeholder="objectId (marker id)" onChange={(e) => onChange({ ...c, objectId: e.target.value })} className={inp + ' mt-1'} />}
      {c.type === 'complete-existing-objective' && <input value={c.objectiveId} placeholder="objectiveId (e.g. obj_fix_beacon)" onChange={(e) => onChange({ ...c, objectiveId: e.target.value })} className={inp + ' mt-1'} />}
      {c.type === 'wait-seconds' && <input type="number" step={1} value={c.seconds} onChange={(e) => onChange({ ...c, seconds: num(e.target.value) })} className={inp + ' mt-1'} />}
      {c.type === 'placeholder-clear-area' && <input value={c.areaId} placeholder="areaId (marker id)" onChange={(e) => onChange({ ...c, areaId: e.target.value })} className={inp + ' mt-1'} />}
      {c.type === 'segment-completed' && <input value={c.segmentId} placeholder="segmentId" onChange={(e) => onChange({ ...c, segmentId: e.target.value })} className={inp + ' mt-1'} />}
      {isFuture && <div className="mt-1 text-[10px] text-amber-400">⚠ Placeholder — only completes in god mode this batch.</div>}
    </div>
  );
};

const MarkerRow = ({ m, onChange, onRemove }: { m: ZoneMarkerDefinition; onChange: (next: ZoneMarkerDefinition) => void; onRemove: () => void }) => (
  <div className="rounded border border-slate-800 p-1.5">
    <div className="flex items-center gap-1">
      <input value={m.id} placeholder="marker id" onChange={(e) => onChange({ ...m, id: e.target.value })} className={inp + ' w-28'} />
      <select value={m.type} onChange={(e) => onChange({ ...m, type: e.target.value as ZoneMarkerDefinition['type'] })} className={inp + ' flex-1'}>
        {ZONE_MARKER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <FocusButton position={m.position} />
      <button onClick={onRemove} className="rounded bg-rose-700/20 px-1.5 text-[11px] text-rose-300 hover:bg-rose-700/30">🗑</button>
    </div>
    <div className="mt-1 flex gap-1">
      {([0, 1, 2] as const).map((a) => (
        <input key={a} type="number" step={0.5} value={m.position[a]} onChange={(e) => { const p = [...m.position] as [number, number, number]; p[a] = num(e.target.value); onChange({ ...m, position: p }); }} className={inp + ' w-0 flex-1 text-center'} />
      ))}
      <input type="number" step={0.5} value={m.radius ?? 3} title="radius" onChange={(e) => onChange({ ...m, radius: num(e.target.value) })} className={inp + ' w-14'} />
    </div>
  </div>
);

export const MissionZoneEditorTab = () => {
  const zones = useEditorMissionZoneStore((s) => s.items);
  const upsertZone = useEditorMissionZoneStore((s) => s.upsert);
  const updateZone = useEditorMissionZoneStore((s) => s.update);
  const duplicateZone = useEditorMissionZoneStore((s) => s.duplicate);
  const removeZone = useEditorMissionZoneStore((s) => s.remove);

  const segments = useEditorZoneSegmentStore((s) => s.items);
  const upsertSeg = useEditorZoneSegmentStore((s) => s.upsert);
  const updateSeg = useEditorZoneSegmentStore((s) => s.update);
  const duplicateSeg = useEditorZoneSegmentStore((s) => s.duplicate);
  const removeSeg = useEditorZoneSegmentStore((s) => s.remove);

  const [selZoneId, setSelZoneId] = useState<string | null>(zones[0]?.id ?? null);
  const [selSegId, setSelSegId] = useState<string | null>(null);

  const zone = zones.find((z) => z.id === selZoneId) ?? null;
  const zoneSegments = useMemo(
    () => segments.filter((s) => s.zoneId === selZoneId).sort((a, b) => a.order - b.order),
    [segments, selZoneId],
  );
  const seg = zoneSegments.find((s) => s.id === selSegId) ?? null;
  const validation = useMemo(() => (zone ? validateMissionZone(zone, segments) : null), [zone, segments]);

  const addSegment = () => {
    if (!zone) return;
    const s = makeSegment(zone.id, zoneSegments.length + 1);
    upsertSeg(s);
    updateZone(zone.id, { segmentIds: [...zone.segmentIds, s.id], startSegmentId: zone.startSegmentId || s.id });
    setSelSegId(s.id);
  };
  const deleteSegment = (id: string) => {
    if (!zone) return;
    removeSeg(id);
    updateZone(zone.id, { segmentIds: zone.segmentIds.filter((x) => x !== id), finalSegmentIds: zone.finalSegmentIds.filter((x) => x !== id) });
    if (selSegId === id) setSelSegId(null);
  };

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <div className={lbl}>Mission Zones · {zones.length}</div>
        <button onClick={() => { const z = makeZone(); upsertZone(z); setSelZoneId(z.id); setSelSegId(null); }} className="rounded bg-emerald-700/30 px-2 py-1 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ Add Zone</button>
      </div>

      <div className="flex flex-wrap gap-1">
        {zones.map((z) => (
          <button key={z.id} onClick={() => { setSelZoneId(z.id); setSelSegId(null); }} className={`rounded px-2 py-1 text-[11px] ${z.id === selZoneId ? 'bg-sky-600/30 text-sky-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
            {z.name}
          </button>
        ))}
      </div>

      {zone ? (
        <div className="space-y-2 rounded-lg border border-slate-800 p-2">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Name"><input value={zone.name} onChange={(e) => updateZone(zone.id, { name: e.target.value })} className={inp} /></Field>
            <Field label="Location id"><input value={zone.locationId} onChange={(e) => updateZone(zone.id, { locationId: e.target.value })} className={inp} placeholder="loc_sunnyharbor" /></Field>
            <Field label="Mode">
              <select value={zone.zoneMode} onChange={(e) => updateZone(zone.id, { zoneMode: e.target.value as MissionZoneDefinition['zoneMode'] })} className={inp}>
                {(['linear', 'semi-linear', 'hub-branch'] as const).map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Start segment id">
              <select value={zone.startSegmentId} onChange={(e) => updateZone(zone.id, { startSegmentId: e.target.value })} className={inp}>
                <option value="">—</option>
                {zoneSegments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Final segment ids (csv)"><input value={csv(zone.finalSegmentIds)} onChange={(e) => updateZone(zone.id, { finalSegmentIds: parseCsv(e.target.value) })} className={inp} /></Field>
            <Field label="Recommended role tags (csv)"><input value={csv(zone.recommendedRoleTags)} onChange={(e) => updateZone(zone.id, { recommendedRoleTags: parseCsv(e.target.value) })} className={inp} /></Field>
          </div>
          <div className="flex items-center gap-3">
            <Check label="Enabled (auto-routes from landing)" checked={zone.enabled} onChange={(v) => updateZone(zone.id, { enabled: v })} />
            <Check label="Allow backtracking" checked={zone.allowBacktracking} onChange={(v) => updateZone(zone.id, { allowBacktracking: v })} />
          </div>

          <div className="flex items-center gap-1.5 border-t border-slate-800/60 pt-2">
            <button onClick={() => { const id = duplicateZone(zone.id); if (id) setSelZoneId(id); }} className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700">⧉ Duplicate</button>
            <button onClick={() => { removeZone(zone.id); setSelZoneId(null); }} className="rounded bg-rose-700/20 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-700/30">🗑 Delete</button>
            <span className="ml-auto self-center text-[10px] text-slate-500">id: {zone.id}</span>
          </div>

          {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
            <div className="rounded bg-slate-950/60 p-1.5 text-[10px]">
              {validation.errors.map((e, i) => <div key={`e${i}`} className="text-rose-400">✗ {e}</div>)}
              {validation.warnings.map((w, i) => <div key={`w${i}`} className="text-amber-400">⚠ {w}</div>)}
            </div>
          )}
          {validation?.ok && <div className="text-[10px] text-emerald-400">✓ Zone valid.</div>}

          {/* Segments */}
          <div className="flex items-center justify-between border-t border-slate-800/60 pt-2">
            <div className={lbl}>Segments · {zoneSegments.length}</div>
            <button onClick={addSegment} className="rounded bg-emerald-700/30 px-2 py-1 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ Add Segment</button>
          </div>
          <div className="flex flex-wrap gap-1">
            {zoneSegments.map((s) => (
              <button key={s.id} onClick={() => setSelSegId(s.id)} className={`rounded px-2 py-1 text-[11px] ${s.id === selSegId ? 'bg-violet-600/30 text-violet-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                {s.order}. {s.name}
              </button>
            ))}
          </div>

          {seg && (
            <div className="space-y-2 rounded-lg border border-slate-800 p-2">
              <div className="grid grid-cols-2 gap-2">
                <Field label="Name"><input value={seg.name} onChange={(e) => updateSeg(seg.id, { name: e.target.value })} className={inp} /></Field>
                <Field label="Order"><input type="number" step={1} value={seg.order} onChange={(e) => updateSeg(seg.id, { order: num(e.target.value) })} className={inp} /></Field>
                <Field label="Type">
                  <select value={seg.segmentType} onChange={(e) => updateSeg(seg.id, { segmentType: e.target.value as ZoneSegmentDefinition['segmentType'] })} className={inp}>
                    {ZONE_SEGMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Next segment ids (csv)"><input value={csv(seg.nextSegmentIds)} onChange={(e) => updateSeg(seg.id, { nextSegmentIds: parseCsv(e.target.value) })} className={inp} /></Field>
              </div>
              <div className="flex items-center gap-3">
                <Check label="Final" checked={seg.final ?? false} onChange={(v) => updateSeg(seg.id, { final: v })} />
                <Check label="Lock player until complete" checked={seg.lockPlayerUntilComplete ?? false} onChange={(v) => updateSeg(seg.id, { lockPlayerUntilComplete: v })} />
                <Check label="Enabled" checked={seg.enabled} onChange={(v) => updateSeg(seg.id, { enabled: v })} />
              </div>

              <div className="flex items-center justify-between">
                <div className={lbl}>Markers · {seg.markers.length}</div>
                <button onClick={() => updateSeg(seg.id, { markers: [...seg.markers, { id: `m_${nanoid(4)}`, type: 'objective', position: [0, 0, 0], radius: 3 }] })} className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-200 hover:bg-slate-700">➕ Marker</button>
              </div>
              <div className="space-y-1">
                {seg.markers.map((m, i) => (
                  <MarkerRow key={i} m={m} onChange={(next) => { const arr = [...seg.markers]; arr[i] = next; updateSeg(seg.id, { markers: arr }); }} onRemove={() => updateSeg(seg.id, { markers: seg.markers.filter((_, j) => j !== i) })} />
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className={lbl}>Completion conditions · {seg.completionConditions.length}</div>
                <button onClick={() => updateSeg(seg.id, { completionConditions: [...seg.completionConditions, defaultCondition('reach-marker', `c_${nanoid(4)}`)] })} className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-200 hover:bg-slate-700">➕ Condition</button>
              </div>
              <div className="space-y-1">
                {seg.completionConditions.map((c, i) => (
                  <ConditionRow key={c.id} c={c} onChange={(next) => { const arr = [...seg.completionConditions]; arr[i] = next; updateSeg(seg.id, { completionConditions: arr }); }} onRemove={() => updateSeg(seg.id, { completionConditions: seg.completionConditions.filter((_, j) => j !== i) })} />
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className={lbl}>Entry conditions · {seg.entryConditions.length}</div>
                <button onClick={() => updateSeg(seg.id, { entryConditions: [...seg.entryConditions, defaultCondition('segment-completed', `c_${nanoid(4)}`)] })} className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-200 hover:bg-slate-700">➕ Condition</button>
              </div>
              <div className="space-y-1">
                {seg.entryConditions.map((c, i) => (
                  <ConditionRow key={c.id} c={c} onChange={(next) => { const arr = [...seg.entryConditions]; arr[i] = next; updateSeg(seg.id, { entryConditions: arr }); }} onRemove={() => updateSeg(seg.id, { entryConditions: seg.entryConditions.filter((_, j) => j !== i) })} />
                ))}
              </div>

              <div className="flex items-center gap-1.5 border-t border-slate-800/60 pt-2">
                <button onClick={() => { const id = duplicateSeg(seg.id); if (id) { updateZone(zone.id, { segmentIds: [...zone.segmentIds, id] }); setSelSegId(id); } }} className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700">⧉ Duplicate</button>
                <button onClick={() => deleteSegment(seg.id)} className="rounded bg-rose-700/20 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-700/30">🗑 Delete</button>
                <span className="ml-auto self-center text-[10px] text-slate-500">id: {seg.id}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-slate-500">Select or add a Mission Zone.</div>
      )}
    </div>
  );
};
