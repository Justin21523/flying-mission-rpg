import { nanoid } from 'nanoid';
import { useEditorGameNpcStore } from '../../../stores/game/editorGameNpcStore';
import { useEditorLocationStore } from '../../../stores/game/editorLocationStore';
import { useEditorMissionStore } from '../../../stores/game/editorMissionStore';
import type { NPCDefinition } from '../../../types/game/npc';
import { NPC_INITIAL_STATES } from '../../../types/game/npc';
import { listDialogueTreeIds } from '../../../game/dialogue/dialogueRegistry';
import { CollectionEditor, TextRow, NumRow, SelectRow, ColorRow, ConfidenceRow } from './CollectionEditor';
import { ModelPicker } from '../ModelPicker';
import { Field, inp } from '../editorShared';

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
          <SelectRow
            label="Dialogue tree"
            value={n.dialogueTreeId ?? ''}
            options={[none, ...listDialogueTreeIds().map((t) => ({ value: t.id, label: `${t.id} (${t.source})` }))]}
            onChange={(v) => update({ dialogueTreeId: v || undefined })}
          />
          <SelectRow label="Initial state" value={n.initialState ?? 'idle'} options={NPC_INITIAL_STATES.map((s) => ({ value: s, label: s }))} onChange={(v) => update({ initialState: v as NPCDefinition['initialState'] })} />
          <Field label="Destination position (x / y / z) — gizmo-draggable in 3D">
            <div className="flex gap-1">
              {([0, 1, 2] as const).map((a) => (
                <input
                  key={a}
                  type="number"
                  step={0.5}
                  value={(n.position ?? [0, 0, 0])[a]}
                  onChange={(e) => {
                    const next = [...(n.position ?? [0, 0, 0])] as [number, number, number];
                    next[a] = parseFloat(e.target.value) || 0;
                    update({ position: next });
                  }}
                  className={inp + ' w-0 flex-1 text-center'}
                />
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <NumRow label="Facing° (Y)" value={n.rotationY ?? 0} step={10} onChange={(v) => update({ rotationY: v })} />
            <NumRow label="Interact radius" value={n.interactionRadius ?? 4} step={0.5} min={1} onChange={(v) => update({ interactionRadius: v })} />
          </div>
          <ConfidenceRow value={n.sourceConfidence} onChange={(v) => update({ sourceConfidence: v })} />
        </>
      )}
    />
  );
};
