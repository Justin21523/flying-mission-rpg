import { nanoid } from 'nanoid';
import { useEditorGameNpcStore } from '../../../stores/game/editorGameNpcStore';
import { useEditorLocationStore } from '../../../stores/game/editorLocationStore';
import { useEditorMissionStore } from '../../../stores/game/editorMissionStore';
import type { NPCDefinition } from '../../../types/game/npc';
import { CollectionEditor, TextRow, SelectRow, ColorRow, ConfidenceRow } from './CollectionEditor';
import { ModelPicker } from '../ModelPicker';
import { Field } from '../editorShared';

const makeNew = (): NPCDefinition => ({
  id: `npc_${nanoid(6)}`,
  codename: 'New Resident',
  name: 'New NPC',
  sourceConfidence: 'GameAdaptation',
  locationId: '',
  role: '',
  description: '',
  color: '#f472b6',
});

// 🧑 NPC — residents who give a mission its reason + basic interaction (separate from the dormant POLI NPCs).
export const GameNpcEditorTab = () => {
  const locations = useEditorLocationStore((s) => s.items);
  const missions = useEditorMissionStore((s) => s.items);
  const none = { value: '', label: '(none)' };
  return (
    <CollectionEditor<NPCDefinition>
      title="NPCs"
      store={useEditorGameNpcStore}
      makeNew={makeNew}
      getLabel={(n) => n.name}
      renderFields={(n, update) => (
        <>
          <TextRow label="Codename" value={n.codename} onChange={(v) => update({ codename: v })} />
          <TextRow label="Name" value={n.name} onChange={(v) => update({ name: v })} />
          <TextRow label="Role" value={n.role} onChange={(v) => update({ role: v })} />
          <TextRow label="Description" area value={n.description} onChange={(v) => update({ description: v })} />
          <ColorRow label="Colour" value={n.color} onChange={(v) => update({ color: v })} />
          <Field label="Model (empty = placeholder mesh)"><ModelPicker value={n.modelAssetId} onChange={(v) => update({ modelAssetId: v })} noneLabel="(placeholder)" /></Field>
          <SelectRow label="Location" value={n.locationId} options={[none, ...locations.map((l) => ({ value: l.id, label: l.name }))]} onChange={(v) => update({ locationId: v })} />
          <SelectRow label="Mission" value={n.missionId ?? ''} options={[none, ...missions.map((m) => ({ value: m.id, label: m.name }))]} onChange={(v) => update({ missionId: v || undefined })} />
          <ConfidenceRow value={n.sourceConfidence} onChange={(v) => update({ sourceConfidence: v })} />
        </>
      )}
    />
  );
};
