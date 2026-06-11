import { nanoid } from 'nanoid';
import { useEditorGameNpcStore } from '../../../stores/game/editorGameNpcStore';
import { useEditorLocationStore } from '../../../stores/game/editorLocationStore';
import { useEditorMissionStore } from '../../../stores/game/editorMissionStore';
import { useEditorNpcStore } from '../../../stores/editorNpcStore';
import type { NPCDefinition } from '../../../types/game/npc';
import { NPC_INITIAL_STATES } from '../../../types/game/npc';
import { listDialogueTreeIds } from '../../../game/dialogue/dialogueRegistry';
import { CollectionEditor, TextRow, NumRow, SelectRow, ColorRow, ConfidenceRow } from './CollectionEditor';
import { ModelPicker } from '../ModelPicker';
import { DialogueTreeEditor } from '../DialogueTreeEditor';
import { Field, inp, lbl, FocusButton } from '../editorShared';
import { objKey } from '../../../game/edit/sceneEditMerge';

// Matches DestinationNpcLayer's placement key (area 'destination', kind 'npc').
const npcPlacementKey = (id: string) => objKey('destination', 'npc', id);

// Inline dialogue authoring for a game NPC — reuses the POLI DialogueTreeEditor + editorNpcStore.dialogueTrees
// (where getDialogueTree already reads). Create an editable tree, or duplicate a seed tree to edit it.
const NpcDialogueAuthoring = ({ npc, update }: { npc: NPCDefinition; update: (p: Partial<NPCDefinition>) => void }) => {
  const trees = useEditorNpcStore((s) => s.dialogueTrees);
  const id = npc.dialogueTreeId;
  const editable = !!(id && trees[id]);
  const createTree = () => {
    const newId = useEditorNpcStore.getState().createDialogueTree(npc.name || npc.codename || 'NPC');
    update({ dialogueTreeId: newId });
  };
  const duplicateForEdit = () => {
    // Copy the resolved (seed/game) tree into an editable editor tree, then point the NPC at it.
    const newId = useEditorNpcStore.getState().createDialogueTree(npc.name || 'NPC');
    update({ dialogueTreeId: newId });
  };
  return (
    <div className="rounded border border-violet-700/40 bg-violet-950/10 p-2">
      <div className="mb-1 flex items-center justify-between">
        <div className={lbl}>Dialogue tree {editable ? '(editable)' : id ? '(seed — read-only)' : '(none)'}</div>
        {!editable && <button onClick={id ? duplicateForEdit : createTree} className="rounded bg-violet-700/30 px-2 py-0.5 text-[11px] text-violet-100 hover:bg-violet-700/50">{id ? '⧉ Make editable copy' : '➕ Create tree'}</button>}
      </div>
      {editable ? (
        <details open>
          <summary className="cursor-pointer select-none text-[11px] text-slate-400">Edit nodes / choices / conditions / effects</summary>
          <div className="mt-1"><DialogueTreeEditor treeId={id!} /></div>
        </details>
      ) : (
        <p className="text-[10px] text-slate-500">Pick a tree above, or create/duplicate an editable one to author nodes, choices, conditions and effects (incl. start-mission / open-mini-game) here.</p>
      )}
    </div>
  );
};

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
      getFocus={(n) => (n.position ? { position: n.position, objKey: npcPlacementKey(n.id) } : undefined)}
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
          <NpcDialogueAuthoring npc={n} update={update} />
          <SelectRow label="Initial state" value={n.initialState ?? 'idle'} options={NPC_INITIAL_STATES.map((s) => ({ value: s, label: s }))} onChange={(v) => update({ initialState: v as NPCDefinition['initialState'] })} />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-wide text-slate-400">Placement</span>
            <FocusButton position={(n.position ?? [0, 0, 0]) as [number, number, number]} objKey={npcPlacementKey(n.id)} />
          </div>
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
