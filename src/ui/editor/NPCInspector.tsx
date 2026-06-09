import { Suspense, useMemo, useState } from 'react';
import type { EditorNpc, NpcType, NpcMovement, NpcPath, PathMode } from '../../types/editorNPC';
import { NPC_TYPES, NPC_TYPE_LABEL, NPC_TYPE_COLOR, NPC_MOVEMENT, PATH_MODES } from '../../types/editorNPC';
import type { TimeOfDay } from '../../types/randomEvent';
import { useEditorNpcStore } from '../../stores/editorNpcStore';
import { useDialogueStore } from '../../stores/dialogueStore';
import { useUiStore } from '../../stores/uiStore';
import { getDialogueTree } from '../../game/dialogue/dialogueRegistry';
import { editorSpawn } from '../../stores/sceneEditStore';
import { getClipsForPaths, useAnimClipStore } from '../../stores/animClipStore';
import { resolveModelAsset } from '../../stores/modelStudioStore';
import { validateNpcLive } from '../../game/editor/validateNpc';
import { Field, inp, lbl, csv, parseCsv, useQuestOptions, useItemOptions } from './editorShared';
import { IdMultiPicker, IdSelect } from './idPickers';
import { NPC_TYPE_DEFAULT_ROLE } from '../../types/editorNPC';
import { useEditorActivityStore } from '../../stores/editorActivityStore';
import { SEED_ACTIVITIES } from '../../data/activities';
import { ModelPicker } from './ModelPicker';
import { AnimationPicker } from './AnimationPicker';
import { AnimRuleList } from './AnimRuleList';
import { AssetClipLoader } from './AssetClipLoader';
import { DialogueTreeEditor } from './DialogueTreeEditor';
import { ConditionEditor } from './ConditionEditor';
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

const MOVE_LABEL: Record<NpcMovement, string> = { static: 'Static', patrol: 'Patrol loop', schedule: 'Time-of-day', wander: 'Wander (AI roam)', paths: 'Paths (weighted)', guard: 'Guard (chase + return)' };
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

      {mode === 'wander' && (
        <Field label="wanderRadius (roam range from start)">
          <input type="number" step={1} min={1} value={npc.wanderRadius ?? 12} onChange={(e) => set({ wanderRadius: parseFloat(e.target.value) || 1 })} className={inp} />
        </Field>
      )}

      {mode === 'guard' && (
        <Field label="guard leash (chase within this range, else return)">
          <input type="number" step={1} min={1} value={npc.guardLeash ?? 10} onChange={(e) => set({ guardLeash: parseFloat(e.target.value) || 1 })} className={inp} />
        </Field>
      )}

      {mode === 'paths' && <NpcPathsSection npc={npc} set={set} />}

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

// Vendor shop list — items this NPC sells (item dropdown + coin price). A non-empty list makes interacting
// open the shop (Phase M). Reuses the item options (seed + authored).
const VendorSection = ({ npc, set }: { npc: EditorNpc; set: (p: Partial<EditorNpc>) => void }) => {
  const items = useItemOptions();
  const sells = npc.sells ?? [];
  const update = (i: number, patch: Partial<{ itemId: string; price: number }>) => set({ sells: sells.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  return (
    <div className="space-y-1.5 rounded-lg border border-emerald-700/40 bg-emerald-950/15 p-2">
      <div className="flex items-center justify-between">
        <span className={lbl}>🛒 Vendor — items for sale (coins)</span>
        <button onClick={() => set({ sells: [...sells, { itemId: items[0]?.id ?? '', price: 10 }] })} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ add</button>
      </div>
      {sells.length === 0 && <div className="text-[11px] text-slate-500">No items — add some to make this NPC a shop (opens on interact).</div>}
      {sells.map((s, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <select value={s.itemId} onChange={(e) => update(i, { itemId: e.target.value })} className={inp + ' flex-1'}>
            {items.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <input type="number" min={0} value={s.price} onChange={(e) => update(i, { price: parseInt(e.target.value, 10) || 0 })} className={inp + ' w-20'} title="price (coins)" />
          <button onClick={() => set({ sells: sells.filter((_, j) => j !== i) })} className="rounded px-1 text-[11px] text-rose-400 hover:bg-slate-800">✕</button>
        </div>
      ))}
    </div>
  );
};

// Weighted multi-path editor. Each path = waypoints (per-point speed + wait) + loop/pingpong/once + weight.
// On each trip the NPC picks a path by weight. "add ×3" drops three blank paths at once.
const camPt = (): { pos: [number, number, number] } => ({ pos: [Math.round(editorSpawn.x * 100) / 100, 0, Math.round(editorSpawn.z * 100) / 100] });
const newPath = (n: number): NpcPath => ({ id: `path_${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`, name: `Path ${n}`, weight: 1, mode: 'loop', points: [camPt()] });

const NpcPathsSection = ({ npc, set }: { npc: EditorNpc; set: (p: Partial<EditorNpc>) => void }) => {
  const paths = npc.paths ?? [];
  const setPath = (i: number, patch: Partial<NpcPath>) => set({ paths: paths.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  const addPaths = (n: number) => { const base = paths.length; set({ paths: [...paths, ...Array.from({ length: n }, (_, k) => newPath(base + k + 1))] }); };
  return (
    <div className="space-y-2 rounded-lg border border-sky-700/40 bg-sky-950/15 p-2">
      <div className="flex items-center justify-between">
        <span className={lbl}>Paths (each trip picks one by weight)</span>
        <div className="flex gap-1">
          <button onClick={() => addPaths(1)} className="rounded bg-sky-700/30 px-2 py-0.5 text-[11px] text-sky-100 hover:bg-sky-700/50">➕ path</button>
          <button onClick={() => addPaths(3)} className="rounded bg-sky-700/30 px-2 py-0.5 text-[11px] text-sky-100 hover:bg-sky-700/50">➕×3</button>
        </div>
      </div>
      {paths.length === 0 && <div className="text-[11px] text-slate-500">No paths — add one (then add points along it).</div>}
      {paths.map((path, pi) => (
        <details key={path.id} className="rounded border border-slate-700/60 bg-slate-900/40 p-1.5" open>
          <summary className="flex cursor-pointer items-center gap-1.5">
            <input value={path.name} onChange={(e) => setPath(pi, { name: e.target.value })} className={inp + ' flex-1'} />
            <button onClick={() => set({ paths: paths.filter((_, j) => j !== pi) })} className="rounded px-1 text-[11px] text-rose-400 hover:bg-slate-800">🗑</button>
          </summary>
          <div className="mt-1 grid grid-cols-2 gap-1.5">
            <Field label="weight"><input type="number" step={0.5} min={0} value={path.weight} onChange={(e) => setPath(pi, { weight: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
            <Field label="mode">
              <select value={path.mode} onChange={(e) => setPath(pi, { mode: e.target.value as PathMode })} className={inp}>
                {PATH_MODES.map((m) => <option key={m} value={m}>{m === 'pingpong' ? 'ping-pong (來回)' : m}</option>)}
              </select>
            </Field>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className={lbl}>points</span>
            <button onClick={() => setPath(pi, { points: [...path.points, camPt()] })} className="rounded px-1.5 text-[11px] text-sky-300 hover:bg-slate-800">➕ at cam</button>
          </div>
          {path.points.map((pt, ki) => {
            const upd = (patch: Partial<typeof pt>) => setPath(pi, { points: path.points.map((q, j) => (j === ki ? { ...q, ...patch } : q)) });
            return (
              <div key={ki} className="mt-0.5 flex items-center gap-1">
                <span className="w-4 text-[10px] text-slate-500">{ki + 1}</span>
                {([0, 1, 2] as const).map((a) => (
                  <input key={a} type="number" step={0.5} value={pt.pos[a]} className={inp + ' w-0 flex-1'} onChange={(e) => { const np = [...pt.pos] as [number, number, number]; np[a] = parseFloat(e.target.value) || 0; upd({ pos: np }); }} />
                ))}
                <input type="number" step={0.2} value={pt.speed ?? ''} placeholder="spd" title="segment speed" className={inp + ' w-12'} onChange={(e) => upd({ speed: e.target.value === '' ? undefined : parseFloat(e.target.value) || 0 })} />
                <input type="number" step={0.2} value={pt.wait ?? ''} placeholder="wait" title="wait (s)" className={inp + ' w-12'} onChange={(e) => upd({ wait: e.target.value === '' ? undefined : parseFloat(e.target.value) || 0 })} />
                <button onClick={() => setPath(pi, { points: path.points.filter((_, j) => j !== ki) })} className="rounded px-1 text-[11px] text-rose-400 hover:bg-slate-800">✕</button>
              </div>
            );
          })}
        </details>
      ))}
    </div>
  );
};

// Per-NPC custom animation rules (same engine as the player). Loads the model's real clip names via drei's
// useGLTF (AssetClipLoader — DRACO aware, like the player) into animClipStore, so the track dropdown lists the
// model's actual clips, then reuses the shared AnimRuleList.
const NpcAnimationsSection = ({ npc, set }: { npc: EditorNpc; set: (p: Partial<EditorNpc>) => void }) => {
  useAnimClipStore((s) => s.clipsByPath); // re-render when clips finish loading
  const path = npc.modelAssetId ? resolveModelAsset(npc.modelAssetId)?.path : undefined;
  const clips = getClipsForPaths([path]);
  if (!npc.modelAssetId) return <div className="rounded-lg border border-slate-700/60 bg-slate-900/40 p-2 text-[11px] text-slate-500">Assign a 3D model above to author animation rules.</div>;
  return (
    <>
      {path && <Suspense fallback={null}><AssetClipLoader path={path} /></Suspense>}
      <AnimRuleList rules={npc.animations ?? []} clips={clips} onChange={(next) => set({ animations: next })} />
    </>
  );
};

// Dialogue tab — an NPC owns MANY trees (condition-gated priority). Pick a tree to edit, set its label +
// condition (the first tree whose condition passes plays on interact), add / delete whole trees.
const NpcDialogueTab = ({ npc }: { npc: EditorNpc }) => {
  const trees = npc.dialogueTreeIds?.length ? npc.dialogueTreeIds : (npc.dialogueTreeId ? [npc.dialogueTreeId] : []);
  const dialogueTrees = useEditorNpcStore((s) => s.dialogueTrees);
  const addTree = useEditorNpcStore((s) => s.addDialogueTreeToNpc);
  const detach = useEditorNpcStore((s) => s.detachDialogueTree);
  const setTree = useEditorNpcStore((s) => s.setDialogueTree);
  const [sel, setSel] = useState<string | null>(trees[0] ?? null);
  const selId = sel && trees.includes(sel) ? sel : trees[0] ?? null;
  const tree = selId ? dialogueTrees[selId] : undefined;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1">
        {trees.map((id, i) => (
          <button key={id} onClick={() => setSel(id)} className={`rounded px-2 py-0.5 text-[11px] ${selId === id ? 'bg-violet-600/40 text-violet-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{dialogueTrees[id]?.label || `Tree ${i + 1}`}</button>
        ))}
        <button onClick={() => setSel(addTree(npc.id))} className="rounded bg-emerald-700/30 px-2 py-0.5 text-[11px] text-emerald-100 hover:bg-emerald-700/50">+ tree</button>
        {selId && <button onClick={() => { detach(npc.id, selId); setSel(null); }} className="rounded px-2 py-0.5 text-[11px] text-rose-400 hover:bg-slate-800">🗑 delete tree</button>}
      </div>
      {trees.length === 0 && <p className="text-[11px] text-slate-500">No dialogue trees — add one. On interact, the first tree whose condition passes plays.</p>}
      {selId && tree && (
        <>
          <div className="grid grid-cols-2 gap-2 rounded border border-slate-700/60 bg-slate-900/40 p-2">
            <label className="flex flex-col gap-0.5"><span className={lbl}>tree label</span><input value={tree.label ?? ''} onChange={(e) => setTree({ ...tree, label: e.target.value })} className={inp} placeholder="e.g. After rescue" /></label>
            <ConditionEditor value={tree.condition} onChange={(c) => setTree({ ...tree, condition: c })} />
          </div>
          <DialogueTreeEditor treeId={selId} />
        </>
      )}
      {selId && !tree && (
        <div className="space-y-1.5">
          <p className="text-[11px] text-slate-500">Seed tree (read-only). Copy into the editor to make it fully editable.</p>
          <button onClick={() => { const seed = getDialogueTree(selId); if (seed) setTree(JSON.parse(JSON.stringify(seed))); }} className="rounded border border-violet-600/50 bg-violet-600/20 px-2 py-1 text-xs text-violet-100 hover:bg-violet-600/35">✎ Make editable</button>
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
  const closeHub = useUiStore((s) => s.toggleEditorHub);
  const startDialogue = useDialogueStore((s) => s.startDialogue);
  const [tab, setTab] = useState<'fields' | 'dialogue' | 'preview'>('fields');

  const set = (patch: Partial<EditorNpc>) => updateNpc(npc.id, patch);
  const valid = validateNpcLive(npc);
  const questOptions = useQuestOptions();
  const activities = useEditorActivityStore((s) => s.activities);
  const activityOptions = useMemo(() => [
    ...activities.map((a) => ({ id: a.def.id, label: a.def.title })),
    ...SEED_ACTIVITIES.map((a) => ({ id: a.def.id, label: `${a.def.title} (seed)` })),
  ], [activities]);

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
          {/* Suggestions for the free-typable role / label inputs. */}
          <datalist id="npc-role-suggestions">{Object.values(NPC_TYPE_DEFAULT_ROLE).map((r) => <option key={r} value={r} />)}</datalist>
          <datalist id="npc-label-suggestions">{['Talk', 'Trade', 'Ask', 'Help', 'Inspect', 'Greet'].map((r) => <option key={r} value={r} />)}</datalist>
          <div className="grid grid-cols-2 gap-2">
            <Field label="code"><input value={npc.code ?? ''} onChange={(e) => set({ code: e.target.value })} className={inp} /></Field>
            <Field label="displayName"><input value={npc.displayName} onChange={(e) => set({ displayName: e.target.value })} className={inp} /></Field>
            <Field label="npcType">
              <select value={npc.npcType ?? 'student'} onChange={(e) => { const t = e.target.value as NpcType; set({ npcType: t, color: NPC_TYPE_COLOR[t] }); }} className={inp}>
                {NPC_TYPES.map((t) => <option key={t} value={t}>{NPC_TYPE_LABEL[t]}</option>)}
              </select>
            </Field>
            <Field label="role (blank = type default)"><input list="npc-role-suggestions" value={npc.role} onChange={(e) => set({ role: e.target.value })} className={inp} /></Field>
            <Field label="zoneId (area)"><input value={npc.areaId} disabled className={`${inp} opacity-60`} /></Field>
            <Field label="interactionLabel"><input list="npc-label-suggestions" value={npc.interactionLabel} onChange={(e) => set({ interactionLabel: e.target.value })} className={inp} /></Field>
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
            <Field label="hosts activity / hunt (on interact)"><IdSelect value={npc.hostsActivityId ?? undefined} onChange={(v) => set({ hostsActivityId: v ?? null })} options={activityOptions} placeholder="(none)" /></Field>
            <Field label="tags (,)"><input value={csv(npc.tags)} onChange={(e) => set({ tags: parseCsv(e.target.value) })} className={inp} /></Field>
          </div>

          <VendorSection npc={npc} set={set} />
          <MovementSection npc={npc} set={set} />
          <NpcAnimationsSection npc={npc} set={set} />
        </>
      )}

      {tab === 'dialogue' && <NpcDialogueTab npc={npc} />}

      {tab === 'preview' && (
        npc.dialogueTreeId ? <DialoguePreviewPanel treeId={npc.dialogueTreeId} /> : <p className="text-[11px] text-slate-500">Assign a dialogueTreeId first.</p>
      )}
    </div>
  );
};
