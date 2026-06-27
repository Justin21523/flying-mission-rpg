import { useSkillUpgradeCurveStore } from '../../../stores/game/useSkillUpgradeCurveStore';
import { useHangarUpgradeDefStore } from '../../../stores/game/useHangarUpgradeDefStore';
import { useRunBuffDefStore } from '../../../stores/game/useRunBuffDefStore';
import { useRunConfigStore } from '../../../stores/game/useRunConfigStore';
import { useStatusRuleStore } from '../../../stores/game/useStatusRuleStore';
import { useElementReactionStore } from '../../../stores/game/useElementReactionStore';
import { useEquipmentModDefStore } from '../../../stores/game/useEquipmentModDefStore';
import { EQUIPMENT_MOD_CATEGORIES, type EquipmentModDefinition } from '../../../types/game/equipmentMod';
import { useRoomConfigStore } from '../../../stores/game/useRoomConfigStore';
import type { RoomConfigDefinition } from '../../../data/progression/roomConfig';
import type { RoomId } from '../../../stores/game/useArenaRunStore';
import type { StatusEffectId } from '../../../data/combat/statusRules';
import { csv, parseCsv } from '../../editor/editorShared';
import { HANGAR_CATEGORIES, type HangarUpgradeDefinition } from '../../../types/game/hangarUpgrade';
import { RUN_BUFF_CATEGORIES, type RunBuffDefinition } from '../../../data/progression/runBuffs';
import type { RunConfig } from '../../../data/progression/runConfig';
import { Field, inp, lbl, Check } from '../../editor/editorShared';

// Batch L/N — ⬆ Progression editor: skill-upgrade curve + Hangar nodes + arena run-buffs + run config. All
// editor-collections (localStorage-backed), so edits are restorable and reach the runtime resolvers live.
const num = (v: string) => parseFloat(v) || 0;

export const ProgressionEditorTab = () => {
  const curve = useSkillUpgradeCurveStore((s) => [...s.items].sort((a, b) => a.level - b.level));
  const updateCurve = useSkillUpgradeCurveStore((s) => s.update);
  const defs = useHangarUpgradeDefStore((s) => s.items);
  const updateDef = useHangarUpgradeDefStore((s) => s.update);
  const buffs = useRunBuffDefStore((s) => s.items);
  const updateBuff = useRunBuffDefStore((s) => s.update);
  const runCfg = useRunConfigStore((s) => s.items.find((c) => c.id === 'run_config'));
  const updateRunCfg = useRunConfigStore((s) => s.update);
  const statusRules = useStatusRuleStore((s) => s.items);
  const updateStatusRule = useStatusRuleStore((s) => s.update);
  const reactions = useElementReactionStore((s) => s.items);
  const updateReaction = useElementReactionStore((s) => s.update);
  const mods = useEquipmentModDefStore((s) => s.items);
  const updateMod = useEquipmentModDefStore((s) => s.update);
  const room = useRoomConfigStore((s) => s.items.find((c) => c.id === 'room_config'));
  const updateRoom = useRoomConfigStore((s) => s.update);
  const patchRoom = (patch: Partial<RoomConfigDefinition>) => { if (room) updateRoom(room.id, patch); };
  const STATUS_OPTS: StatusEffectId[] = ['burning', 'frozen', 'shocked', 'armor-broken'];
  const patchMode = (mode: 'endless' | 'roguelite', patch: Partial<RunConfig['endless']>) => {
    if (runCfg) updateRunCfg(runCfg.id, { [mode]: { ...runCfg[mode], ...patch } } as Partial<RunConfig>);
  };

  return (
    <div className="space-y-4 text-xs">
      <div>
        <div className={lbl}>Skill Upgrade Curve · {curve.length} levels</div>
        <div className="mt-1 space-y-1">
          {curve.map((c) => (
            <div key={c.id} className="grid grid-cols-5 gap-1 rounded border border-slate-800 p-1.5">
              <Field label={`Lv ${c.level} dmg×`}><input type="number" step={0.01} value={c.damageMult} onChange={(e) => updateCurve(c.id, { damageMult: num(e.target.value) })} className={inp} /></Field>
              <Field label="cd×"><input type="number" step={0.01} value={c.cooldownMult} onChange={(e) => updateCurve(c.id, { cooldownMult: num(e.target.value) })} className={inp} /></Field>
              <Field label="energy×"><input type="number" step={0.01} value={c.energyMult} onChange={(e) => updateCurve(c.id, { energyMult: num(e.target.value) })} className={inp} /></Field>
              <Field label="cost"><input type="number" step={1} value={c.costPoints} onChange={(e) => updateCurve(c.id, { costPoints: num(e.target.value) })} className={inp} /></Field>
              <Field label="level"><input type="number" step={1} value={c.level} onChange={(e) => updateCurve(c.id, { level: num(e.target.value) })} className={inp} /></Field>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className={lbl}>Hangar Upgrades · {defs.length} nodes</div>
        <div className="mt-1 space-y-1">
          {defs.map((d) => (
            <div key={d.id} className="grid grid-cols-2 gap-1 rounded border border-slate-800 p-1.5">
              <Field label="Name"><input value={d.name} onChange={(e) => updateDef(d.id, { name: e.target.value })} className={inp} /></Field>
              <Field label="Category">
                <select value={d.category} onChange={(e) => updateDef(d.id, { category: e.target.value as HangarUpgradeDefinition['category'] })} className={inp}>
                  {HANGAR_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </Field>
              <Field label="Max level"><input type="number" step={1} value={d.maxLevel} onChange={(e) => updateDef(d.id, { maxLevel: num(e.target.value) })} className={inp} /></Field>
              <Field label="Cost / level"><input type="number" step={10} value={d.perLevel.cost} onChange={(e) => updateDef(d.id, { perLevel: { ...d.perLevel, cost: num(e.target.value) } })} className={inp} /></Field>
              <Field label="Value / level"><input type="number" step={0.01} value={d.perLevel.value} onChange={(e) => updateDef(d.id, { perLevel: { ...d.perLevel, value: num(e.target.value) } })} className={inp} /></Field>
              <Field label="Description"><input value={d.description ?? ''} onChange={(e) => updateDef(d.id, { description: e.target.value })} className={inp} /></Field>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className={lbl}>Arena Run Buffs · {buffs.length}</div>
        <div className="mt-1 space-y-1">
          {buffs.map((b) => (
            <div key={b.id} className="grid grid-cols-2 gap-1 rounded border border-slate-800 p-1.5">
              <Field label="Name"><input value={b.name} onChange={(e) => updateBuff(b.id, { name: e.target.value })} className={inp} /></Field>
              <Field label="Category">
                <select value={b.category} onChange={(e) => updateBuff(b.id, { category: e.target.value as RunBuffDefinition['category'] })} className={inp}>
                  {RUN_BUFF_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Value"><input type="number" step={0.01} value={b.value} onChange={(e) => updateBuff(b.id, { value: num(e.target.value) })} className={inp} /></Field>
              <Field label="Enabled"><Check label="" checked={b.enabled !== false} onChange={(v) => updateBuff(b.id, { enabled: v })} /></Field>
              <Field label="Description"><input value={b.description} onChange={(e) => updateBuff(b.id, { description: e.target.value })} className={inp} /></Field>
            </div>
          ))}
        </div>
      </div>

      {runCfg && (
        <div>
          <div className={lbl}>Arena Run Config</div>
          <div className="mt-1 grid grid-cols-2 gap-1 rounded border border-slate-800 p-1.5">
            <Field label="Starting lives"><input type="number" step={1} value={runCfg.startingLives} onChange={(e) => updateRunCfg(runCfg.id, { startingLives: num(e.target.value) })} className={inp} /></Field>
            <Field label="Revive cost (coins)"><input type="number" step={10} value={runCfg.reviveCost} onChange={(e) => updateRunCfg(runCfg.id, { reviveCost: num(e.target.value) })} className={inp} /></Field>
            <Field label="Endless · boss every N"><input type="number" step={1} value={runCfg.endless.bossEveryN} onChange={(e) => patchMode('endless', { bossEveryN: num(e.target.value) })} className={inp} /></Field>
            <Field label="Endless · HP scale/round"><input type="number" step={0.01} value={runCfg.endless.hpScalePerRound} onChange={(e) => patchMode('endless', { hpScalePerRound: num(e.target.value) })} className={inp} /></Field>
            <Field label="Endless · dmg scale/round"><input type="number" step={0.01} value={runCfg.endless.dmgScalePerRound ?? 0} onChange={(e) => patchMode('endless', { dmgScalePerRound: num(e.target.value) })} className={inp} /></Field>
            <Field label="Roguelite · dmg scale/round"><input type="number" step={0.01} value={runCfg.roguelite.dmgScalePerRound ?? 0} onChange={(e) => patchMode('roguelite', { dmgScalePerRound: num(e.target.value) })} className={inp} /></Field>
            <Field label="Roguelite · total rounds"><input type="number" step={1} value={runCfg.roguelite.totalRounds ?? 0} onChange={(e) => patchMode('roguelite', { totalRounds: num(e.target.value) })} className={inp} /></Field>
            <Field label="Roguelite · boss every N"><input type="number" step={1} value={runCfg.roguelite.bossEveryN} onChange={(e) => patchMode('roguelite', { bossEveryN: num(e.target.value) })} className={inp} /></Field>
          </div>
        </div>
      )}

      <div>
        <div className={lbl}>Status Effect Rules · {statusRules.length}</div>
        <div className="mt-1 space-y-1">
          {statusRules.map((r) => (
            <div key={r.id} className="grid grid-cols-2 gap-1 rounded border border-slate-800 p-1.5">
              <Field label="Effect"><input value={r.effect} disabled className={inp + ' opacity-70'} /></Field>
              <Field label="Enabled"><Check label="" checked={r.enabled !== false} onChange={(v) => updateStatusRule(r.id, { enabled: v })} /></Field>
              <Field label="Damage types (csv)"><input value={csv(r.damageTypes)} onChange={(e) => updateStatusRule(r.id, { damageTypes: parseCsv(e.target.value) })} className={inp} /></Field>
              <Field label="Tags (csv)"><input value={csv(r.tags)} onChange={(e) => updateStatusRule(r.id, { tags: parseCsv(e.target.value) })} className={inp} /></Field>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className={lbl}>Element Reactions · {reactions.length}</div>
        <div className="mt-1 space-y-1">
          {reactions.map((r) => (
            <div key={r.id} className="grid grid-cols-3 gap-1 rounded border border-slate-800 p-1.5">
              <Field label="Reaction"><input value={r.reaction} disabled className={inp + ' opacity-70'} /></Field>
              <Field label="Primary status">
                <select value={r.primaryStatus} onChange={(e) => updateReaction(r.id, { primaryStatus: e.target.value as StatusEffectId })} className={inp}>
                  {STATUS_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Trigger status">
                <select value={r.triggerStatus} onChange={(e) => updateReaction(r.id, { triggerStatus: e.target.value as StatusEffectId })} className={inp}>
                  {STATUS_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Bonus dmg"><input type="number" step={1} value={r.bonusDamage} onChange={(e) => updateReaction(r.id, { bonusDamage: num(e.target.value) })} className={inp} /></Field>
              <Field label="AoE radius"><input type="number" step={0.5} value={r.aoeRadius ?? 0} onChange={(e) => updateReaction(r.id, { aoeRadius: num(e.target.value) })} className={inp} /></Field>
              <Field label="Cooldown ms"><input type="number" step={50} value={r.cooldownMs ?? 600} onChange={(e) => updateReaction(r.id, { cooldownMs: num(e.target.value) })} className={inp} /></Field>
              <Field label="Consumes primary"><Check label="" checked={r.consumesPrimary !== false} onChange={(v) => updateReaction(r.id, { consumesPrimary: v })} /></Field>
              <Field label="VFX id"><input value={r.vfxEffectId ?? ''} onChange={(e) => updateReaction(r.id, { vfxEffectId: e.target.value })} className={inp} /></Field>
              <Field label="Enabled"><Check label="" checked={r.enabled !== false} onChange={(v) => updateReaction(r.id, { enabled: v })} /></Field>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className={lbl}>Equipment Mods · {mods.length}</div>
        <div className="mt-1 space-y-1">
          {mods.map((m) => (
            <div key={m.id} className="grid grid-cols-2 gap-1 rounded border border-slate-800 p-1.5">
              <Field label="Name"><input value={m.name} onChange={(e) => updateMod(m.id, { name: e.target.value })} className={inp} /></Field>
              <Field label="Category">
                <select value={m.category} onChange={(e) => updateMod(m.id, { category: e.target.value as EquipmentModDefinition['category'] })} className={inp}>
                  {EQUIPMENT_MOD_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Value"><input type="number" step={0.01} value={m.value} onChange={(e) => updateMod(m.id, { value: num(e.target.value) })} className={inp} /></Field>
              <Field label="Enabled"><Check label="" checked={m.enabled !== false} onChange={(v) => updateMod(m.id, { enabled: v })} /></Field>
              <Field label="Description"><input value={m.description} onChange={(e) => updateMod(m.id, { description: e.target.value })} className={inp} /></Field>
            </div>
          ))}
        </div>
      </div>

      {room && (
        <div>
          <div className={lbl}>Roguelite Rooms</div>
          <div className="mt-1 grid grid-cols-2 gap-1 rounded border border-slate-800 p-1.5">
            <Field label="Room pool (csv)"><input value={csv(room.roomPool)} onChange={(e) => patchRoom({ roomPool: parseCsv(e.target.value) as RoomId[] })} className={inp} placeholder="boon, boon, shop, rest, gamble, elite" /></Field>
            <Field label="Shop cost"><input type="number" step={10} value={room.shopCost} onChange={(e) => patchRoom({ shopCost: num(e.target.value) })} className={inp} /></Field>
            <Field label="Shop offers"><input type="number" step={1} value={room.shopOfferCount} onChange={(e) => patchRoom({ shopOfferCount: num(e.target.value) })} className={inp} /></Field>
            <Field label="Rest heal frac"><input type="number" step={0.1} value={room.restHealFraction} onChange={(e) => patchRoom({ restHealFraction: num(e.target.value) })} className={inp} /></Field>
            <Field label="Gamble stake"><input type="number" step={10} value={room.gambleStake} onChange={(e) => patchRoom({ gambleStake: num(e.target.value) })} className={inp} /></Field>
            <Field label="Gamble win %"><input type="number" step={0.05} value={room.gambleWinChance} onChange={(e) => patchRoom({ gambleWinChance: num(e.target.value) })} className={inp} /></Field>
            <Field label="Gamble payout ×"><input type="number" step={0.1} value={room.gambleWinMultiplier} onChange={(e) => patchRoom({ gambleWinMultiplier: num(e.target.value) })} className={inp} /></Field>
            <Field label="Elite reward coins"><input type="number" step={10} value={room.eliteRewardCoins} onChange={(e) => patchRoom({ eliteRewardCoins: num(e.target.value) })} className={inp} /></Field>
          </div>
        </div>
      )}
    </div>
  );
};
