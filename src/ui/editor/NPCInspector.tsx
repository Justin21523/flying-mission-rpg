import { useMemo, useState } from 'react';
import type { EditorNpc, NpcType, NpcMovement } from '../../types/editorNPC';
import { NPC_TYPES, NPC_TYPE_LABEL, NPC_TYPE_COLOR, NPC_MOVEMENT } from '../../types/editorNPC';
import type { TimeOfDay } from '../../types/randomEvent';
import { useEditorNpcStore } from '../../stores/editorNpcStore';
import { useDialogueStore } from '../../stores/dialogueStore';
import { useUiStore } from '../../stores/uiStore';
import { listDialogueTreeIds, getDialogueTree } from '../../game/dialogue/dialogueRegistry';
import { editorSpawn } from '../../stores/sceneEditStore';
import { validateNpcLive } from '../../game/editor/validateNpc';
import { Field, inp, lbl, csv, parseCsv, useQuestOptions } from './editorShared';
import { IdMultiPicker } from './idPickers';
import { ModelPicker } from './ModelPicker';
import { AnimationPicker } from './AnimationPicker';
import { DialogueTreeEditor } from './DialogueTreeEditor';
import { DialoguePreviewPanel } from './DialoguePreviewPanel';

const Vec3Row = ({ label, value, step, onChange }: { label: string; value: [number, number, number]; step?: number; onChange: (v: [number, number, number]) => void }) => (
  <div>
    <div className={`mb-0.5 ${lbl}`}>{label}</div>
    <div className="flex gap-1">
      {([0, 1, 2] as const).map((i) => (
        <input key={i} type="number" step={step ?? 0.5} value={value[i]} onChange={(e) => { const v = [...value] as [number, number, number]; v[i] = parseFloat(e.target.value) || 0; onChange(v); }} className={inp} />
      ))}
    </div>
  </div>
);

const MOVE_LABEL: Record<NpcMovement, string> = { static: 'Static', patrol: 'Patrol loop', schedule: 'Time-of-day' };
const TIME_SLOTS: TimeOfDay[] = ['dawn', 'day', 'evening', 'night'];

// Movement authoring: static / patrol loop (closed waypoints) / per-time-of-day positions. "at cam"
// uses the Edit-Mode camera focus (editorSpawn) so you can place points where you're looking.
const MovementSection = ({ npc, set }: { npc: EditorNpc; set: (p: Partial<EditorNpc>) => void }) => {
  const mode = npc.movement ?? 'static';
  const wps = npc.patrolWaypoints ?? [];
  const camPos = (): [number, number, number] => [Math.round(editorSpawn.x * 100) / 100, 0, Math.round(editorSpawn.z * 100) / 100];
  return (
    <div className="space-y-2 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
      <div className={lbl}>Movement</div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="mode">
          <select value={mode} onChange={(e) => set({ movement: e.target.value as NpcMovement })} className={inp}>
            {NPC_MOVEMENT.map((m) => <option key={m} value={m}>{MOVE_LABEL[m]}</option>)}
          </select>
        </Field>
        <Field label="moveSpeed">
          <input type="number" step={0.1} min={0.1} value={npc.moveSpeed ?? 1.6} onChange={(e) => set({ moveSpeed: parseFloat(e.target.value) || 0.1 })} className={inp} />
        </Field>
      </div>

      {mode === 'patrol' && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className={lbl}>Waypoints (closed loop)</span>
            <button onClick={() => set({ patrolWaypoints: [...wps, camPos()] })} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ add at cam</button>
          </div>
          {wps.length === 0 && <div className="text-[11px] text-slate-500">No waypoints — add 2+ for a loop.</div>}
          {wps.map((wp, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="w-5 text-[10px] text-slate-400">{i + 1}</span>
              {([0, 1, 2] as const).map((a) => (
                <input key={a} type="number" step={0.5} value={wp[a]} className={inp + ' w-0 flex-1'} onChange={(e) => {
                  const next = wps.map((p) => [...p] as [number, number, number]);
                  next[i][a] = parseFloat(e.target.value) || 0;
                  set({ patrolWaypoints: next });
                }} />
              ))}
              <button onClick={() => set({ patrolWaypoints: wps.filter((_, j) => j !== i) })} className="rounded px-1 text-[11px] text-rose-400 hover:bg-slate-800">✕</button>
            </div>
          ))}
        </div>
      )}

      {mode === 'schedule' && (
        <div className="space-y-1">
          <span className={lbl}>Position per time-of-day</span>
          {TIME_SLOTS.map((slot) => {
            const p = npc.schedulePositions?.[slot];
            return (
              <div key={slot} className="flex items-center gap-1">
                <span className="w-14 text-[10px] capitalize text-slate-400">{slot}</span>
                {([0, 1, 2] as const).map((a) => (
                  <input key={a} type="number" step={0.5} value={p?.[a] ?? 0} className={inp + ' w-0 flex-1'} onChange={(e) => {
                    const cur = (p ?? [0, 0, 0]) as [number, number, number];
                    const next = [...cur] as [number, number, number];
                    next[a] = parseFloat(e.target.value) || 0;
                    set({ schedulePositions: { ...npc.schedulePositions, [slot]: next } });
                  }} />
                ))}
                <button onClick={() => set({ schedulePositions: { ...npc.schedulePositions, [slot]: camPos() } })} className="rounded px-1 text-[10px] text-sky-300 hover:bg-slate-800" title="Set to camera focus">cam</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Kit — full inspector for one Editor NPC: identity + archetype + transform + model + dialogue binding +
// quest bindings (offer / turn-in) + validation + an in-game preview. (No yokai bindings.)
export const NPCInspector = ({ npc }: { npc: EditorNpc }) => {
  const updateNpc = useEditorNpcStore((s) => s.updateNpc);
  const removeNpc = useEditorNpcStore((s) => s.removeNpc);
  const createDialogueTree = useEditorNpcStore((s) => s.createDialogueTree);
  const dialogueTrees = useEditorNpcStore((s) => s.dialogueTrees);
  const closeHub = useUiStore((s) => s.toggleEditorHub);
  const startDialogue = useDialogueStore((s) => s.startDialogue);
  const [tab, setTab] = useState<'fields' | 'dialogue' | 'preview'>('fields');

  const set = (patch: Partial<EditorNpc>) => updateNpc(npc.id, patch);
  const valid = validateNpcLive(npc);
  const questOptions = useQuestOptions();
  const treeIsEditor = !!(npc.dialogueTreeId && dialogueTrees[npc.dialogueTreeId]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const treeIds = useMemo(() => listDialogueTreeIds(), [dialogueTrees]);

  const previewInteraction = () => {
    closeHub();
    if (npc.dialogueTreeId) startDialogue(npc.dialogueTreeId);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: npc.color }} />
        <h3 className="flex-1 truncate text-base font-bold text-amber-100">{npc.displayName}</h3>
        <button onClick={() => removeNpc(npc.id)} className="rounded border border-red-700/50 bg-red-700/15 px-2 py-1 text-xs text-red-200 hover:bg-red-700/25">🗑 Remove</button>
      </div>

      {(!valid.ok || valid.warnings.length > 0) && (
        <div className={`rounded border px-2 py-1 text-[11px] ${valid.ok ? 'border-amber-700/50 bg-amber-900/20 text-amber-200' : 'border-red-700/50 bg-red-900/30 text-red-200'}`}>
          {[...valid.errors.map((e) => `⛔ ${e}`), ...valid.warnings.map((w) => `⚠ ${w}`)].join(' · ')}
        </div>
      )}

      <div className="flex gap-1.5">
        {(['fields', 'dialogue', 'preview'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded px-2.5 py-1 text-xs font-semibold ${tab === t ? 'bg-violet-600/30 text-violet-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
            {t === 'fields' ? 'Fields' : t === 'dialogue' ? 'Dialogue Tree' : 'Preview'}
          </button>
        ))}
        <button onClick={previewInteraction} className="ml-auto rounded border border-sky-600/50 bg-sky-600/20 px-2 py-1 text-xs text-sky-100 hover:bg-sky-600/30">▶ Preview interaction</button>
      </div>

      {tab === 'fields' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Field label="code"><input value={npc.code ?? ''} onChange={(e) => set({ code: e.target.value })} className={inp} /></Field>
            <Field label="displayName"><input value={npc.displayName} onChange={(e) => set({ displayName: e.target.value })} className={inp} /></Field>
            <Field label="npcType">
              <select value={npc.npcType ?? 'student'} onChange={(e) => { const t = e.target.value as NpcType; set({ npcType: t, color: NPC_TYPE_COLOR[t] }); }} className={inp}>
                {NPC_TYPES.map((t) => <option key={t} value={t}>{NPC_TYPE_LABEL[t]}</option>)}
              </select>
            </Field>
            <Field label="role (blank = type default)"><input value={npc.role} onChange={(e) => set({ role: e.target.value })} className={inp} /></Field>
            <Field label="zoneId (area)"><input value={npc.areaId} disabled className={`${inp} opacity-60`} /></Field>
            <Field label="interactionLabel"><input value={npc.interactionLabel} onChange={(e) => set({ interactionLabel: e.target.value })} className={inp} /></Field>
            <Field label="color"><input type="color" value={npc.color} onChange={(e) => set({ color: e.target.value })} className="h-7 w-full rounded bg-slate-800" /></Field>
            <Field label="model (3D character — empty = stub)"><ModelPicker value={npc.modelAssetId ?? undefined} onChange={(v) => set({ modelAssetId: v ?? null })} noneLabel="(capsule stub)" /></Field>
            <Field label="animation"><AnimationPicker modelAssetId={npc.modelAssetId ?? undefined} value={npc.animation} onChange={(v) => set({ animation: v })} /></Field>
            <Field label="description"><input value={npc.description ?? ''} onChange={(e) => set({ description: e.target.value })} className={`col-span-2 ${inp}`} /></Field>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="mb-0.5 flex items-center gap-1">
                <span className={lbl}>position</span>
                <button onClick={() => set({ position: [editorSpawn.x, editorSpawn.y, editorSpawn.z] })} title="Move to camera focus" className="rounded px-1 text-[10px] text-slate-400 hover:bg-slate-800">📍</button>
              </div>
              <div className="flex gap-1">
                {([0, 1, 2] as const).map((i) => (
                  <input key={i} type="number" step={0.5} value={npc.position[i]} onChange={(e) => { const p = [...npc.position] as [number, number, number]; p[i] = parseFloat(e.target.value) || 0; set({ position: p }); }} className={inp} />
                ))}
              </div>
            </div>
            <Vec3Row label="rotation (rad)" value={npc.rotation ?? [0, 0, 0]} step={0.1} onChange={(v) => set({ rotation: v })} />
            <Field label="scale"><input type="number" step={0.1} min={0.1} value={npc.scale ?? 1} onChange={(e) => set({ scale: parseFloat(e.target.value) || 0.1 })} className={inp} /></Field>
          </div>

          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Quest bindings</div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="startsQuestIds"><IdMultiPicker ids={npc.startsQuestIds ?? []} onChange={(v) => set({ startsQuestIds: v })} options={questOptions} addLabel="+ starts quest…" /></Field>
            <Field label="completesQuestIds"><IdMultiPicker ids={npc.completesQuestIds ?? []} onChange={(v) => set({ completesQuestIds: v })} options={questOptions} addLabel="+ completes quest…" /></Field>
            <Field label="relatedQuestIds"><IdMultiPicker ids={npc.relatedQuestIds} onChange={(v) => set({ relatedQuestIds: v })} options={questOptions} addLabel="+ related quest…" /></Field>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="shopId"><input value={npc.shopId ?? ''} onChange={(e) => set({ shopId: e.target.value || null })} className={inp} /></Field>
            <Field label="tags (,)"><input value={csv(npc.tags)} onChange={(e) => set({ tags: parseCsv(e.target.value) })} className={inp} /></Field>
          </div>

          <MovementSection npc={npc} set={set} />
        </>
      )}

      {tab === 'dialogue' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Field label="dialogueTreeId">
              <select value={npc.dialogueTreeId ?? ''} onChange={(e) => set({ dialogueTreeId: e.target.value || null })} className={inp}>
                <option value="">(none)</option>
                {treeIds.map((t) => <option key={t.id} value={t.id}>{t.source === 'editor' ? '✎ ' : ''}{t.id}</option>)}
              </select>
            </Field>
            <button onClick={() => { const id = createDialogueTree(npc.displayName); set({ dialogueTreeId: id }); }} className="mt-4 shrink-0 rounded border border-emerald-700/50 bg-emerald-700/20 px-2 py-1 text-xs text-emerald-100 hover:bg-emerald-700/30">+ New dialogue tree</button>
          </div>
          {npc.dialogueTreeId && treeIsEditor && <DialogueTreeEditor treeId={npc.dialogueTreeId} />}
          {npc.dialogueTreeId && !treeIsEditor && (
            <div className="space-y-1.5">
              <p className="text-[11px] text-slate-500">This is a seed dialogue tree (read-only). Copy it into the editor to make it fully editable (your copy overrides the seed and exports via JSON).</p>
              <button
                onClick={() => { const seed = getDialogueTree(npc.dialogueTreeId); if (seed) useEditorNpcStore.getState().setDialogueTree(JSON.parse(JSON.stringify(seed))); }}
                className="rounded border border-violet-600/50 bg-violet-600/20 px-2 py-1 text-xs text-violet-100 hover:bg-violet-600/35">✎ Make editable (copy seed → editor)</button>
            </div>
          )}
          {!npc.dialogueTreeId && <p className="text-[11px] text-slate-500">No dialogue tree assigned yet.</p>}
        </div>
      )}

      {tab === 'preview' && (
        npc.dialogueTreeId ? <DialoguePreviewPanel treeId={npc.dialogueTreeId} /> : <p className="text-[11px] text-slate-500">Assign a dialogueTreeId first.</p>
      )}
    </div>
  );
};
