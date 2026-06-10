import { nanoid } from 'nanoid';
import { useEditorMissionStore } from '../../../stores/game/editorMissionStore';
import { useEditorLocationStore } from '../../../stores/game/editorLocationStore';
import { useEditorGameNpcStore } from '../../../stores/game/editorGameNpcStore';
import { useEditorRouteStore } from '../../../stores/game/editorRouteStore';
import { MISSION_TYPES } from '../../../types/game/mission';
import type { MissionDefinition } from '../../../types/game/mission';
import { WEATHER_KINDS, FLIGHT_DIFFICULTIES } from '../../../types/game/flight';
import { ABILITY_KINDS } from '../../../types/game/character';
import { csv, parseCsv } from '../editorShared';
import { CollectionEditor, TextRow, SelectRow, ConfidenceRow } from './CollectionEditor';

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
      renderFields={(m, update) => (
        <>
          <TextRow label="Name" value={m.name} onChange={(v) => update({ name: v })} />
          <SelectRow label="Type" value={m.type} options={MISSION_TYPES.map((t) => ({ value: t, label: t }))} onChange={(v) => update({ type: v as MissionDefinition['type'] })} />
          <SelectRow label="Location" value={m.locationId} options={[none, ...locations.map((l) => ({ value: l.id, label: l.name }))]} onChange={(v) => update({ locationId: v })} />
          <SelectRow label="NPC" value={m.npcId ?? ''} options={[none, ...npcs.map((n) => ({ value: n.id, label: n.name }))]} onChange={(v) => update({ npcId: v || undefined })} />
          <SelectRow label="Route" value={m.routeId ?? ''} options={[none, ...routes.map((r) => ({ value: r.id, label: r.name }))]} onChange={(v) => update({ routeId: v || undefined })} />
          <SelectRow label="Difficulty" value={m.difficulty} options={FLIGHT_DIFFICULTIES.map((d) => ({ value: d, label: d }))} onChange={(v) => update({ difficulty: v as MissionDefinition['difficulty'] })} />
          <SelectRow label="Weather" value={m.weather} options={WEATHER_KINDS.map((w) => ({ value: w, label: w }))} onChange={(v) => update({ weather: v as MissionDefinition['weather'] })} />
          <SelectRow label="Recommended ability" value={m.recommendedAbility ?? ''} options={[none, ...ABILITY_KINDS.map((a) => ({ value: a, label: a }))]} onChange={(v) => update({ recommendedAbility: (v || undefined) as MissionDefinition['recommendedAbility'] })} />
          <TextRow label="Recommended characters (csv of ids)" value={csv(m.recommendedCharacterIds)} onChange={(v) => update({ recommendedCharacterIds: parseCsv(v) })} />
          <TextRow label="Summary" area value={m.summary} onChange={(v) => update({ summary: v })} />
          <ConfidenceRow value={m.sourceConfidence} onChange={(v) => update({ sourceConfidence: v })} />
          <p className="text-[10px] text-slate-500">Objectives: {m.objectives.length} (deep editor in a later batch).</p>
        </>
      )}
    />
  );
};
