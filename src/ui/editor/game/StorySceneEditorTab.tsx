import { nanoid } from 'nanoid';
import { useStorySceneStore } from '../../../stores/game/useStorySceneStore';
import { listDialogueTreeIds } from '../../../game/dialogue/dialogueRegistry';
import { inp, lbl, Field, Check } from '../editorShared';
import type { StorySceneDefinition, StorySceneTriggerType } from '../../../types/game/storyScene';

const TRIGGER_TYPES: StorySceneTriggerType[] = ['mission-start', 'mission-complete', 'rescue'];

// Phase 14 — edit Story Scenes: trigger → dialogue tree, played at mission-lifecycle moments. Reuses the
// existing dialogue trees (authored in the 🧑 NPC tab or seeded). Fully Edit-Mode editable + project-exported.
export const StorySceneEditorTab = () => {
  const scenes = useStorySceneStore((s) => s.items);
  const treeIds = listDialogueTreeIds();
  const st = () => useStorySceneStore.getState();

  const setTrigger = (s: StorySceneDefinition, type: StorySceneTriggerType, id: string) => {
    const trig = type === 'rescue' ? { type, npcId: id || undefined } : { type, missionId: id || undefined };
    st().update(s.id, { trigger: trig });
  };
  const triggerId = (s: StorySceneDefinition) => (s.trigger.type === 'rescue' ? s.trigger.npcId : s.trigger.missionId) ?? '';

  return (
    <div className="space-y-2 p-2 text-slate-100">
      <div className="flex items-center justify-between">
        <div className="text-sm font-black">💬 Story Scenes · {scenes.length}</div>
        <button
          className="rounded bg-violet-600 px-2 py-1 text-xs font-bold"
          onClick={() => st().upsert({ id: `story_${nanoid(6)}`, label: 'New scene', trigger: { type: 'mission-start' }, dialogueTreeId: treeIds[0]?.id ?? '', once: true, enabled: true })}
        >
          + Add scene
        </button>
      </div>
      <p className="text-[11px] text-slate-400">A scene plays a dialogue tree when a mission starts/completes or a resident is rescued. Leave the id blank for a generic scene; set it to target one mission/NPC (specific wins over generic).</p>

      {scenes.map((s) => (
        <div key={s.id} className="rounded border border-slate-700 bg-slate-900/60 p-2">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Label"><input className={inp} value={s.label ?? ''} onChange={(e) => st().update(s.id, { label: e.target.value })} /></Field>
            <Field label="Trigger">
              <select className={inp} value={s.trigger.type} onChange={(e) => setTrigger(s, e.target.value as StorySceneTriggerType, triggerId(s))}>
                {TRIGGER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label={s.trigger.type === 'rescue' ? 'NPC id (blank = any)' : 'Mission id (blank = any)'}>
              <input className={inp} value={triggerId(s)} onChange={(e) => setTrigger(s, s.trigger.type, e.target.value)} />
            </Field>
            <Field label="Dialogue tree">
              <select className={inp} value={s.dialogueTreeId} onChange={(e) => st().update(s.id, { dialogueTreeId: e.target.value })}>
                {!treeIds.some((t) => t.id === s.dialogueTreeId) && <option value={s.dialogueTreeId}>{s.dialogueTreeId || '— pick —'}</option>}
                {treeIds.map((t) => <option key={t.id} value={t.id}>{t.id} ({t.source})</option>)}
              </select>
            </Field>
          </div>
          <div className="mt-1.5 flex items-center gap-4">
            <Check label="Play once" checked={s.once !== false} onChange={(v) => st().update(s.id, { once: v })} />
            <Check label="Enabled" checked={s.enabled !== false} onChange={(v) => st().update(s.id, { enabled: v })} />
            <div className="ml-auto flex gap-2">
              <button className="text-[11px] text-sky-300" onClick={() => st().duplicate(s.id)}>Duplicate</button>
              <button className="text-[11px] text-rose-300" onClick={() => st().remove(s.id)}>Delete</button>
            </div>
          </div>
          <div className={`${lbl} mt-1`}>{s.dialogueTreeId && !getTreeOk(treeIds, s.dialogueTreeId) ? '⚠ dialogue tree not found' : ''}</div>
        </div>
      ))}
    </div>
  );
};

function getTreeOk(treeIds: { id: string }[], id: string): boolean {
  return treeIds.some((t) => t.id === id);
}
