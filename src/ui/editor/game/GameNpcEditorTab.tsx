import { nanoid } from 'nanoid';
import { useEditorGameNpcStore } from '../../../stores/game/editorGameNpcStore';
import { useEditorLocationStore } from '../../../stores/game/editorLocationStore';
import { useEditorMissionStore } from '../../../stores/game/editorMissionStore';
import { useEditorNpcStore } from '../../../stores/editorNpcStore';
import type { NPCDefinition } from '../../../types/game/npc';
import { NPC_INITIAL_STATES, NPC_MOVEMENT_MODES } from '../../../types/game/npc';
import { NPC_TYPES, NPC_TYPE_LABEL } from '../../../types/editorNPC';
import type { DialogueCondition } from '../../../types/dialogue';
import type { TimeOfDay } from '../../../types/randomEvent';
import { npcDefaults, npcDialogueTreeIds } from '../../../game/npc/npcDialogueSelect';
import { listDialogueTreeIds } from '../../../game/dialogue/dialogueRegistry';
import { CollectionEditor, TextRow, NumRow, SelectRow, ColorRow, ConfidenceRow } from './CollectionEditor';
import { ModelPicker } from '../ModelPicker';
import { DialogueTreeEditor } from '../DialogueTreeEditor';
import { MechListEditor } from '../dialogueEditorShared';
import { AnimationRulesEditor } from './AnimationRulesEditor';
import { MultiCheck } from './MultiCheck';
import { Field, inp, lbl, csv, parseCsv, FocusButton, MoveButtons } from '../editorShared';
import { objKey } from '../../../game/edit/sceneEditMerge';

const npcPlacementKey = (id: string) => objKey('destination', 'npc', id);
const TIMES: TimeOfDay[] = ['dawn', 'day', 'evening', 'night'];
const vec0 = (): [number, number, number] => [0, 0, 0];

// XYZ row with a Focus button (camera jump).
const Vec3Row = ({ label, value, onChange, focusKey }: { label: string; value: [number, number, number]; onChange: (v: [number, number, number]) => void; focusKey?: string }) => (
  <Field label={label}>
    <div className="flex items-center gap-1">
      {([0, 1, 2] as const).map((a) => (
        <input key={a} type="number" step={0.5} value={value[a]} onChange={(e) => { const n = [...value] as [number, number, number]; n[a] = parseFloat(e.target.value) || 0; onChange(n); }} className={inp + ' w-0 flex-1 text-center'} />
      ))}
      <FocusButton position={value} objKey={focusKey} />
    </div>
  </Field>
);

// ── multiple condition-gated dialogue trees (mirrors the POLI NPC) ──
const DialogueTreesEditor = ({ npc, update }: { npc: NPCDefinition; update: (p: Partial<NPCDefinition>) => void }) => {
  const trees = useEditorNpcStore((s) => s.dialogueTrees);
  const ids = npcDialogueTreeIds(npc);
  const setIds = (next: string[]) => update({ dialogueTreeIds: next, dialogueTreeId: next[0] });
  const addTree = () => { const id = useEditorNpcStore.getState().createDialogueTree(npc.name || npc.codename || 'NPC'); setIds([...ids, id]); };
  const detach = (id: string) => { setIds(ids.filter((t) => t !== id)); if (trees[id]) useEditorNpcStore.getState().removeDialogueTree(id); };
  const allTrees = listDialogueTreeIds();
  return (
    <div className="rounded border border-violet-700/40 bg-violet-950/10 p-2">
      <div className="mb-1 flex items-center justify-between">
        <div className={lbl}>Dialogue trees · {ids.length} (first whose condition passes plays)</div>
        <button onClick={addTree} className="rounded bg-violet-700/30 px-2 py-0.5 text-[11px] text-violet-100 hover:bg-violet-700/50">➕ Tree</button>
      </div>
      <div className="space-y-1.5">
        {ids.map((id, i) => {
          const editable = trees[id];
          return (
            <div key={id} className="rounded border border-slate-800 bg-slate-900/55 p-1.5">
              <div className="mb-1 flex items-center gap-1">
                <span className="w-5 text-center text-[11px] font-bold text-violet-200">{i + 1}</span>
                <SelectRow label="" value={id} options={allTrees.map((t) => ({ value: t.id, label: `${t.id} (${t.source})` }))} onChange={(v) => setIds(ids.map((x, j) => (j === i ? v : x)))} />
                <MoveButtons index={i} count={ids.length} onMove={(d) => { const n = [...ids]; const j = i + d; if (j >= 0 && j < n.length) { [n[i], n[j]] = [n[j], n[i]]; setIds(n); } }} />
                <button onClick={() => detach(id)} className="rounded bg-rose-700/20 px-2 py-0.5 text-[10px] text-rose-300 hover:bg-rose-700/30">✕</button>
              </div>
              {editable ? (
                <>
                  <TextRow label="Tree label" value={editable.label ?? ''} onChange={(v) => useEditorNpcStore.getState().setDialogueTree({ ...editable, label: v || undefined })} />
                  <div className={lbl}>Show this tree when (blank = always)</div>
                  <MechListEditor label="Condition" kind="condition" items={editable.condition ? [editable.condition] : []} onChange={(items) => useEditorNpcStore.getState().setDialogueTree({ ...editable, condition: (items?.[0] as DialogueCondition) ?? undefined })} />
                  <details className="mt-1">
                    <summary className="cursor-pointer select-none text-[11px] text-slate-400">Edit nodes / choices / conditions / effects</summary>
                    <div className="mt-1"><DialogueTreeEditor treeId={id} /></div>
                  </details>
                </>
              ) : (
                <p className="text-[10px] text-slate-500">Seed tree (read-only). Pick an editor tree or ➕ to author nodes/conditions.</p>
              )}
            </div>
          );
        })}
        {ids.length === 0 && <div className="text-[11px] text-slate-500">No trees — ➕ Tree to author dialogue.</div>}
      </div>
    </div>
  );
};

// ── movement (mirrors the POLI EditorNpc options the game runtime supports) ──
const MovementEditor = ({ npc, update }: { npc: NPCDefinition; update: (p: Partial<NPCDefinition>) => void }) => {
  const mode = npc.movement ?? 'static';
  const wps = npc.patrolWaypoints ?? [];
  const setWp = (i: number, v: [number, number, number]) => update({ patrolWaypoints: wps.map((w, j) => (j === i ? v : w)) });
  return (
    <div className="rounded border border-slate-800 bg-slate-900/45 p-2">
      <SelectRow label="Movement" value={mode} options={NPC_MOVEMENT_MODES.map((m) => ({ value: m, label: m }))} onChange={(v) => update({ movement: v as NPCDefinition['movement'] })} />
      {mode !== 'static' && <NumRow label="Move speed (u/s)" value={npc.moveSpeed ?? 1.6} step={0.1} min={0} onChange={(v) => update({ moveSpeed: v })} />}
      {mode === 'patrol' && (
        <div className="mt-1">
          <div className="flex items-center justify-between"><div className={lbl}>Patrol waypoints · {wps.length}</div>
            <button onClick={() => update({ patrolWaypoints: [...wps, (npc.position ?? vec0())] })} className="rounded bg-sky-700/30 px-2 py-0.5 text-[10px] text-sky-100 hover:bg-sky-700/50">+ Point</button></div>
          {wps.map((w, i) => (
            <div key={i} className="mt-1 flex items-center gap-1">
              <Vec3Row label={`#${i + 1}`} value={w} onChange={(v) => setWp(i, v)} />
              <button onClick={() => update({ patrolWaypoints: wps.filter((_, j) => j !== i) })} className="rounded bg-rose-700/20 px-1.5 py-0.5 text-[10px] text-rose-300">🗑</button>
            </div>
          ))}
        </div>
      )}
      {mode === 'wander' && <NumRow label="Wander radius" value={npc.wanderRadius ?? 8} step={1} min={1} onChange={(v) => update({ wanderRadius: v })} />}
      {mode === 'schedule' && (
        <div className="mt-1 space-y-1">
          <div className={lbl}>Per time-of-day target</div>
          {TIMES.map((t) => (
            <Vec3Row key={t} label={t} value={npc.schedulePositions?.[t] ?? (npc.position ?? vec0())} onChange={(v) => update({ schedulePositions: { ...(npc.schedulePositions ?? {}), [t]: v } })} />
          ))}
        </div>
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
  npcType: 'child',
  movement: 'static',
});

// 🧑 NPC — residents who give a mission its reason + basic interaction. Options mirror the POLI NPC editor:
// archetype + tags, multiple condition-gated dialogue trees, mission links, movement, and animation rules.
export const GameNpcEditorTab = () => {
  const locations = useEditorLocationStore((s) => s.items);
  const missions = useEditorMissionStore((s) => s.items);
  const none = { value: '', label: '(none)' };
  const missionOpts = missions.map((m) => ({ id: m.id, label: m.name }));
  return (
    <CollectionEditor<NPCDefinition>
      title="NPCs"
      store={useEditorGameNpcStore}
      makeNew={makeNew}
      getLabel={(n) => n.name}
      getFocus={(n) => (n.position ? { position: n.position, objKey: npcPlacementKey(n.id) } : undefined)}
      renderFields={(n, update) => {
        const def = npcDefaults(n.npcType);
        return (
        <>
          <TextRow label="Codename" value={n.codename} onChange={(v) => update({ codename: v })} />
          <TextRow label="Name" value={n.name} onChange={(v) => update({ name: v })} />
          <SelectRow label="Archetype" value={n.npcType ?? ''} options={[none, ...NPC_TYPES.map((t) => ({ value: t, label: NPC_TYPE_LABEL[t] }))]} onChange={(v) => update({ npcType: (v || undefined) as NPCDefinition['npcType'] })} />
          <TextRow label={`Role${n.role ? '' : def.role ? ` (default: ${def.role})` : ''}`} value={n.role} onChange={(v) => update({ role: v })} />
          <TextRow label="Tags (csv)" value={csv(n.tags ?? [])} onChange={(v) => update({ tags: parseCsv(v) })} />
          <TextRow label="Description" area value={n.description} onChange={(v) => update({ description: v })} />
          <ColorRow label="Colour" value={n.color} onChange={(v) => update({ color: v })} />
          <Field label="Model (empty = placeholder mesh)"><ModelPicker value={n.modelAssetId} onChange={(v) => update({ modelAssetId: v })} noneLabel="(placeholder)" /></Field>
          <TextRow label="Interaction label" value={n.interactionLabel ?? ''} onChange={(v) => update({ interactionLabel: v || undefined })} />
          <SelectRow label="Location" value={n.locationId} options={[none, ...locations.map((l) => ({ value: l.id, label: l.name }))]} onChange={(v) => update({ locationId: v })} />

          <div className={lbl}>Mission links</div>
          <SelectRow label="Primary mission" value={n.missionId ?? ''} options={[none, ...missionOpts.map((m) => ({ value: m.id, label: m.label }))]} onChange={(v) => update({ missionId: v || undefined })} />
          <MultiCheck label="Starts missions" options={missionOpts} selected={n.startsMissionIds ?? []} onChange={(ids) => update({ startsMissionIds: ids })} />
          <MultiCheck label="Completes (turn-in) missions" options={missionOpts} selected={n.completesMissionIds ?? []} onChange={(ids) => update({ completesMissionIds: ids })} />

          <DialogueTreesEditor npc={n} update={update} />

          <SelectRow label="Initial state" value={n.initialState ?? 'idle'} options={NPC_INITIAL_STATES.map((s) => ({ value: s, label: s }))} onChange={(v) => update({ initialState: v as NPCDefinition['initialState'] })} />

          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-wide text-slate-400">Placement</span>
            <FocusButton position={(n.position ?? vec0())} objKey={npcPlacementKey(n.id)} />
          </div>
          <Vec3Row label="Destination position (x / y / z) — gizmo-draggable" value={n.position ?? vec0()} onChange={(v) => update({ position: v })} focusKey={npcPlacementKey(n.id)} />
          <div className="grid grid-cols-2 gap-2">
            <NumRow label="Facing° (Y)" value={n.rotationY ?? 0} step={10} onChange={(v) => update({ rotationY: v })} />
            <NumRow label="Interact radius" value={n.interactionRadius ?? 4} step={0.5} min={1} onChange={(v) => update({ interactionRadius: v })} />
          </div>

          <MovementEditor npc={n} update={update} />
          <AnimationRulesEditor rules={n.animations ?? []} modelAssetId={n.modelAssetId} onChange={(r) => update({ animations: r })} />

          {/* Batch E — Hub resident: rescued NPCs who live in the Hangar + offer a side-quest. */}
          <div className="rounded border border-emerald-700/40 bg-emerald-950/10 p-2">
            <Field label="Hub resident (lives in the Hangar once rescued)"><input type="checkbox" checked={!!n.hubResident} onChange={(e) => update({ hubResident: e.target.checked })} /></Field>
            {n.hubResident && (
              <>
                <TextRow label="Rescued by stage id" value={n.rescuedByStageId ?? ''} onChange={(v) => update({ rescuedByStageId: v || undefined })} />
                <Vec3Row label="Hub position (x / y / z)" value={n.hubPosition ?? vec0()} onChange={(v) => update({ hubPosition: v })} />
                <TextRow label="Hub side-quest id" value={n.hubSideQuestId ?? ''} onChange={(v) => update({ hubSideQuestId: v || undefined })} />
              </>
            )}
          </div>

          <ConfidenceRow value={n.sourceConfidence} onChange={(v) => update({ sourceConfidence: v })} />
        </>
        );
      }}
    />
  );
};
