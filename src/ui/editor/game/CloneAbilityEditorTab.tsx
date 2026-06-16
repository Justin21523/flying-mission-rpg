import { useState } from 'react';
import { useCloneAbilityStore } from '../../../stores/game/useCloneAbilityStore';
import { useCinematicEffectStore } from '../../../stores/game/useCinematicEffectStore';
import { getArsenalAbility } from '../../../data/character-abilities/allCharacterAbilities';
import type { CloneAbilityDefinition, ClonePoseModelSet, CloneVisualConfig } from '../../../types/cloneAbilityTypes';
import { CLONE_TYPES, CLONE_BEHAVIORS, CLONE_SPAWN_PATTERNS, CLONE_MATERIAL_MODES } from '../../../types/cloneAbilityTypes';
import { validateCloneAbility } from '../../../game/vfx/CloneAbilityValidation';
import { buildCloneEffect } from '../../../game/vfx/CloneEffectDirector';
import { resolvedPoseList } from '../../../game/vfx/ClonePoseModelRuntime';
import { Field, inp, lbl } from '../editorShared';

// 🌀 Clone Abilities editor (Batch F.7) — tune the 4 clone "double / echo / phantom" abilities per hero: type,
// behavior, spawn pattern, material mode, scale, pose model set, and timeline preview. Edits rebuild the clone's
// cinematic effect so the look updates live.
const CHARS = ['char_jett', 'char_jerome', 'char_paul', 'char_donnie', 'char_todd', 'char_flip', 'char_bello', 'char_chase'];
const POSE_KEYS: (keyof ClonePoseModelSet)[] = ['idlePoseModelId', 'actionPoseModelId', 'defensePoseModelId', 'supportPoseModelId', 'ultimatePoseModelId', 'dissolvePoseModelId', 'fallbackModelId'];

export const CloneAbilityEditorTab = () => {
  const items = useCloneAbilityStore((s) => s.items);
  const update = useCloneAbilityStore((s) => s.update);
  const [char, setChar] = useState(CHARS[0]);
  const list = items.filter((c) => c.characterId === char);
  const [sel, setSel] = useState<string | null>(list[0]?.id ?? null);
  const c = items.find((x) => x.id === sel) as CloneAbilityDefinition | undefined;

  // Persist an edit AND rebuild the clone's cinematic effect so the visual updates immediately.
  const apply = (patch: Partial<CloneAbilityDefinition>) => {
    if (!c) return;
    const next = { ...c, ...patch } as CloneAbilityDefinition;
    update(c.id, patch);
    const color = getArsenalAbility(c.abilityId)?.editorMeta?.themeColor ?? '#88ccff';
    useCinematicEffectStore.getState().upsert(buildCloneEffect(next, color));
  };
  const setVisual = (p: Partial<CloneVisualConfig>) => c && apply({ visualConfig: { ...c.visualConfig, ...p } });
  const setPose = (k: keyof ClonePoseModelSet, v: string) => c && apply({ poseModelSet: { ...c.poseModelSet, [k]: v } });

  return (
    <div className="space-y-3 text-xs">
      <div className="flex flex-wrap gap-1">
        {CHARS.map((cc) => <button key={cc} onClick={() => { setChar(cc); setSel(items.find((x) => x.characterId === cc)?.id ?? null); }} className={`rounded px-2 py-1 text-[11px] ${cc === char ? 'bg-violet-600/30 text-violet-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{cc.replace('char_', '')}</button>)}
      </div>
      <div className="flex flex-wrap gap-1">
        {list.map((x) => <button key={x.id} onClick={() => setSel(x.id)} className={`rounded px-2 py-1 text-[10px] ${x.id === sel ? 'bg-sky-600/30 text-sky-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{x.name}</button>)}
      </div>
      {c && (
        <>
          <div className={lbl}>🌀 {c.name} · {c.cloneType}</div>
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-800 p-2">
            <Field label="Clone type"><select value={c.cloneType} onChange={(e) => apply({ cloneType: e.target.value as CloneAbilityDefinition['cloneType'] })} className={inp}>{CLONE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
            <Field label="Behavior"><select value={c.cloneBehavior} onChange={(e) => apply({ cloneBehavior: e.target.value as CloneAbilityDefinition['cloneBehavior'] })} className={inp}>{CLONE_BEHAVIORS.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
            <Field label="Spawn pattern"><select value={c.spawnPattern} onChange={(e) => apply({ spawnPattern: e.target.value as CloneAbilityDefinition['spawnPattern'] })} className={inp}>{CLONE_SPAWN_PATTERNS.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
            <Field label="Material mode"><select value={c.visualConfig.materialMode} onChange={(e) => setVisual({ materialMode: e.target.value as CloneVisualConfig['materialMode'] })} className={inp}>{CLONE_MATERIAL_MODES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
            <Field label="Max clone count"><input type="number" min={1} value={c.maxCloneCount} onChange={(e) => apply({ maxCloneCount: Math.max(1, parseInt(e.target.value) || 1) })} className={inp} /></Field>
            <Field label="Duration (s)"><input type="number" step={0.1} min={0.1} value={c.durationSeconds} onChange={(e) => apply({ durationSeconds: Math.max(0.1, parseFloat(e.target.value) || 0.1) })} className={inp} /></Field>
            <Field label="Model scale ×"><input type="number" step={0.1} min={0.1} value={c.visualConfig.modelScaleMultiplier} onChange={(e) => setVisual({ modelScaleMultiplier: Math.max(0.1, parseFloat(e.target.value) || 0.1) })} className={inp} /></Field>
            <Field label="Opacity"><input type="number" step={0.05} min={0} max={1} value={c.visualConfig.opacity ?? 1} onChange={(e) => setVisual({ opacity: Math.min(1, Math.max(0, parseFloat(e.target.value) || 0)) })} className={inp} /></Field>
          </div>

          <div className={lbl}>Pose model set</div>
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-800 p-2">
            {POSE_KEYS.map((k) => (
              <Field key={k} label={k.replace('PoseModelId', '').replace('ModelId', '')}><input value={(c.poseModelSet[k] as string) ?? ''} onChange={(e) => setPose(k, e.target.value)} className={inp} /></Field>
            ))}
          </div>

          <div className="rounded-lg border border-slate-800 p-2 text-[10px] text-slate-300">
            <div>resolved poses: {resolvedPoseList(c.poseModelSet).map((p) => p.split('/').pop()).join(', ')}</div>
            <div className="mt-1">timeline: {c.stateTimeline.map((k) => `${k.state}@${k.time}`).join(' → ')}</div>
            <div className="mt-1">gameplay: {Object.entries(c.gameplayEffect).map(([k, v]) => `${k}=${Array.isArray(v) ? v.join('/') : v}`).join(', ')}</div>
          </div>

          <div className="text-[10px]">
            {validateCloneAbility(c).errors.map((e, i) => <div key={i} className="text-rose-400">✗ {e}</div>)}
            {validateCloneAbility(c).ok && <div className="text-emerald-400">✓ clone ability valid</div>}
          </div>
        </>
      )}
    </div>
  );
};
