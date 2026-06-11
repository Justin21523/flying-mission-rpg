import { nanoid } from 'nanoid';
import { useEditorMissionStore } from '../../../stores/game/editorMissionStore';
import { useEditorLocationStore } from '../../../stores/game/editorLocationStore';
import { useEditorGameNpcStore } from '../../../stores/game/editorGameNpcStore';
import { useEditorRouteStore } from '../../../stores/game/editorRouteStore';
import { useEditorDestinationStore } from '../../../stores/game/editorDestinationStore';
import { MISSION_TYPES, MISSION_OBJECTIVE_KINDS } from '../../../types/game/mission';
import type { MissionDefinition, MissionObjective } from '../../../types/game/mission';
import type { DialogueCondition, DialogueEffect } from '../../../types/dialogue';
import { WEATHER_KINDS, FLIGHT_DIFFICULTIES } from '../../../types/game/flight';
import { ABILITY_KINDS } from '../../../types/game/character';
import { MINI_GAME_IDS } from '../../../data/game/miniGames';
import type { DestinationPartKind } from '../../../types/game/destination';
import { validateObjective } from '../../../game/destination/destinationValidation';
import { csv, parseCsv, Field, lbl } from '../editorShared';
import { MechListEditor } from '../dialogueEditorShared';
import { ModelPicker } from '../ModelPicker';
import { CollectionEditor, TextRow, NumRow, SelectRow, ConfidenceRow } from './CollectionEditor';

// Which destination-part kind an objective kind targets (talk → NPCs, handled separately).
const KIND_TO_PART: Partial<Record<MissionObjective['kind'], DestinationPartKind>> = {
  carry: 'carry_item', find: 'lost_item', activate: 'repair_device', reach: 'marker',
};

// Multi-select of candidate target ids (destination parts by kind, or NPCs for 'talk') — replaces free text.
const TargetMultiSelect = ({ candidates, selected, onChange }: { candidates: { id: string; label: string }[]; selected: string[]; onChange: (ids: string[]) => void }) => {
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  return (
    <div>
      <div className={lbl}>Target objects {selected.length ? `(${selected.length})` : '(none)'}</div>
      <div className="mt-1 grid max-h-28 grid-cols-2 gap-x-2 gap-y-0.5 overflow-y-auto rounded bg-slate-900/60 p-1.5">
        {candidates.map((c) => (
          <label key={c.id} className="flex items-center gap-1.5 text-[11px] text-slate-300">
            <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} />
            <span className="truncate">{c.label}</span>
          </label>
        ))}
        {candidates.length === 0 && <span className="text-slate-500">No matching objects (add them in 🏙 Destination / 🧑 NPC).</span>}
      </div>
    </div>
  );
};

// Objectives sub-editor — the data-driven destination tasks (carry / find / activate(repair) / reach / talk)
// with their destination-part bindings. Invalid bindings show inline and are skipped by the director.
const ObjectivesEditor = ({ mission, update, npcs }: { mission: MissionDefinition; update: (p: Partial<MissionDefinition>) => void; npcs: { id: string; name: string }[] }) => {
  const parts = useEditorDestinationStore((s) => s.items);
  const partIds = new Set(parts.map((p) => p.id));
  const candidatesFor = (kind: MissionObjective['kind']): { id: string; label: string }[] => {
    if (kind === 'talk') return npcs.map((n) => ({ id: n.id, label: n.name }));
    const pk = KIND_TO_PART[kind];
    return parts.filter((p) => p.kind === pk).map((p) => ({ id: p.id, label: p.label }));
  };
  const dropoffs = parts.filter((p) => p.kind === 'dropoff_zone');
  const objs = mission.objectives;
  const add = () => update({ objectives: [...objs, { id: `obj_${nanoid(5)}`, kind: 'carry', description: 'New objective', targetCount: 1, targetObjectIds: [] }] });
  const patch = (id: string, p: Partial<MissionObjective>) => update({ objectives: objs.map((o) => (o.id === id ? { ...o, ...p } : o)) });
  const remove = (id: string) => update({ objectives: objs.filter((o) => o.id !== id) });
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className={lbl}>Objectives · {objs.length}</div>
        <button onClick={add} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ Objective</button>
      </div>
      <div className="mt-1 space-y-1.5">
        {objs.map((o) => {
          const errs = validateObjective(o, partIds);
          return (
            <div key={o.id} className="rounded bg-slate-900/60 p-1.5">
              {errs.length > 0 && (
                <div className="mb-1 rounded bg-rose-900/40 p-1 text-[10px] text-rose-200">{errs.map((er, i) => <div key={i}>⚠ {er}</div>)}</div>
              )}
              <div className="grid grid-cols-2 gap-1.5">
                <SelectRow label="Kind" value={o.kind} options={MISSION_OBJECTIVE_KINDS.map((k) => ({ value: k, label: k }))} onChange={(v) => patch(o.id, { kind: v as MissionObjective['kind'] })} />
                <NumRow label="Target count" value={o.targetCount} step={1} min={1} onChange={(v) => patch(o.id, { targetCount: v })} />
              </div>
              <TextRow label="Description" value={o.description} onChange={(v) => patch(o.id, { description: v })} />
              <TargetMultiSelect candidates={candidatesFor(o.kind)} selected={o.targetObjectIds ?? []} onChange={(ids) => patch(o.id, { targetObjectIds: ids })} />
              {o.kind === 'carry' && (
                <SelectRow label="Dropoff zone" value={o.dropoffZoneId ?? ''} options={[{ value: '', label: '(none)' }, ...dropoffs.map((p) => ({ value: p.id, label: p.label }))]} onChange={(v) => patch(o.id, { dropoffZoneId: v || undefined })} />
              )}
              {o.kind === 'activate' && (
                <SelectRow label="Mini-game" value={o.miniGameId ?? ''} options={[{ value: '', label: '(none)' }, ...MINI_GAME_IDS.map((g) => ({ value: g, label: g }))]} onChange={(v) => patch(o.id, { miniGameId: v || undefined })} />
              )}
              <TextRow label="Hint" value={o.hintText ?? ''} onChange={(v) => patch(o.id, { hintText: v || undefined })} />
              <button onClick={() => remove(o.id)} className="mt-1 rounded bg-rose-700/20 px-2 py-0.5 text-[11px] text-rose-300 hover:bg-rose-700/30">🗑 Remove</button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const makeNew = (): MissionDefinition => ({
  id: `mission_${nanoid(6)}`,
  name: 'New Mission',
  sourceConfidence: 'GameAdaptation',
  type: 'delivery',
  locationId: '',
  difficulty: 'easy',
  weather: 'clear',
  recommendedCharacterIds: [],
  summary: '',
  objectives: [],
});

// 🎯 Missions — authored mission templates (delivery / find_lost / repair). Objectives editor lands later.
export const MissionEditorTab = () => {
  const locations = useEditorLocationStore((s) => s.items);
  const npcs = useEditorGameNpcStore((s) => s.items);
  const routes = useEditorRouteStore((s) => s.items);
  const none = { value: '', label: '(none)' };
  return (
    <CollectionEditor<MissionDefinition>
      title="Missions"
      store={useEditorMissionStore}
      makeNew={makeNew}
      getLabel={(m) => m.name}
      getFocus={(m) => { const loc = locations.find((l) => l.id === m.locationId); return loc ? { position: [loc.coordinate.x, loc.coordinate.y, loc.coordinate.z] as [number, number, number] } : undefined; }}
      renderFields={(m, update) => (
        <>
          <TextRow label="Name" value={m.name} onChange={(v) => update({ name: v })} />
          <SelectRow label="Type" value={m.type} options={MISSION_TYPES.map((t) => ({ value: t, label: t }))} onChange={(v) => update({ type: v as MissionDefinition['type'] })} />
          <SelectRow label="Location" value={m.locationId} options={[none, ...locations.map((l) => ({ value: l.id, label: l.name }))]} onChange={(v) => update({ locationId: v })} />
          <SelectRow label="NPC" value={m.npcId ?? ''} options={[none, ...npcs.map((n) => ({ value: n.id, label: n.name }))]} onChange={(v) => update({ npcId: v || undefined })} />
          <SelectRow label="Route" value={m.routeId ?? ''} options={[none, ...routes.map((r) => ({ value: r.id, label: r.name }))]} onChange={(v) => update({ routeId: v || undefined })} />
          <Field label="Objective/site model (empty = none)"><ModelPicker value={m.modelAssetId} onChange={(v) => update({ modelAssetId: v })} noneLabel="(none)" /></Field>
          <SelectRow label="Difficulty" value={m.difficulty} options={FLIGHT_DIFFICULTIES.map((d) => ({ value: d, label: d }))} onChange={(v) => update({ difficulty: v as MissionDefinition['difficulty'] })} />
          <SelectRow label="Weather" value={m.weather} options={WEATHER_KINDS.map((w) => ({ value: w, label: w }))} onChange={(v) => update({ weather: v as MissionDefinition['weather'] })} />
          <SelectRow label="Recommended ability" value={m.recommendedAbility ?? ''} options={[none, ...ABILITY_KINDS.map((a) => ({ value: a, label: a }))]} onChange={(v) => update({ recommendedAbility: (v || undefined) as MissionDefinition['recommendedAbility'] })} />
          <TextRow label="Recommended characters (csv of ids)" value={csv(m.recommendedCharacterIds)} onChange={(v) => update({ recommendedCharacterIds: parseCsv(v) })} />
          <TextRow label="Summary" area value={m.summary} onChange={(v) => update({ summary: v })} />
          <ConfidenceRow value={m.sourceConfidence} onChange={(v) => update({ sourceConfidence: v })} />
          <ObjectivesEditor mission={m} update={update} npcs={npcs} />
          <div className={lbl}>Prerequisites (ALL must pass to start)</div>
          <MechListEditor label="Prereqs" kind="condition" items={m.prerequisites} onChange={(items) => update({ prerequisites: items as DialogueCondition[] | undefined })} />
          <div className={lbl}>On complete (rewards / flags)</div>
          <MechListEditor label="Effects" kind="effect" items={m.completionEffects} onChange={(items) => update({ completionEffects: items as DialogueEffect[] | undefined })} />
        </>
      )}
    />
  );
};
