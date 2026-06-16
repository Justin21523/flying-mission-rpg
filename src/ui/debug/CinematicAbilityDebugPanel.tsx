import { useState } from 'react';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { useCombatStore } from '../../stores/game/useCombatStore';
import { useCinematicAbilityEditorStore, cinematicAbilitiesForCharacter, getAbilityBySlot } from '../../stores/game/useCinematicAbilityEditorStore';
import { castCharacterSkillById, loadKitForCharacter } from '../../game/character-skills/CharacterSkillKitDirector';
import { getEnemyDef } from '../../stores/game/editorCombatStore';
import { spawnEnemyFromDef } from '../../game/combat/enemyRuntime';
import { robotHandle } from '../../game/destination/robotHandle';
import { exportEffectSnapshot } from '../../game/vfx/CinematicVfxDirector';
import { useNowMs } from '../../game/combat/useNowMs';
import { useAbilityPageStore, ABILITY_PAGES, PAGE_LABELS, PAGE_COUNT, ACTION_KEY_LABELS } from '../../game/character-skills/abilityPages';
import { cloneAbilitiesForCharacter, useCloneAbilityStore } from '../../stores/game/useCloneAbilityStore';
import { spawnCloneAbility, activeCloneCount, clonePoolCapacity, cleanupAllClonesForPhaseChange } from '../../game/vfx/CloneAbilityRuntime';
import { resolvedPoseList } from '../../game/vfx/ClonePoseModelRuntime';
import { buildCloneEffect } from '../../game/vfx/CloneEffectDirector';
import { useCinematicEffectStore } from '../../stores/game/useCinematicEffectStore';
import { CLONE_MATERIAL_MODES, type CloneAbilityDefinition, type CloneMaterialMode } from '../../types/cloneAbilityTypes';

// 🎬 Cinematic Ability debug panel (Batch F.7) — pick a hero, switch its 4 ability pages, cast any of its 16
// abilities, test the 4 clone abilities (cast / cycle material mode / preview pose + timeline / cleanup all).
const btn = 'rounded px-2 py-0.5 text-[11px] text-white';
const catColor = (c: string) => c === 'ultimate' ? 'bg-fuchsia-800 hover:bg-fuchsia-700' : c === 'clone' ? 'bg-violet-800 hover:bg-violet-700' : c === 'signature' ? 'bg-emerald-800 hover:bg-emerald-700' : c === 'defense' ? 'bg-blue-800 hover:bg-blue-700' : 'bg-sky-800 hover:bg-sky-700';
const CHARS = [['char_jett', 'Jett'], ['char_jerome', 'Jerome'], ['char_paul', 'Paul'], ['char_donnie', 'Donnie'], ['char_todd', 'Todd'], ['char_flip', 'Flip'], ['char_bello', 'Bello'], ['char_chase', 'Chase']] as const;

export const CinematicAbilityDebugPanel = () => {
  useNowMs(300);
  useCinematicAbilityEditorStore((s) => s.items);
  const page = useAbilityPageStore((s) => s.page);
  const [char, setChar] = useState('char_jett');
  const [snap, setSnap] = useState<string | null>(null);
  // Select primitives separately — an object-literal selector returns a new ref each render → infinite loop.
  const ignoreCd = useCombatStore((s) => s.ignoreCooldown);
  const ignoreEn = useCombatStore((s) => s.ignoreEnergyCost);
  useCloneAbilityStore((s) => s.items); // re-render on clone edits
  const [matMode, setMatMode] = useState<CloneMaterialMode | null>(null);
  const [selClone, setSelClone] = useState<string | null>(null);
  const abilities = cinematicAbilitiesForCharacter(char);
  const clones = cloneAbilitiesForCharacter(char);
  const sel = clones.find((c) => c.id === selClone);
  const pageSlots = ABILITY_PAGES[page] ?? [];
  const spawnDummy = () => { const d = getEnemyDef('crusher_drone'); if (d) spawnEnemyFromDef(d, robotHandle.pos.x + Math.sin(robotHandle.heading) * 8, robotHandle.pos.z + Math.cos(robotHandle.heading) * 8); };
  // Cast a clone — if a material-mode override is active, rebuild its effect with that mode first so the look
  // changes immediately (the runtime resolves the effect from the cinematic effect store).
  const castClone = (def: CloneAbilityDefinition) => {
    setSelClone(def.id);
    const color = abilities.find((a) => a.id === def.abilityId)?.editorMeta?.themeColor ?? '#88ccff';
    if (matMode && matMode !== def.visualConfig.materialMode) {
      const overridden: CloneAbilityDefinition = { ...def, visualConfig: { ...def.visualConfig, materialMode: matMode } };
      useCinematicEffectStore.getState().upsert(buildCloneEffect(overridden, color));
    }
    loadKitForCharacter(char);
    spawnCloneAbility(char, def.abilityId);
  };
  const cycleMatMode = () => {
    const order: (CloneMaterialMode | null)[] = [null, ...CLONE_MATERIAL_MODES];
    const i = order.indexOf(matMode);
    setMatMode(order[(i + 1) % order.length]);
  };

  return (
    <div className="pointer-events-auto fixed right-4 top-[8.5rem] z-40 w-72 rounded-xl border border-pink-500/30 bg-slate-900/90 p-3 text-slate-100 shadow-xl backdrop-blur">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-pink-300">🎬 Cinematic Abilities</div>
      <div className="mt-1 flex flex-wrap gap-1">
        {CHARS.map(([id, n]) => <button key={id} onClick={() => { setChar(id); useCharacterStore.getState().selectCharacter(id); loadKitForCharacter(id); }} className={`${btn} ${char === id ? 'bg-pink-700' : 'bg-slate-700 hover:bg-slate-600'}`}>{n}</button>)}
      </div>
      {/* Skill pages — switch the active page (Ctrl in-game) and see which ability each of 4/5/Z/X casts. */}
      <div className="mt-2 flex items-center gap-1">
        {Array.from({ length: PAGE_COUNT }, (_, p) => (
          <button key={p} onClick={() => useAbilityPageStore.getState().setPage(p)} className={`${btn} ${page === p ? 'bg-sky-700' : 'bg-slate-700 hover:bg-slate-600'}`}>Page {p + 1}</button>
        ))}
        <span className="ml-auto text-[9px] text-sky-300">{PAGE_LABELS[page]}</span>
      </div>
      <div className="mt-1 grid grid-cols-4 gap-1">
        {ACTION_KEY_LABELS.map((keyLabel, i) => {
          const a = pageSlots[i] ? getAbilityBySlot(char, pageSlots[i]) : undefined;
          return (
            <button key={keyLabel} disabled={!a} onClick={() => a && (loadKitForCharacter(char), castCharacterSkillById(char, a.combat.skillDefinitionId))} className={`${btn} ${a ? 'bg-indigo-800 hover:bg-indigo-700' : 'bg-slate-800 text-slate-600'}`} title={a?.description ?? ''}>
              <b className="text-sky-300">{keyLabel}</b> {a ? a.name.split(' ')[0] : '—'}
            </button>
          );
        })}
      </div>
      <div className="mt-2 text-[9px] text-slate-400">All {abilities.length} abilities (model scale ×{abilities[0]?.visualScale?.modelScaleMultiplier ?? '—'} basic):</div>
      <div className="mt-1 grid grid-cols-2 gap-1">
        {abilities.map((a) => (
          <button key={a.id} onClick={() => { loadKitForCharacter(char); castCharacterSkillById(char, a.combat.skillDefinitionId); }} className={`${btn} ${catColor(a.abilityCategory)}`} title={a.description}>{a.name}</button>
        ))}
      </div>
      <div className="mt-1 text-[9px] text-slate-400">{abilities.length} abilities · {abilities.filter((a) => a.abilityCategory === 'attack').length}A/{abilities.filter((a) => a.abilityCategory === 'defense').length}D/{abilities.filter((a) => a.abilityCategory === 'signature').length}S/{abilities.filter((a) => a.abilityCategory === 'ultimate').length}U/{abilities.filter((a) => a.abilityCategory === 'clone').length}C</div>

      {/* ── Clone abilities ── */}
      <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-violet-300">
        🌀 Clones
        <span className="ml-auto text-[9px] font-normal text-slate-400">active {activeCloneCount()}/{clonePoolCapacity()}</span>
      </div>
      <div className="mt-1 grid grid-cols-2 gap-1">
        {clones.map((c) => (
          <button key={c.id} onClick={() => castClone(c)} className={`${btn} ${sel?.id === c.id ? 'bg-violet-600' : 'bg-violet-800 hover:bg-violet-700'}`} title={`${c.cloneType} · ${c.cloneBehavior}`}>{c.name}</button>
        ))}
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        <button onClick={cycleMatMode} className={`${btn} ${matMode ? 'bg-violet-700' : 'bg-slate-700 hover:bg-slate-600'}`}>Material: {matMode ?? 'as-authored'}</button>
        <button onClick={() => cleanupAllClonesForPhaseChange()} className={`${btn} bg-rose-800 hover:bg-rose-700`}>Cleanup all clones</button>
      </div>
      {sel && (
        <div className="mt-1 rounded bg-slate-950/70 p-1.5 text-[9px] text-slate-300">
          <div className="text-violet-300">{sel.name} · {sel.cloneType} · ×{sel.visualConfig.modelScaleMultiplier} · {matMode ?? sel.visualConfig.materialMode}</div>
          <div className="mt-0.5">poses: {resolvedPoseList(sel.poseModelSet).map((p) => p.split('/').pop()).join(', ')}</div>
          <div className="mt-0.5">timeline: {sel.stateTimeline.map((k) => `${k.state}@${k.time}`).join(' → ')}</div>
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-1">
        <button onClick={spawnDummy} className={`${btn} bg-rose-800 hover:bg-rose-700`}>Spawn dummy</button>
        <button onClick={() => useCombatStore.getState().setDebugFlag('ignoreCooldown', !ignoreCd)} className={`${btn} ${ignoreCd ? 'bg-emerald-700' : 'bg-slate-700 hover:bg-slate-600'}`}>No CD</button>
        <button onClick={() => useCombatStore.getState().setDebugFlag('ignoreEnergyCost', !ignoreEn)} className={`${btn} ${ignoreEn ? 'bg-emerald-700' : 'bg-slate-700 hover:bg-slate-600'}`}>No energy</button>
      </div>
      <button onClick={() => setSnap(exportEffectSnapshot(abilities[0]?.vfx.cinematicEffectId ?? ''))} className={`${btn} mt-2 bg-slate-700 hover:bg-slate-600`}>Export first effect</button>
      {snap && <pre className="mt-1 max-h-24 overflow-auto rounded bg-slate-950/80 p-2 text-[9px] text-slate-300">{snap}</pre>}
    </div>
  );
};
