import { useState } from 'react';
import {
  useEditorCombatStatsStore,
  useEditorCombatSkillStore,
  useEditorDamageableStore,
  useEditorCombatEffectStore,
  useEditorEnemyStore,
  useEditorBossPhaseStore,
  useEditorSpawnGroupStore,
  getCombatEffect,
} from '../../../stores/game/editorCombatStore';
import { DAMAGE_TYPES, ATTACK_TYPES, DEFENSE_TYPES, ENEMY_ARCHETYPES } from '../../../types/game/combat';
import { validateEnemy, validateSpawnGroup } from '../../../game/combat/enemyValidation';
import type {
  CombatStatsPreset, EnemyAiBehavior, AttackType, DefenseType,
  HitVolumeShape, GeometryType, GeometryRenderMode, GeometryAnimate, CombatSkillType, CombatEffectType, ArmorType, OnHpZero,
} from '../../../types/game/combat';
import { validateCombatStats, validateSkill, validateDamageable, validateCombatEffect } from '../../../game/combat/CombatValidation';
import { castSkillById } from '../../../game/combat/CombatDirector';
import { Field, inp, lbl, Check, csv, parseCsv } from '../editorShared';
import { ModelPicker } from '../ModelPicker';
import { SkillTimelineEditor } from './combat/SkillTimelineEditor';

// ⚔ Combat — one tab; sub-sections edit each createEditorCollection (Player Stats / Skills / Dummy Targets /
// Effects / Enemies / Boss Phases). Skills carry model pickers + a live Test Cast. Form-based (no gizmo).
const num = (v: string) => parseFloat(v) || 0;
const SECTIONS = ['Player Stats', 'Skills', 'Dummy Targets', 'Effects', 'Enemies', 'Spawn Groups', 'Boss Phases'] as const;
type Section = (typeof SECTIONS)[number];

const HIT_SHAPES: HitVolumeShape[] = ['sphere', 'box', 'capsule', 'cone', 'cylinder', 'ring', 'arc', 'line', 'spline-placeholder'];
const SKILL_TYPES: CombatSkillType[] = ['basic', 'special', 'aoe', 'defense', 'dash', 'utility', 'ultimate-placeholder'];
const AI_BEHAVIORS: EnemyAiBehavior[] = ['chaser', 'kiter', 'turret', 'boss'];
const GEO_TYPES: GeometryType[] = ['sphere', 'box', 'cone', 'cylinder', 'torus', 'arc', 'ring', 'line', 'tube', 'plane'];
const RENDER_MODES: GeometryRenderMode[] = ['solid', 'wireframe', 'transparent', 'additive', 'outline'];
const ANIMATES: GeometryAnimate[] = ['none', 'expand', 'pulse', 'rotate', 'sweep', 'contract'];
const EFFECT_TYPES: CombatEffectType[] = ['geometry-range', 'ring-burst', 'energy-field', 'model-component-motion', 'shield-wall', 'lock-line', 'placeholder-basic-mesh'];
const ARMOR_TYPES: ArmorType[] = ['none', 'light', 'medium', 'heavy', 'shielded'];
const ON_HP_ZERO: OnHpZero[] = ['destroy', 'disable', 'down', 'complete-condition', 'debug-log'];

const ValidationLine = ({ res }: { res: { ok: boolean; errors: string[]; warnings: string[] } }) => (
  <div className="text-[10px]">
    {res.errors.map((e, i) => <div key={`e${i}`} className="text-rose-400">✗ {e}</div>)}
    {res.warnings.map((w, i) => <div key={`w${i}`} className="text-amber-400">⚠ {w}</div>)}
    {res.ok && res.warnings.length === 0 && <div className="text-emerald-400">✓ valid</div>}
  </div>
);

// Generic list rail.
function Rail<T extends { id: string }>({ items, sel, onSelect, onAdd, label, name }: { items: T[]; sel: string | null; onSelect: (id: string) => void; onAdd: () => void; label: (t: T) => string; name: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-wrap gap-1">
        {items.map((t) => (
          <button key={t.id} onClick={() => onSelect(t.id)} className={`rounded px-2 py-1 text-[11px] ${t.id === sel ? 'bg-sky-600/30 text-sky-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{label(t)}</button>
        ))}
      </div>
      <button onClick={onAdd} className="rounded bg-emerald-700/30 px-2 py-1 text-[11px] text-emerald-100 hover:bg-emerald-700/50">➕ {name}</button>
    </div>
  );
}

const StatsSection = () => {
  const items = useEditorCombatStatsStore((s) => s.items);
  const update = useEditorCombatStatsStore((s) => s.update);
  const [sel, setSel] = useState<string | null>(items[0]?.id ?? null);
  const p = items.find((x) => x.id === sel);
  const numField = (label: string, key: keyof CombatStatsPreset) => (
    <Field label={label}><input type="number" step={1} value={(p?.[key] as unknown as number) ?? 0} onChange={(e) => p && update(p.id, { [key]: num(e.target.value) } as Partial<CombatStatsPreset>)} className={inp} /></Field>
  );
  return (
    <div className="space-y-2">
      <Rail items={items} sel={sel} onSelect={setSel} onAdd={() => { const id = useEditorCombatStatsStore.getState().duplicate(items[0]?.id ?? ''); if (id) setSel(id); }} label={(t) => t.editorMeta?.displayName ?? t.id} name="Preset" />
      {p && (
        <div className="space-y-2 rounded-lg border border-slate-800 p-2">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Character id"><input value={p.characterId ?? ''} onChange={(e) => update(p.id, { characterId: e.target.value || undefined })} className={inp} placeholder="default / char_jett" /></Field>
            {numField('Max HP', 'maxHp')}
            {numField('Max Shield', 'maxShield')}
            {numField('Shield regen/s', 'shieldRegenPerSecond')}
            {numField('Shield delay (s)', 'shieldRegenDelaySeconds')}
            {numField('Max Energy', 'maxEnergy')}
            {numField('Energy regen/s', 'energyRegenPerSecond')}
            {numField('Stagger resist', 'staggerResistance')}
            {numField('Move speed ×', 'moveSpeedMultiplier')}
          </div>
          <ValidationLine res={validateCombatStats(p)} />
          <DetailButtons store={useEditorCombatStatsStore} id={p.id} onSel={setSel} />
        </div>
      )}
    </div>
  );
};

const SkillsSection = () => {
  const items = useEditorCombatSkillStore((s) => s.items);
  const update = useEditorCombatSkillStore((s) => s.update);
  const effects = useEditorCombatEffectStore((s) => s.items);
  const [sel, setSel] = useState<string | null>(items[0]?.id ?? null);
  const s = items.find((x) => x.id === sel);
  const hv = s?.hitVolume;
  const dmg = s?.damageEvents?.[0];
  return (
    <div className="space-y-2">
      <Rail items={items} sel={sel} onSelect={setSel} onAdd={() => { const id = useEditorCombatSkillStore.getState().duplicate(items[0]?.id ?? ''); if (id) setSel(id); }} label={(t) => t.editorMeta?.displayName ?? t.name} name="Skill" />
      {s && hv && (
        <div className="space-y-2 rounded-lg border border-slate-800 p-2">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Name"><input value={s.name} onChange={(e) => update(s.id, { name: e.target.value })} className={inp} /></Field>
            <Field label="Input binding"><input value={s.inputBinding} onChange={(e) => update(s.id, { inputBinding: e.target.value })} className={inp} placeholder="KeyJ" /></Field>
            <Field label="Type"><select value={s.skillType} onChange={(e) => update(s.id, { skillType: e.target.value as CombatSkillType })} className={inp}>{SKILL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
            <Field label="Energy cost"><input type="number" value={s.energyCost} onChange={(e) => update(s.id, { energyCost: num(e.target.value) })} className={inp} /></Field>
            <Field label="Cooldown (s)"><input type="number" step={0.1} value={s.cooldownSeconds} onChange={(e) => update(s.id, { cooldownSeconds: num(e.target.value) })} className={inp} /></Field>
            <Field label="Effect def id"><select value={s.effectDefinitionId ?? ''} onChange={(e) => update(s.id, { effectDefinitionId: e.target.value || undefined })} className={inp}><option value="">(none)</option>{effects.map((e) => <option key={e.id} value={e.id}>{e.id}</option>)}</select></Field>
            <Field label="Owner character id"><input value={s.ownerCharacterId ?? ''} onChange={(e) => update(s.id, { ownerCharacterId: e.target.value || undefined })} className={inp} placeholder="char_jett" /></Field>
            <Field label="Slot (1-6)"><input type="number" min={1} max={6} value={s.slot ?? 0} onChange={(e) => update(s.id, { slot: num(e.target.value) || undefined })} className={inp} /></Field>
            <Field label="Attack type"><select value={s.attackType ?? 'melee'} onChange={(e) => update(s.id, { attackType: e.target.value as AttackType })} className={inp}>{ATTACK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
            <Field label="Defense type"><select value={s.defenseType ?? 'none'} onChange={(e) => update(s.id, { defenseType: e.target.value as DefenseType })} className={inp}>{DEFENSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
          </div>
          {/* Model-driven slots — the heart of Batch D. */}
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Models</div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Projectile model"><ModelPicker value={s.projectile?.modelAssetId ?? s.projectilePrefabId} onChange={(v) => update(s.id, { projectilePrefabId: v, projectile: s.projectile ? { ...s.projectile, modelAssetId: v } : { modelAssetId: v, speed: 16, lifetimeSeconds: 2.5, movement: 'linear', radius: 2 } })} /></Field>
            <Field label="Summon model"><ModelPicker value={s.summon?.modelAssetId ?? s.summonPrefabId} onChange={(v) => update(s.id, { summonPrefabId: v, summon: s.summon ? { ...s.summon, modelAssetId: v } : { modelAssetId: v, count: 1, lifetimeSeconds: 8, behavior: 'seek', attackIntervalSeconds: 1, attackDamage: 10, attackRadius: 3 } })} /></Field>
            <Field label="Terrain model"><ModelPicker value={s.terrain?.modelAssetId ?? s.modelPrefabId} onChange={(v) => update(s.id, { modelPrefabId: v, terrain: s.terrain ? { ...s.terrain, modelAssetId: v } : { modelAssetId: v, count: 1, lifetimeSeconds: 8, radius: 2.5, blocksMovement: true } })} /></Field>
            <Field label="Impact effect model"><ModelPicker value={s.impactEffectPrefabId} onChange={(v) => update(s.id, { impactEffectPrefabId: v })} /></Field>
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Hit volume</div>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Shape"><select value={hv.shape} onChange={(e) => update(s.id, { hitVolume: { ...hv, shape: e.target.value as HitVolumeShape } })} className={inp}>{HIT_SHAPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
            <Field label="Radius"><input type="number" step={0.5} value={hv.radius ?? 0} onChange={(e) => update(s.id, { hitVolume: { ...hv, radius: num(e.target.value) } })} className={inp} /></Field>
            <Field label="Length"><input type="number" step={0.5} value={hv.length ?? 0} onChange={(e) => update(s.id, { hitVolume: { ...hv, length: num(e.target.value) } })} className={inp} /></Field>
            <Field label="Width"><input type="number" step={0.5} value={hv.width ?? 0} onChange={(e) => update(s.id, { hitVolume: { ...hv, width: num(e.target.value) } })} className={inp} /></Field>
            <Field label="Angle°"><input type="number" step={5} value={hv.angleDegrees ?? 0} onChange={(e) => update(s.id, { hitVolume: { ...hv, angleDegrees: num(e.target.value) } })} className={inp} /></Field>
            <Field label="Active (s)"><input type="number" step={0.05} value={hv.activeDurationSeconds} onChange={(e) => update(s.id, { hitVolume: { ...hv, activeDurationSeconds: num(e.target.value) } })} className={inp} /></Field>
          </div>
          {dmg && (
            <>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Damage</div>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Amount"><input type="number" value={dmg.amount} onChange={(e) => update(s.id, { damageEvents: [{ ...dmg, amount: num(e.target.value) }] })} className={inp} /></Field>
                <Field label="Type"><select value={dmg.damageType} onChange={(e) => update(s.id, { damageEvents: [{ ...dmg, damageType: e.target.value as typeof dmg.damageType }] })} className={inp}>{DAMAGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
                <Field label="Tags (csv)"><input value={csv(dmg.attackTags)} onChange={(e) => update(s.id, { damageEvents: [{ ...dmg, attackTags: parseCsv(e.target.value) }] })} className={inp} /></Field>
              </div>
            </>
          )}
          <SkillTimelineEditor def={s} update={(p) => update(s.id, p)} />
          <div className="flex items-center gap-2">
            <Check label="Enabled" checked={s.enabled !== false} onChange={(v) => update(s.id, { enabled: v })} />
            <button onClick={() => castSkillById(s.id)} className="rounded bg-emerald-700 px-2 py-1 text-[11px] text-white hover:bg-emerald-600">▶ Test Cast</button>
            <span className="text-[10px] text-slate-500">(in a combat phase, near a spawned target)</span>
          </div>
          <ValidationLine res={validateSkill(s, getCombatEffect)} />
          <DetailButtons store={useEditorCombatSkillStore} id={s.id} onSel={setSel} />
        </div>
      )}
    </div>
  );
};

const EnemiesSection = () => {
  const items = useEditorEnemyStore((s) => s.items);
  const update = useEditorEnemyStore((s) => s.update);
  const [sel, setSel] = useState<string | null>(items[0]?.id ?? null);
  const e = items.find((x) => x.id === sel);
  return (
    <div className="space-y-2">
      <Rail items={items} sel={sel} onSelect={setSel} onAdd={() => { const id = useEditorEnemyStore.getState().duplicate(items[0]?.id ?? ''); if (id) setSel(id); }} label={(t) => t.name} name="Enemy" />
      {e && (
        <div className="space-y-2 rounded-lg border border-slate-800 p-2">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Name"><input value={e.name} onChange={(ev) => update(e.id, { name: ev.target.value })} className={inp} /></Field>
            <Field label="Model"><ModelPicker value={e.modelAssetId} onChange={(v) => update(e.id, { modelAssetId: v })} /></Field>
            <Field label="Max HP"><input type="number" value={e.maxHp} onChange={(ev) => update(e.id, { maxHp: num(ev.target.value) })} className={inp} /></Field>
            <Field label="Max Shield"><input type="number" value={e.maxShield ?? 0} onChange={(ev) => update(e.id, { maxShield: num(ev.target.value) || undefined })} className={inp} /></Field>
            <Field label="Move speed"><input type="number" step={0.2} value={e.moveSpeed} onChange={(ev) => update(e.id, { moveSpeed: num(ev.target.value) })} className={inp} /></Field>
            <Field label="AI"><select value={e.aiBehavior} onChange={(ev) => update(e.id, { aiBehavior: ev.target.value as EnemyAiBehavior })} className={inp}>{AI_BEHAVIORS.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
            <Field label="Aggro range"><input type="number" value={e.aggroRange} onChange={(ev) => update(e.id, { aggroRange: num(ev.target.value) })} className={inp} /></Field>
            <Field label="Attack range"><input type="number" value={e.attackRange} onChange={(ev) => update(e.id, { attackRange: num(ev.target.value) })} className={inp} /></Field>
            <Field label="Skill ids (csv)"><input value={csv(e.skillIds)} onChange={(ev) => update(e.id, { skillIds: parseCsv(ev.target.value) })} className={inp} /></Field>
            <Field label="Weakness tags (csv)"><input value={csv(e.weaknessTags)} onChange={(ev) => update(e.id, { weaknessTags: parseCsv(ev.target.value) })} className={inp} /></Field>
            <Field label="Resistance tags (csv)"><input value={csv(e.resistanceTags)} onChange={(ev) => update(e.id, { resistanceTags: parseCsv(ev.target.value) })} className={inp} /></Field>
            <Field label="Boss id (if boss)"><input value={e.bossId ?? ''} onChange={(ev) => update(e.id, { bossId: ev.target.value || undefined })} className={inp} /></Field>
            <Field label="Archetype"><select value={e.archetype ?? 'generic'} onChange={(ev) => update(e.id, { archetype: ev.target.value as typeof e.archetype })} className={inp}>{ENEMY_ARCHETYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
          </div>
          {e.archetype === 'crusher-drone' && e.charge && (
            <div className="grid grid-cols-3 gap-2 rounded border border-slate-800 p-1.5">
              <Field label="Windup (s)"><input type="number" step={0.1} value={e.charge.windupSeconds} onChange={(ev) => update(e.id, { charge: { ...e.charge!, windupSeconds: num(ev.target.value) } })} className={inp} /></Field>
              <Field label="Charge speed"><input type="number" value={e.charge.chargeSpeed} onChange={(ev) => update(e.id, { charge: { ...e.charge!, chargeSpeed: num(ev.target.value) } })} className={inp} /></Field>
              <Field label="Charge dmg"><input type="number" value={e.charge.damageAmount} onChange={(ev) => update(e.id, { charge: { ...e.charge!, damageAmount: num(ev.target.value) } })} className={inp} /></Field>
            </div>
          )}
          {e.archetype === 'pulse-turret' && e.turret && (
            <div className="grid grid-cols-3 gap-2 rounded border border-slate-800 p-1.5">
              <Field label="Rotation spd"><input type="number" step={0.1} value={e.turret.rotationSpeed} onChange={(ev) => update(e.id, { turret: { ...e.turret!, rotationSpeed: num(ev.target.value) } })} className={inp} /></Field>
              <Field label="Fire cd (s)"><input type="number" step={0.1} value={e.turret.fireCooldownSeconds} onChange={(ev) => update(e.id, { turret: { ...e.turret!, fireCooldownSeconds: num(ev.target.value) } })} className={inp} /></Field>
              <Field label="Projectile skill"><input value={e.turret.projectileSkillId} onChange={(ev) => update(e.id, { turret: { ...e.turret!, projectileSkillId: ev.target.value } })} className={inp} /></Field>
            </div>
          )}
          {e.archetype === 'shield-carrier' && e.shield && (
            <div className="grid grid-cols-3 gap-2 rounded border border-slate-800 p-1.5">
              <Field label="Arc°"><input type="number" value={e.shield.arcDegrees} onChange={(ev) => update(e.id, { shield: { ...e.shield!, arcDegrees: num(ev.target.value) } })} className={inp} /></Field>
              <Field label="Shield HP"><input type="number" value={e.shield.shieldHp} onChange={(ev) => update(e.id, { shield: { ...e.shield!, shieldHp: num(ev.target.value) } })} className={inp} /></Field>
              <Field label="Bash dmg"><input type="number" value={e.shield.bashDamage} onChange={(ev) => update(e.id, { shield: { ...e.shield!, bashDamage: num(ev.target.value) } })} className={inp} /></Field>
            </div>
          )}
          <div className="flex items-center gap-2"><Check label="Is boss" checked={e.isBoss ?? false} onChange={(v) => update(e.id, { isBoss: v })} /><ValidationLine res={validateEnemy(e)} /></div>
          <DetailButtons store={useEditorEnemyStore} id={e.id} onSel={setSel} />
        </div>
      )}
    </div>
  );
};

const SpawnGroupsSection = () => {
  const items = useEditorSpawnGroupStore((s) => s.items);
  const update = useEditorSpawnGroupStore((s) => s.update);
  const [sel, setSel] = useState<string | null>(items[0]?.id ?? null);
  const g = items.find((x) => x.id === sel);
  const enemiesCsv = (e: typeof items[number]) => e.enemies.map((x) => `${x.enemyDefinitionId}:${x.count}`).join(', ');
  return (
    <div className="space-y-2">
      <Rail items={items} sel={sel} onSelect={setSel} onAdd={() => { const id = useEditorSpawnGroupStore.getState().duplicate(items[0]?.id ?? ''); if (id) setSel(id); }} label={(t) => t.id} name="Group" />
      {g && (
        <div className="space-y-2 rounded-lg border border-slate-800 p-2">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Segment id"><input value={g.segmentId} onChange={(e) => update(g.id, { segmentId: e.target.value })} className={inp} /></Field>
            <Field label="Spawn mode"><select value={g.spawnMode} onChange={(e) => update(g.id, { spawnMode: e.target.value as typeof g.spawnMode })} className={inp}><option value="on-segment-enter">on-segment-enter</option><option value="on-condition">on-condition</option><option value="debug-only">debug-only</option></select></Field>
            <Field label="Enemies (defId:count, csv)"><input value={enemiesCsv(g)} onChange={(e) => update(g.id, { enemies: parseCsv(e.target.value).map((s) => { const [enemyDefinitionId, c] = s.split(':'); return { enemyDefinitionId, count: parseInt(c, 10) || 1 }; }) })} className={inp} /></Field>
            <Field label="Linked condition id"><input value={g.linkedZoneConditionId ?? ''} onChange={(e) => update(g.id, { linkedZoneConditionId: e.target.value || undefined })} className={inp} /></Field>
          </div>
          <Check label="Complete when all defeated" checked={g.completeWhenAllDefeated} onChange={(v) => update(g.id, { completeWhenAllDefeated: v })} />
          <ValidationLine res={validateSpawnGroup(g, (eid) => useEditorEnemyStore.getState().items.some((x) => x.id === eid))} />
          <DetailButtons store={useEditorSpawnGroupStore} id={g.id} onSel={setSel} />
        </div>
      )}
    </div>
  );
};

const BossSection = () => {
  const items = useEditorBossPhaseStore((s) => s.items);
  const update = useEditorBossPhaseStore((s) => s.update);
  const [sel, setSel] = useState<string | null>(items[0]?.id ?? null);
  const p = items.find((x) => x.id === sel);
  return (
    <div className="space-y-2">
      <Rail items={items} sel={sel} onSelect={setSel} onAdd={() => { const id = useEditorBossPhaseStore.getState().duplicate(items[0]?.id ?? ''); if (id) setSel(id); }} label={(t) => `${t.order}. ${t.name}`} name="Phase" />
      {p && (
        <div className="space-y-2 rounded-lg border border-slate-800 p-2">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Name"><input value={p.name} onChange={(e) => update(p.id, { name: e.target.value })} className={inp} /></Field>
            <Field label="Boss id"><input value={p.bossId} onChange={(e) => update(p.id, { bossId: e.target.value })} className={inp} /></Field>
            <Field label="Order"><input type="number" value={p.order} onChange={(e) => update(p.id, { order: num(e.target.value) })} className={inp} /></Field>
            <Field label="HP threshold (0-1)"><input type="number" step={0.05} value={p.hpThresholdPct} onChange={(e) => update(p.id, { hpThresholdPct: num(e.target.value) })} className={inp} /></Field>
            <Field label="Skill ids (csv)"><input value={csv(p.skillIds)} onChange={(e) => update(p.id, { skillIds: parseCsv(e.target.value) })} className={inp} /></Field>
            <Field label="Enrage speed ×"><input type="number" step={0.1} value={p.enrageMoveSpeedMult ?? 0} onChange={(e) => update(p.id, { enrageMoveSpeedMult: num(e.target.value) || undefined })} className={inp} /></Field>
          </div>
          <Field label="Minions (enemyId:count, csv)">
            <input value={(p.spawnMinions ?? []).map((m) => `${m.enemyId}:${m.count}`).join(', ')}
              onChange={(e) => update(p.id, { spawnMinions: parseCsv(e.target.value).map((s) => { const [enemyId, c] = s.split(':'); return { enemyId, count: parseInt(c, 10) || 1 }; }) })}
              className={inp} placeholder="enemy_robot_sentry:2" />
          </Field>
          <DetailButtons store={useEditorBossPhaseStore} id={p.id} onSel={setSel} />
        </div>
      )}
    </div>
  );
};

const DummySection = () => {
  const items = useEditorDamageableStore((s) => s.items);
  const update = useEditorDamageableStore((s) => s.update);
  const [sel, setSel] = useState<string | null>(items[0]?.id ?? null);
  const d = items.find((x) => x.id === sel);
  return (
    <div className="space-y-2">
      <Rail items={items} sel={sel} onSelect={setSel} onAdd={() => { const id = useEditorDamageableStore.getState().duplicate(items[0]?.id ?? ''); if (id) setSel(id); }} label={(t) => t.editorMeta?.displayName ?? t.id} name="Target" />
      {d && (
        <div className="space-y-2 rounded-lg border border-slate-800 p-2">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Max HP"><input type="number" value={d.maxHp} onChange={(e) => update(d.id, { maxHp: num(e.target.value) })} className={inp} /></Field>
            <Field label="Max Shield"><input type="number" value={d.maxShield ?? 0} onChange={(e) => update(d.id, { maxShield: num(e.target.value) || undefined })} className={inp} /></Field>
            <Field label="Armor"><select value={d.armorType ?? 'none'} onChange={(e) => update(d.id, { armorType: e.target.value as ArmorType })} className={inp}>{ARMOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
            <Field label="On HP zero"><select value={d.onHpZero} onChange={(e) => update(d.id, { onHpZero: e.target.value as OnHpZero })} className={inp}>{ON_HP_ZERO.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
            <Field label="Weakness tags (csv)"><input value={csv(d.weaknessTags)} onChange={(e) => update(d.id, { weaknessTags: parseCsv(e.target.value) })} className={inp} /></Field>
            <Field label="Resistance tags (csv)"><input value={csv(d.resistanceTags)} onChange={(e) => update(d.id, { resistanceTags: parseCsv(e.target.value) })} className={inp} /></Field>
            <Field label="Immune tags (csv)"><input value={csv(d.immuneTags)} onChange={(e) => update(d.id, { immuneTags: parseCsv(e.target.value) })} className={inp} /></Field>
          </div>
          <Check label="Shield enabled" checked={d.shieldRules?.enabled ?? false} onChange={(v) => update(d.id, { shieldRules: { enabled: v, shieldHp: d.shieldRules?.shieldHp ?? (d.maxShield ?? 50), shieldWeaknessTags: d.shieldRules?.shieldWeaknessTags ?? ['shield-break'], shieldBreakStaggerSeconds: d.shieldRules?.shieldBreakStaggerSeconds ?? 1.5 } })} />
          {d.shieldRules?.enabled && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Shield HP"><input type="number" value={d.shieldRules.shieldHp} onChange={(e) => update(d.id, { shieldRules: { ...d.shieldRules!, shieldHp: num(e.target.value) } })} className={inp} /></Field>
              <Field label="Shield weakness (csv)"><input value={csv(d.shieldRules.shieldWeaknessTags)} onChange={(e) => update(d.id, { shieldRules: { ...d.shieldRules!, shieldWeaknessTags: parseCsv(e.target.value) } })} className={inp} /></Field>
            </div>
          )}
          <ValidationLine res={validateDamageable(d)} />
          <DetailButtons store={useEditorDamageableStore} id={d.id} onSel={setSel} />
        </div>
      )}
    </div>
  );
};

const EffectsSection = () => {
  const items = useEditorCombatEffectStore((s) => s.items);
  const update = useEditorCombatEffectStore((s) => s.update);
  const [sel, setSel] = useState<string | null>(items[0]?.id ?? null);
  const e = items.find((x) => x.id === sel);
  const g = e?.geometry;
  return (
    <div className="space-y-2">
      <Rail items={items} sel={sel} onSelect={setSel} onAdd={() => { const id = useEditorCombatEffectStore.getState().duplicate(items[0]?.id ?? ''); if (id) setSel(id); }} label={(t) => t.id} name="Effect" />
      {e && (
        <div className="space-y-2 rounded-lg border border-slate-800 p-2">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Effect type"><select value={e.effectType} onChange={(ev) => update(e.id, { effectType: ev.target.value as CombatEffectType })} className={inp}>{EFFECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
            <Field label="Color"><input type="color" value={e.color ?? '#ffffff'} onChange={(ev) => update(e.id, { color: ev.target.value })} className="h-7 w-16 rounded bg-slate-800" /></Field>
            <Field label="Duration (s)"><input type="number" step={0.1} value={e.timing.durationSeconds} onChange={(ev) => update(e.id, { timing: { ...e.timing, durationSeconds: num(ev.target.value) } })} className={inp} /></Field>
            <Field label="Fade out (s)"><input type="number" step={0.05} value={e.timing.fadeOutSeconds ?? 0} onChange={(ev) => update(e.id, { timing: { ...e.timing, fadeOutSeconds: num(ev.target.value) } })} className={inp} /></Field>
          </div>
          {g && (
            <div className="grid grid-cols-3 gap-2">
              <Field label="Geometry"><select value={g.geometryType} onChange={(ev) => update(e.id, { geometry: { ...g, geometryType: ev.target.value as GeometryType } })} className={inp}>{GEO_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
              <Field label="Render"><select value={g.renderMode} onChange={(ev) => update(e.id, { geometry: { ...g, renderMode: ev.target.value as GeometryRenderMode } })} className={inp}>{RENDER_MODES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
              <Field label="Animate"><select value={g.animate} onChange={(ev) => update(e.id, { geometry: { ...g, animate: ev.target.value as GeometryAnimate } })} className={inp}>{ANIMATES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
              <Field label="Radius"><input type="number" step={0.5} value={g.dimensions.radius ?? 0} onChange={(ev) => update(e.id, { geometry: { ...g, dimensions: { ...g.dimensions, radius: num(ev.target.value) } } })} className={inp} /></Field>
              <Field label="Length"><input type="number" step={0.5} value={g.dimensions.length ?? 0} onChange={(ev) => update(e.id, { geometry: { ...g, dimensions: { ...g.dimensions, length: num(ev.target.value) } } })} className={inp} /></Field>
              <Field label="Angle°"><input type="number" step={5} value={g.dimensions.angleDegrees ?? 0} onChange={(ev) => update(e.id, { geometry: { ...g, dimensions: { ...g.dimensions, angleDegrees: num(ev.target.value) } } })} className={inp} /></Field>
            </div>
          )}
          <ValidationLine res={validateCombatEffect(e)} />
          <DetailButtons store={useEditorCombatEffectStore} id={e.id} onSel={setSel} />
        </div>
      )}
    </div>
  );
};

// Shared duplicate/delete buttons for any editor collection store.
function DetailButtons({ store, id, onSel }: { store: { getState: () => { duplicate: (id: string) => string | null; remove: (id: string) => void } }; id: string; onSel: (id: string | null) => void }) {
  return (
    <div className="flex items-center gap-1.5 border-t border-slate-800/60 pt-2">
      <button onClick={() => { const nid = store.getState().duplicate(id); if (nid) onSel(nid); }} className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700">⧉ Duplicate</button>
      <button onClick={() => { store.getState().remove(id); onSel(null); }} className="rounded bg-rose-700/20 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-700/30">🗑 Delete</button>
      <span className="ml-auto self-center text-[10px] text-slate-500">id: {id}</span>
    </div>
  );
}

export const CombatEditorTab = () => {
  const [section, setSection] = useState<Section>('Player Stats');
  return (
    <div className="space-y-3 text-xs">
      <div className="flex gap-1">
        {SECTIONS.map((s) => (
          <button key={s} onClick={() => setSection(s)} className={`rounded px-2 py-1 text-[11px] ${s === section ? 'bg-violet-600/30 text-violet-100' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{s}</button>
        ))}
      </div>
      <div className={lbl}>⚔ Combat Runtime · {section}</div>
      {section === 'Player Stats' && <StatsSection />}
      {section === 'Skills' && <SkillsSection />}
      {section === 'Dummy Targets' && <DummySection />}
      {section === 'Effects' && <EffectsSection />}
      {section === 'Enemies' && <EnemiesSection />}
      {section === 'Spawn Groups' && <SpawnGroupsSection />}
      {section === 'Boss Phases' && <BossSection />}
    </div>
  );
};
