import { useState } from 'react';
import {
  useBossDefinitionStore, useBossPhaseStore, useBossWeakpointStore, useBossAttackStore, useBossArenaStore, useBossSummonWaveStore,
} from '../../../stores/game/useBossEditorStore';
import { BOSS_TYPES, BOSS_PATTERN_TYPES } from '../../../types/game/boss';
import type { BossDefinition, BossPhaseDefinition, BossWeakpointDefinition, BossAttackPatternDefinition, BossArenaDefinition, BossSummonWaveDefinition } from '../../../types/game/boss';
import { validateBoss, validatePhase, validateWeakpoint, validateAttackPattern, validateArena, validateSummonWave } from '../../../game/bosses/BossValidation';
import { Field, inp, lbl, csv, parseCsv } from '../editorShared';

// 👹 Boss — one tab, sub-sections (Definition / Phase / Weakpoint / Attack / Arena / Wave). Backed by the six
// boss editor collections (Batch F). Form-based (no gizmo this batch); live validation per section.
const SECTIONS = ['Definition', 'Phase', 'Weakpoint', 'Attack', 'Arena', 'Wave'] as const;
type Section = (typeof SECTIONS)[number];

const Picker = ({ items, sel, set }: { items: { id: string; name?: string; displayName?: string }[]; sel: string | null; set: (id: string) => void }) => (
  <div className="flex flex-wrap gap-1">
    {items.map((x) => <button key={x.id} onClick={() => set(x.id)} className={`rounded px-2 py-1 text-[11px] ${x.id === sel ? 'bg-rose-600/30 text-rose-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{x.displayName ?? x.name ?? x.id}</button>)}
  </div>
);

const Errors = ({ r }: { r: { ok: boolean; errors: string[]; warnings: string[] } }) => (
  <div className="text-[10px]">
    {r.errors.map((e, i) => <div key={i} className="text-rose-400">✗ {e}</div>)}
    {r.warnings.map((w, i) => <div key={i} className="text-amber-400">⚠ {w}</div>)}
    {r.ok && <div className="text-emerald-400">✓ valid</div>}
  </div>
);

export const BossEditorTab = () => {
  const bosses = useBossDefinitionStore((s) => s.items);
  const updateBoss = useBossDefinitionStore((s) => s.update);
  const phases = useBossPhaseStore((s) => s.items);
  const updatePhase = useBossPhaseStore((s) => s.update);
  const weakpoints = useBossWeakpointStore((s) => s.items);
  const updateWeakpoint = useBossWeakpointStore((s) => s.update);
  const attacks = useBossAttackStore((s) => s.items);
  const updateAttack = useBossAttackStore((s) => s.update);
  const arenas = useBossArenaStore((s) => s.items);
  const updateArena = useBossArenaStore((s) => s.update);
  const waves = useBossSummonWaveStore((s) => s.items);
  const updateWave = useBossSummonWaveStore((s) => s.update);

  const [section, setSection] = useState<Section>('Definition');
  const [bossSel, setBossSel] = useState<string | null>(bosses[0]?.id ?? null);
  const [phaseSel, setPhaseSel] = useState<string | null>(phases[0]?.id ?? null);
  const [wpSel, setWpSel] = useState<string | null>(weakpoints[0]?.id ?? null);
  const [atkSel, setAtkSel] = useState<string | null>(attacks[0]?.id ?? null);
  const [arenaSel, setArenaSel] = useState<string | null>(arenas[0]?.id ?? null);
  const [waveSel, setWaveSel] = useState<string | null>(waves[0]?.id ?? null);

  const b = bosses.find((x) => x.id === bossSel) as BossDefinition | undefined;
  const p = phases.find((x) => x.id === phaseSel) as BossPhaseDefinition | undefined;
  const wp = weakpoints.find((x) => x.id === wpSel) as BossWeakpointDefinition | undefined;
  const atk = attacks.find((x) => x.id === atkSel) as BossAttackPatternDefinition | undefined;
  const arena = arenas.find((x) => x.id === arenaSel) as BossArenaDefinition | undefined;
  const wave = waves.find((x) => x.id === waveSel) as BossSummonWaveDefinition | undefined;

  const lookups = {
    arenaExists: (id: string) => arenas.some((a) => a.id === id),
    phaseExists: (id: string) => phases.some((x) => x.id === id),
    weakpointExists: (id: string) => weakpoints.some((x) => x.id === id),
    attackExists: (id: string) => attacks.some((x) => x.id === id),
    waveExists: (id: string) => waves.some((x) => x.id === id),
  };
  return (
    <div className="space-y-3 text-xs">
      <div className="flex gap-1">
        {SECTIONS.map((s) => <button key={s} onClick={() => setSection(s)} className={`rounded px-2 py-1 text-[11px] ${s === section ? 'bg-rose-600/30 text-rose-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{s}</button>)}
      </div>

      {section === 'Definition' && (<><Picker items={bosses} sel={bossSel} set={setBossSel} />{b && (<>
        <div className={lbl}>👹 {b.name}</div>
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-800 p-2">
          <Field label="Name"><input value={b.name} onChange={(e) => updateBoss(b.id, { name: e.target.value })} className={inp} /></Field>
          <Field label="Boss type"><select value={b.bossType} onChange={(e) => updateBoss(b.id, { bossType: e.target.value as BossDefinition['bossType'] })} className={inp}>{BOSS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
          <Field label="Max HP"><input type="number" value={b.damageable.maxHp} onChange={(e) => updateBoss(b.id, { damageable: { ...b.damageable, maxHp: parseFloat(e.target.value) || 0 } })} className={inp} /></Field>
          <Field label="Max Shield"><input type="number" value={b.damageable.maxShield ?? 0} onChange={(e) => updateBoss(b.id, { damageable: { ...b.damageable, maxShield: parseFloat(e.target.value) || 0 } })} className={inp} /></Field>
          <Field label="Arena id"><input value={b.arenaId} onChange={(e) => updateBoss(b.id, { arenaId: e.target.value })} className={inp} /></Field>
          <Field label="Segment id"><input value={b.segmentId} onChange={(e) => updateBoss(b.id, { segmentId: e.target.value })} className={inp} /></Field>
          <Field label="Phase ids (csv)"><input value={csv(b.phaseIds)} onChange={(e) => updateBoss(b.id, { phaseIds: parseCsv(e.target.value) })} className={inp} /></Field>
          <Field label="Start phase id"><input value={b.startPhaseId} onChange={(e) => updateBoss(b.id, { startPhaseId: e.target.value })} className={inp} /></Field>
          <Field label="Final phase ids (csv)"><input value={csv(b.finalPhaseIds)} onChange={(e) => updateBoss(b.id, { finalPhaseIds: parseCsv(e.target.value) })} className={inp} /></Field>
          <Field label="Model preset id"><input value={b.visual.modelPresetId} onChange={(e) => updateBoss(b.id, { visual: { ...b.visual, modelPresetId: e.target.value } })} className={inp} /></Field>
          <Field label="Theme color"><input type="color" value={b.visual.themeColor ?? '#38bdf8'} onChange={(e) => updateBoss(b.id, { visual: { ...b.visual, themeColor: e.target.value } })} className="h-7 w-16 rounded bg-slate-800" /></Field>
          <Field label="Complete zone on defeat"><input type="checkbox" checked={b.completion.completeZoneOnDefeat} onChange={(e) => updateBoss(b.id, { completion: { ...b.completion, completeZoneOnDefeat: e.target.checked } })} /></Field>
        </div>
        <Errors r={validateBoss(b, lookups)} />
      </>)}</>)}

      {section === 'Phase' && (<><Picker items={phases} sel={phaseSel} set={setPhaseSel} />{p && (<>
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-800 p-2">
          <Field label="Name"><input value={p.name} onChange={(e) => updatePhase(p.id, { name: e.target.value })} className={inp} /></Field>
          <Field label="Phase index"><input type="number" value={p.phaseIndex} onChange={(e) => updatePhase(p.id, { phaseIndex: parseInt(e.target.value) || 0 })} className={inp} /></Field>
          <Field label="Enabled attacks (csv)"><input value={csv(p.enabledAttackPatternIds)} onChange={(e) => updatePhase(p.id, { enabledAttackPatternIds: parseCsv(e.target.value) })} className={inp} /></Field>
          <Field label="Enabled weakpoints (csv)"><input value={csv(p.enabledWeakpointIds)} onChange={(e) => updatePhase(p.id, { enabledWeakpointIds: parseCsv(e.target.value) })} className={inp} /></Field>
          <Field label="Enabled summon waves (csv)"><input value={csv(p.enabledSummonWaveIds)} onChange={(e) => updatePhase(p.id, { enabledSummonWaveIds: parseCsv(e.target.value) })} className={inp} /></Field>
          <Field label="Next phase ids (csv)"><input value={csv(p.nextPhaseIds)} onChange={(e) => updatePhase(p.id, { nextPhaseIds: parseCsv(e.target.value) })} className={inp} /></Field>
          <Field label="Damage mult"><input type="number" step={0.1} value={p.bossModifiers?.damageMultiplier ?? 1} onChange={(e) => updatePhase(p.id, { bossModifiers: { ...p.bossModifiers, damageMultiplier: parseFloat(e.target.value) || 1 } })} className={inp} /></Field>
          <Field label="Invuln until weakpoint"><input type="checkbox" checked={!!p.bossModifiers?.invulnerableUntilWeakpointExposed} onChange={(e) => updatePhase(p.id, { bossModifiers: { ...p.bossModifiers, invulnerableUntilWeakpointExposed: e.target.checked } })} /></Field>
        </div>
        <div className="text-[10px] text-slate-400">Completion: {p.completionConditions.map((c) => c.type).join(', ')}</div>
        <Errors r={validatePhase(p, lookups)} />
      </>)}</>)}

      {section === 'Weakpoint' && (<><Picker items={weakpoints.map((x) => ({ id: x.id, name: x.displayName }))} sel={wpSel} set={setWpSel} />{wp && (<>
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-800 p-2">
          <Field label="Display name"><input value={wp.displayName} onChange={(e) => updateWeakpoint(wp.id, { displayName: e.target.value })} className={inp} /></Field>
          <Field label="Max HP"><input type="number" value={wp.damageable.maxHp} onChange={(e) => updateWeakpoint(wp.id, { damageable: { ...wp.damageable, maxHp: parseFloat(e.target.value) || 0 } })} className={inp} /></Field>
          <Field label="Active in phases (csv)"><input value={csv(wp.activeInPhaseIds)} onChange={(e) => updateWeakpoint(wp.id, { activeInPhaseIds: parseCsv(e.target.value) })} className={inp} /></Field>
          <Field label="Marker geometry"><select value={wp.visual.markerGeometry} onChange={(e) => updateWeakpoint(wp.id, { visual: { ...wp.visual, markerGeometry: e.target.value as BossWeakpointDefinition['visual']['markerGeometry'] } })} className={inp}>{['sphere', 'ring', 'diamond', 'crosshair'].map((g) => <option key={g} value={g}>{g}</option>)}</select></Field>
          <Field label="Initially exposed"><input type="checkbox" checked={wp.exposedRules.initiallyExposed} onChange={(e) => updateWeakpoint(wp.id, { exposedRules: { ...wp.exposedRules, initiallyExposed: e.target.checked } })} /></Field>
          <Field label="Expose duration (s)"><input type="number" value={wp.exposedRules.exposeDurationSeconds ?? 0} onChange={(e) => updateWeakpoint(wp.id, { exposedRules: { ...wp.exposedRules, exposeDurationSeconds: parseFloat(e.target.value) || 0 } })} className={inp} /></Field>
          <Field label="Damage boss on destroy"><input type="number" value={wp.effectOnDestroyed.damageBossAmount ?? 0} onChange={(e) => updateWeakpoint(wp.id, { effectOnDestroyed: { ...wp.effectOnDestroyed, damageBossAmount: parseFloat(e.target.value) || 0 } })} className={inp} /></Field>
          <Field label="Remove boss shield"><input type="number" value={wp.effectOnDestroyed.removeBossShield ?? 0} onChange={(e) => updateWeakpoint(wp.id, { effectOnDestroyed: { ...wp.effectOnDestroyed, removeBossShield: parseFloat(e.target.value) || 0 } })} className={inp} /></Field>
        </div>
        <Errors r={validateWeakpoint(wp, lookups.phaseExists)} />
      </>)}</>)}

      {section === 'Attack' && (<><Picker items={attacks} sel={atkSel} set={setAtkSel} />{atk && (<>
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-800 p-2">
          <Field label="Pattern type"><select value={atk.patternType} onChange={(e) => updateAttack(atk.id, { patternType: e.target.value as BossAttackPatternDefinition['patternType'] })} className={inp}>{BOSS_PATTERN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
          <Field label="Cooldown (s)"><input type="number" step={0.5} value={atk.cooldownSeconds} onChange={(e) => updateAttack(atk.id, { cooldownSeconds: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
          <Field label="Cast time (s)"><input type="number" step={0.1} value={atk.castTimeSeconds} onChange={(e) => updateAttack(atk.id, { castTimeSeconds: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
          <Field label="Active duration (s)"><input type="number" step={0.1} value={atk.activeDurationSeconds} onChange={(e) => updateAttack(atk.id, { activeDurationSeconds: parseFloat(e.target.value) || 0.1 })} className={inp} /></Field>
          <Field label="Damage amount"><input type="number" value={atk.damageEventTemplate?.amount ?? 0} onChange={(e) => updateAttack(atk.id, { damageEventTemplate: { amount: parseFloat(e.target.value) || 0, damageType: atk.damageEventTemplate?.damageType ?? 'energy', attackTags: atk.damageEventTemplate?.attackTags ?? ['boss'] } })} className={inp} /></Field>
          <Field label="Phase ids (csv)"><input value={csv(atk.phaseIds)} onChange={(e) => updateAttack(atk.id, { phaseIds: parseCsv(e.target.value) })} className={inp} /></Field>
          <Field label="Hit radius"><input type="number" value={atk.hitVolume.radius ?? 0} onChange={(e) => updateAttack(atk.id, { hitVolume: { ...atk.hitVolume, radius: parseFloat(e.target.value) || 0 } })} className={inp} /></Field>
        </div>
        <Errors r={validateAttackPattern(atk, lookups.phaseExists)} />
      </>)}</>)}

      {section === 'Arena' && (<><Picker items={arenas} sel={arenaSel} set={setArenaSel} />{arena && (<>
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-800 p-2">
          <Field label="Name"><input value={arena.name} onChange={(e) => updateArena(arena.id, { name: e.target.value })} className={inp} /></Field>
          <Field label="Segment id"><input value={arena.segmentId} onChange={(e) => updateArena(arena.id, { segmentId: e.target.value })} className={inp} /></Field>
          {(['0', '1', '2'] as const).map((a) => <Field key={a} label={`Bounds size ${a}`}><input type="number" value={arena.bounds.size[+a]} onChange={(e) => { const size = [...arena.bounds.size] as [number, number, number]; size[+a] = parseFloat(e.target.value) || 0; updateArena(arena.id, { bounds: { ...arena.bounds, size } }); }} className={inp} /></Field>)}
          <Field label="Lock on start"><input type="checkbox" checked={arena.arenaLock.lockOnStart} onChange={(e) => updateArena(arena.id, { arenaLock: { ...arena.arenaLock, lockOnStart: e.target.checked } })} /></Field>
          <Field label="Unlock on defeat"><input type="checkbox" checked={arena.arenaLock.unlockOnBossDefeat} onChange={(e) => updateArena(arena.id, { arenaLock: { ...arena.arenaLock, unlockOnBossDefeat: e.target.checked } })} /></Field>
        </div>
        <Errors r={validateArena(arena)} />
      </>)}</>)}

      {section === 'Wave' && (<><Picker items={waves} sel={waveSel} set={setWaveSel} />{wave && (<>
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-800 p-2">
          <Field label="Phase id"><input value={wave.phaseId} onChange={(e) => updateWave(wave.id, { phaseId: e.target.value })} className={inp} /></Field>
          <Field label="Enemy spawn group ids (csv)"><input value={csv(wave.enemySpawnGroupIds)} onChange={(e) => updateWave(wave.id, { enemySpawnGroupIds: parseCsv(e.target.value) })} className={inp} /></Field>
          <Field label="Max active enemies"><input type="number" value={wave.maxActiveEnemies ?? 0} onChange={(e) => updateWave(wave.id, { maxActiveEnemies: parseFloat(e.target.value) || 0 })} className={inp} /></Field>
          <Field label="Complete when cleared"><input type="checkbox" checked={wave.completeWhenGroupsCleared} onChange={(e) => updateWave(wave.id, { completeWhenGroupsCleared: e.target.checked })} /></Field>
        </div>
        <Errors r={validateSummonWave(wave, { phaseExists: lookups.phaseExists })} />
      </>)}</>)}
    </div>
  );
};
