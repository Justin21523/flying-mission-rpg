import { useEditorSpawnGroupStore } from '../../../stores/game/editorCombatStore';
import { useEliteAffixStore } from '../../../stores/game/useEliteAffixStore';
import { Field, inp, lbl, Check, csv, parseCsv } from '../../editor/editorShared';

// Wave 1 — 🧟 Enemy Wave editor: spawn groups + their optional elite-affix policy, and the affix definitions
// themselves. All editor-collections (localStorage-backed), so edits reach the spawn runtime live.
const num = (v: string) => parseFloat(v) || 0;
const DEFAULT_POLICY = { allowedAffixIds: ['shielded', 'volatile', 'swift', 'regenerating', 'vampiric'], chancePerEnemy: 0.25, maxPerEnemy: 1 };

// Wave 2 — squad roles serialize as "enemyDefId:role, …" for inline CSV-style editing.
type SquadRoles = NonNullable<NonNullable<import('../../../types/game/combat').EnemySpawnGroupDefinition['squadPolicy']>['roles']>;
const fmtRoles = (roles: SquadRoles | undefined) => (roles ?? []).map((r) => `${r.enemyDefinitionId}:${r.role}`).join(', ');
const parseRoles = (s: string): SquadRoles =>
  parseCsv(s).map((tok) => { const [id, role] = tok.split(':'); return { enemyDefinitionId: (id ?? '').trim(), role: (role ?? 'melee-swarm').trim() as SquadRoles[number]['role'] }; }).filter((r) => r.enemyDefinitionId);

export const EnemyWaveEditorTab = () => {
  const groups = useEditorSpawnGroupStore((s) => s.items);
  const updateGroup = useEditorSpawnGroupStore((s) => s.update);
  const affixes = useEliteAffixStore((s) => s.items);
  const updateAffix = useEliteAffixStore((s) => s.update);

  return (
    <div className="space-y-4 text-xs text-slate-300">
      <div>
        <div className={lbl}>Spawn Groups · {groups.length}</div>
        <div className="mt-1 space-y-1">
          {groups.map((group) => {
            const policy = group.affixPolicy;
            return (
              <div key={group.id} className="rounded border border-slate-700 p-2">
                <b>{group.id}</b>
                <div className="text-slate-400">{group.enemies.map((e) => `${e.enemyDefinitionId} x${e.count}`).join(', ')}</div>
                <div className="mt-1 flex items-center gap-2">
                  <Check label="Elite affixes" checked={!!policy} onChange={(v) => updateGroup(group.id, { affixPolicy: v ? { ...DEFAULT_POLICY } : undefined })} />
                </div>
                {policy && (
                  <div className="mt-1 grid grid-cols-3 gap-1">
                    <Field label="Allowed (csv)"><input value={csv(policy.allowedAffixIds)} onChange={(e) => updateGroup(group.id, { affixPolicy: { ...policy, allowedAffixIds: parseCsv(e.target.value) } })} className={inp} /></Field>
                    <Field label="Chance / enemy"><input type="number" step={0.05} value={policy.chancePerEnemy} onChange={(e) => updateGroup(group.id, { affixPolicy: { ...policy, chancePerEnemy: num(e.target.value) } })} className={inp} /></Field>
                    <Field label="Max / enemy"><input type="number" step={1} value={policy.maxPerEnemy} onChange={(e) => updateGroup(group.id, { affixPolicy: { ...policy, maxPerEnemy: num(e.target.value) } })} className={inp} /></Field>
                  </div>
                )}
                <div className="mt-1 flex items-center gap-2">
                  <Check label="Squad tactics" checked={!!group.squadPolicy} onChange={(v) => updateGroup(group.id, { squadPolicy: v ? { enabled: true, roles: [] } : undefined })} />
                </div>
                {group.squadPolicy && (
                  <Field label="Roles (defId:role, …)"><input value={fmtRoles(group.squadPolicy.roles)} placeholder="suppressor_node:ranged-keep-distance, aegis_buffer:healer-stay-back" onChange={(e) => updateGroup(group.id, { squadPolicy: { ...group.squadPolicy, roles: parseRoles(e.target.value) } })} className={inp} /></Field>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className={lbl}>Elite Affixes · {affixes.length}</div>
        <div className="mt-1 space-y-1">
          {affixes.map((a) => (
            <div key={a.id} className="grid grid-cols-3 gap-1 rounded border border-slate-800 p-1.5">
              <Field label="Name"><input value={a.name} onChange={(e) => updateAffix(a.id, { name: e.target.value })} className={inp} /></Field>
              <Field label="HP ×"><input type="number" step={0.05} value={a.hpMult ?? 1} onChange={(e) => updateAffix(a.id, { hpMult: num(e.target.value) })} className={inp} /></Field>
              <Field label="Speed ×"><input type="number" step={0.05} value={a.speedMult ?? 1} onChange={(e) => updateAffix(a.id, { speedMult: num(e.target.value) })} className={inp} /></Field>
              <Field label="Add shield"><input type="number" step={5} value={a.addShield ?? 0} onChange={(e) => updateAffix(a.id, { addShield: num(e.target.value) })} className={inp} /></Field>
              <Field label="Regen/sec"><input type="number" step={1} value={a.regenPerSec ?? 0} onChange={(e) => updateAffix(a.id, { regenPerSec: num(e.target.value) })} className={inp} /></Field>
              <Field label="Lifesteal"><input type="number" step={0.05} value={a.lifestealFraction ?? 0} onChange={(e) => updateAffix(a.id, { lifestealFraction: num(e.target.value) })} className={inp} /></Field>
              <Field label="Boom radius"><input type="number" step={0.5} value={a.onDeathExplosion?.radius ?? 0} onChange={(e) => updateAffix(a.id, { onDeathExplosion: { radius: num(e.target.value), damage: a.onDeathExplosion?.damage ?? 0 } })} className={inp} /></Field>
              <Field label="Boom dmg"><input type="number" step={5} value={a.onDeathExplosion?.damage ?? 0} onChange={(e) => updateAffix(a.id, { onDeathExplosion: { radius: a.onDeathExplosion?.radius ?? 0, damage: num(e.target.value) } })} className={inp} /></Field>
              <Field label="Enabled"><Check label="" checked={a.enabled !== false} onChange={(v) => updateAffix(a.id, { enabled: v })} /></Field>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
