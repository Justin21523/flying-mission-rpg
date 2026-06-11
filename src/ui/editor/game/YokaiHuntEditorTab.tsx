import { nanoid } from 'nanoid';
import { useEditorAeroYokaiStore } from '../../../stores/game/editorAeroYokaiStore';
import { useHuntStore, startDestinationHunt } from '../../../stores/game/huntStore';
import { YOKAI_BEHAVIORS, YOKAI_BEHAVIOR_LABEL } from '../../../types/yokai';
import type { YokaiType } from '../../../types/yokai';
import type { HuntConfig } from '../../../types/game/hunt';
import { Field, lbl, Check } from '../editorShared';
import { ModelPicker } from '../ModelPicker';
import { CollectionEditor, TextRow, NumRow, SelectRow, ColorRow } from './CollectionEditor';

const makeNew = (): YokaiType => ({
  id: `yk_${nanoid(6)}`, name: 'New Sprite', color: '#a855f7', behavior: 'chaser', modelAssetId: '', elite: false,
  hp: 50, moveSpeed: 3, aggroRange: 12, attackRange: 1.8, attackRate: 1.5, attackDamage: 6, fleeHpPct: 0.2, enabled: true,
});

// Hunt config — the destination action mini-game settings (length / spawn / score / auto director).
const HuntConfigPanel = () => {
  const config = useHuntStore((s) => s.config);
  const active = useHuntStore((s) => s.active);
  const set = (p: Partial<HuntConfig>) => useHuntStore.getState().setConfig(p);
  return (
    <div className="rounded border border-fuchsia-700/40 bg-fuchsia-950/10 p-2">
      <div className="mb-1 flex items-center justify-between">
        <div className={lbl}>Hunt config</div>
        <button onClick={() => (active ? useHuntStore.getState().stop() : startDestinationHunt())} className="rounded bg-fuchsia-700/40 px-2 py-0.5 text-[11px] text-fuchsia-100 hover:bg-fuchsia-700/60">{active ? '⏹ Stop hunt' : '▶ Test hunt (play)'}</button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <NumRow label="Duration s" value={config.durationSec} step={5} min={5} onChange={(v) => set({ durationSec: v })} />
        <NumRow label="Spawn every s" value={config.spawnIntervalSec} step={0.1} min={0.12} onChange={(v) => set({ spawnIntervalSec: v })} />
        <NumRow label="Max active" value={config.maxActive} step={2} min={4} onChange={(v) => set({ maxActive: v })} />
        <NumRow label="Score normal" value={config.scoreNormal} step={1} min={0} onChange={(v) => set({ scoreNormal: v })} />
        <NumRow label="Score elite" value={config.scoreElite} step={1} min={0} onChange={(v) => set({ scoreElite: v })} />
      </div>
      <div className="mt-1 rounded bg-slate-900/50 p-1.5">
        <Check label="Auto director (randomly start hunts at the destination)" checked={config.autoEnabled} onChange={(v) => set({ autoEnabled: v })} />
        {config.autoEnabled && (
          <div className="mt-1 grid grid-cols-2 gap-1.5">
            <NumRow label="Roll every s" value={config.autoIntervalSec} step={1} min={2} onChange={(v) => set({ autoIntervalSec: v })} />
            <NumRow label="Chance (0..1)" value={config.autoChance} step={0.05} min={0} max={1} onChange={(v) => set({ autoChance: v })} />
          </div>
        )}
      </div>
      <p className="mt-1 text-[10px] text-slate-500">Triggers: NPC/dialogue effect “startHunt”, a mission objective of kind “hunt”, or the auto director. Supers (keys 1–6) damage the yokai.</p>
    </div>
  );
};

// 👹 Yokai / Hunt — the destination hunt mini-game: editable yokai roster (AI + combat stats) + hunt config.
export const YokaiHuntEditorTab = () => (
  <div className="space-y-2 text-xs">
    <HuntConfigPanel />
    <CollectionEditor<YokaiType>
      title="Yokai types"
      store={useEditorAeroYokaiStore}
      makeNew={makeNew}
      getLabel={(y) => `${y.name}${y.elite ? ' ★' : ''}${y.enabled ? '' : ' (off)'}`}
      renderFields={(y, update) => (
        <>
          <div className="grid grid-cols-2 gap-1.5">
            <TextRow label="Name" value={y.name} onChange={(v) => update({ name: v })} />
            <ColorRow label="Colour" value={y.color} onChange={(v) => update({ color: v })} />
          </div>
          <SelectRow label="Behavior" value={y.behavior} options={YOKAI_BEHAVIORS.map((b) => ({ value: b, label: YOKAI_BEHAVIOR_LABEL[b] }))} onChange={(v) => update({ behavior: v as YokaiType['behavior'] })} />
          <Field label="Model (empty = random yokai model)"><ModelPicker value={y.modelAssetId || undefined} onChange={(v) => update({ modelAssetId: v ?? '' })} noneLabel="(random)" /></Field>
          <div className="grid grid-cols-3 gap-1.5">
            <NumRow label="HP" value={y.hp} step={5} min={1} onChange={(v) => update({ hp: v })} />
            <NumRow label="Move speed" value={y.moveSpeed} step={0.2} min={0} onChange={(v) => update({ moveSpeed: v })} />
            <NumRow label="Aggro range" value={y.aggroRange} step={1} min={0} onChange={(v) => update({ aggroRange: v })} />
            <NumRow label="Attack range" value={y.attackRange} step={0.2} min={0} onChange={(v) => update({ attackRange: v })} />
            <NumRow label="Attack rate s" value={y.attackRate} step={0.1} min={0.1} onChange={(v) => update({ attackRate: v })} />
            <NumRow label="Attack dmg" value={y.attackDamage} step={1} min={0} onChange={(v) => update({ attackDamage: v })} />
            <NumRow label="Flee hp %" value={y.fleeHpPct} step={0.05} min={0} max={1} onChange={(v) => update({ fleeHpPct: v })} />
          </div>
          <div className="flex items-center gap-3">
            <Check label="Elite (tougher, worth more)" checked={y.elite} onChange={(v) => update({ elite: v })} />
            <Check label="Enabled (spawns)" checked={y.enabled} onChange={(v) => update({ enabled: v })} />
          </div>
        </>
      )}
    />
  </div>
);
