import { useState } from 'react';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { cinematicAbilitiesForCharacter } from '../../stores/game/useCinematicAbilityEditorStore';
import { castCharacterSkillById, loadKitForCharacter } from '../../game/character-skills/CharacterSkillKitDirector';
import { getEnemyDef } from '../../stores/game/editorCombatStore';
import { spawnEnemyFromDef } from '../../game/combat/enemyRuntime';
import { robotHandle } from '../../game/destination/robotHandle';
import { cleanupAllVfx } from '../../game/vfx/CinematicVfxDebugTools';
import { livePhysicsObjects, physicsActiveCount, cleanupAll as cleanupPhysics } from '../../game/vfx/physics/PhysicsVfxDirector';
import { SEED_CINEMATIC_EFFECTS } from '../../data/character-abilities/allCharacterAbilities';
import { SHOWCASE_ABILITY_IDS } from '../../data/cinematic-vfx/showcaseAbilities';
import { scoreAbilityVfx, thresholdFor } from '../../game/vfx/CinematicVfxQualityScorer';
import { getStyleProfile } from '../../data/cinematic-vfx/characterVfxStyleProfiles';
import { getCinematicEffect } from '../../stores/game/useCinematicEffectStore';
import { getHeroModels } from '../../data/cinematic-vfx/vfxModelCatalog';
import { resolveModelAsset } from '../../stores/modelStudioStore';
import { modelLayerToParams } from '../../game/vfx/ModelEffectRuntime';
import { spawnCombatLayer, liveCinematicCount } from '../../game/vfx/cinematicVfxRuntime';
import type { TransformationEffectConfig } from '../../types/game/transformationEffects';
import { useNowMs } from '../../game/combat/useNowMs';

// 🎨 VFX Showcase debug panel (Batch F.6) — pick a hero, fire each of its 3 showcase abilities, and inspect
// the live quality score + signature objects + active physics/cinematic counts. Verifies every hero's
// signature look is distinct + model/geometry/physics-driven and that pools return to zero after cleanup.
const btn = 'rounded px-2 py-0.5 text-[11px] text-white';
const CHARS = [['char_jett', 'Jett'], ['char_jerome', 'Jerome'], ['char_paul', 'Paul'], ['char_donnie', 'Donnie'], ['char_todd', 'Todd'], ['char_flip', 'Flip'], ['char_bello', 'Bello'], ['char_chase', 'Chase']] as const;
const effectById = new Map(SEED_CINEMATIC_EFFECTS.map((e) => [e.id, e]));

export const VfxShowcaseDebugPanel = () => {
  useNowMs(300);
  const [char, setChar] = useState('char_jett');
  const [compare, setCompare] = useState<string | null>(null);
  const showcase = cinematicAbilitiesForCharacter(char).filter((a) => SHOWCASE_ABILITY_IDS.has(a.combat.skillDefinitionId));
  const cmp = compare ? cinematicAbilitiesForCharacter(compare).filter((a) => SHOWCASE_ABILITY_IDS.has(a.combat.skillDefinitionId)) : [];

  const scoreFor = (skillId: string) => {
    const effect = effectById.get(`${skillId}_fx`);
    if (!effect) return null;
    return scoreAbilityVfx(skillId, effect, getStyleProfile(effect.characterId), SEED_CINEMATIC_EFFECTS);
  };

  const cast = (cid: string, skillId: string) => { loadKitForCharacter(cid); castCharacterSkillById(cid, skillId); };
  const spawnDummy = () => { const d = getEnemyDef('crusher_drone'); if (d) spawnEnemyFromDef(d, robotHandle.pos.x + Math.sin(robotHandle.heading) * 8, robotHandle.pos.z + Math.cos(robotHandle.heading) * 8); };
  const cleanupAll = () => { cleanupAllVfx(); cleanupPhysics(); };
  // Re-read each useNowMs tick (300ms) — these are plain module arrays, not reactive state.
  const physCount = livePhysicsObjects.length;

  // Diagnostics for the LIVE store effect (what actually plays): model layers resolved / particle / physics.
  const diag = (skillId: string) => {
    const e = getCinematicEffect(`${skillId}_fx`);
    if (!e) return 'NO EFFECT in store!';
    const models = e.layers.filter((l) => l.layerType === 'model-component');
    const resolved = models.filter((l) => l.model?.modelAssetId && resolveModelAsset(l.model.modelAssetId)).length;
    const part = e.layers.filter((l) => l.layerType.startsWith('particle')).length;
    const phys = e.layers.filter((l) => l.layerType === 'physics-object').length;
    return `mdl ${resolved}/${models.length}✓ · part ${part} · phys ${phys} · layers ${e.layers.length}`;
  };

  // Spawn ONE normalized hero GLB straight through the runtime — isolates renderer health from effect compose.
  const spawnRawHeroModel = () => {
    const id = getHeroModels(char)?.airplane;
    if (!id) return;
    const m = modelLayerToParams({ modelAssetId: id, shape: 'orbit', count: 3, scale: 1.0, spin: 1.5, spreadRadius: 3 });
    const cfg: TransformationEffectConfig = {
      effectId: `raw_${Date.now()}`, effectName: 'raw-hero', effectType: m.v2EffectType, enabled: true,
      startTime: 0, duration: 3, delay: 0, layerOrder: 0, attachToBone: false, useCharacterModel: false,
      useCustomModel: true, customModelPrefabId: m.modelId, positionOffset: [0, 0, 0], rotationOffset: [0, 0, 0],
      scaleMultiplier: 1, opacity: 1, fadeInDuration: 0.05, fadeOutDuration: 0.3, color: '#66ccff',
      emissiveColor: '#66ccff', intensity: 1, blendMode: 'additive', loop: false, previewEnabled: true, parameters: m.params,
    };
    spawnCombatLayer({ config: cfg, follow: 'caster', anchor: { x: robotHandle.pos.x, y: robotHandle.pos.y, z: robotHandle.pos.z, heading: robotHandle.heading } });
  };

  return (
    <div className="pointer-events-auto fixed right-4 top-[20rem] z-40 w-80 rounded-xl border border-amber-500/30 bg-slate-900/90 p-3 text-slate-100 shadow-xl backdrop-blur">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-300">🎨 VFX Showcase</div>
      <div className="mt-1 flex flex-wrap gap-1">
        {CHARS.map(([id, n]) => <button key={id} onClick={() => { setChar(id); useCharacterStore.getState().selectCharacter(id); loadKitForCharacter(id); }} className={`${btn} ${char === id ? 'bg-amber-700' : 'bg-slate-700 hover:bg-slate-600'}`}>{n}</button>)}
      </div>
      <div className="mt-2 space-y-1">
        {showcase.map((a) => {
          const sc = scoreFor(a.combat.skillDefinitionId);
          const effect = effectById.get(`${a.combat.skillDefinitionId}_fx`);
          return (
            <div key={a.id} className="rounded border border-slate-800 p-1">
              <div className="flex items-center gap-2">
                <button onClick={() => cast(char, a.combat.skillDefinitionId)} className={`${btn} bg-fuchsia-800 hover:bg-fuchsia-700`}>▶ {a.name}</button>
                {sc && <span className={sc.passed ? 'text-emerald-400 text-[10px]' : 'text-rose-400 text-[10px]'}>{sc.score}/{thresholdFor(a.combat.skillDefinitionId)} {sc.passed ? '✓' : '✗'}</span>}
              </div>
              <div className="text-[9px] text-slate-400">{(effect?.signatureObjectIds ?? []).join(' · ')}</div>
              <div className="text-[9px] text-cyan-300/80">{diag(a.combat.skillDefinitionId)}</div>
              {sc && sc.warnings.length > 0 && <div className="text-[9px] text-amber-400/80">{sc.warnings.join(' / ')}</div>}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <button onClick={spawnDummy} className={`${btn} bg-rose-800 hover:bg-rose-700`}>Spawn dummy</button>
        <button onClick={spawnRawHeroModel} className={`${btn} bg-cyan-800 hover:bg-cyan-700`}>Spawn 1 hero model (raw)</button>
        <button onClick={cleanupAll} className={`${btn} bg-slate-700 hover:bg-slate-600`}>Cleanup all</button>
      </div>
      <div className="mt-1 text-[9px] text-slate-400">cinematic fx live: {liveCinematicCount()} · physics objects: {physCount} · pooled: {physicsActiveCount()}</div>
      <div className="mt-2 text-[10px] text-amber-200">Compare ▾</div>
      <div className="flex flex-wrap gap-1">
        {CHARS.map(([id, n]) => <button key={id} onClick={() => setCompare(compare === id ? null : id)} className={`${btn} text-[10px] ${compare === id ? 'bg-amber-700' : 'bg-slate-800 hover:bg-slate-700'}`}>{n}</button>)}
      </div>
      {compare && (
        <div className="mt-1 space-y-1">
          {cmp.map((a) => (
            <button key={a.id} onClick={() => cast(compare, a.combat.skillDefinitionId)} className={`${btn} block w-full bg-sky-800 hover:bg-sky-700 text-left`}>▶ {compare.replace('char_', '')} · {a.name}</button>
          ))}
        </div>
      )}
    </div>
  );
};
