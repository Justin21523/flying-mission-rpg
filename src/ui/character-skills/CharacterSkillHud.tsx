import { useEditorCharacterKitStore, getKitForCharacter } from '../../stores/game/editorCharacterKitStore';
import { useCombatStore } from '../../stores/game/useCombatStore';
import { useCharacterSkillStore } from '../../stores/game/useCharacterSkillStore';
import { getCombatSkill } from '../../stores/game/editorCombatStore';
import { activeCombatantId } from '../../game/combat/CombatDirector';
import { getAbilityBySlot } from '../../stores/game/useCinematicAbilityEditorStore';
import { useAbilityPageStore, ABILITY_PAGES, PAGE_LABELS, PAGE_COUNT, ACTION_KEY_LABELS } from '../../game/character-skills/abilityPages';
import { cooldownFraction } from '../../game/combat/CooldownManager';
import { useNowMs } from '../../game/combat/useNowMs';
import { liveObstacles } from '../../stores/game/obstacleStore';

// Character skill HUD (Batch F.5 paged design) — role badges + a 4-key ability bar (4 / 5 / Z / X) for the
// active page; Ctrl cycles pages through all 11 abilities. Shows the current page + a role-aware hint.
function utilityHint(roleTypes: string[]): string | null {
  if (roleTypes.includes('repair') && liveObstacles.some((o) => o.state !== 'repaired' && o.state !== 'destroyed')) return '🔧 Repair device / break wall in range';
  if (roleTypes.includes('scanner')) return '🔍 Scan to expose weakpoints';
  if (roleTypes.includes('defense')) return '🛡 Shield blocks projectiles · cuff stuns';
  if (roleTypes.includes('speed')) return '💨 Dash to close in / rescue';
  return null;
}

export const CharacterSkillHud = () => {
  useEditorCharacterKitStore((s) => s.items); // re-render on kit edits
  const cooldowns = useCombatStore((s) => s.activeCooldowns);
  const page = useAbilityPageStore((s) => s.page);
  const combo = useCharacterSkillStore((s) => (activeCombatantId() ? s.comboStateByCharacterId[activeCombatantId()!] : undefined));
  const now = useNowMs(150);

  const charId = activeCombatantId();
  const kit = getKitForCharacter(charId);
  if (!kit) return null;

  const comboFresh = combo?.lastComboAt != null && now / 1000 - combo.lastComboAt < 1.2;
  const comboName = combo?.lastComboTriggeredId ? (kit.combos ?? []).find((c) => c.id === combo.lastComboTriggeredId)?.name : undefined;
  const hint = utilityHint(kit.roleTypes);
  const pageSlots = ABILITY_PAGES[page] ?? [];

  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-30 w-[460px] -translate-x-1/2 rounded-xl border border-slate-600/40 bg-slate-900/80 p-2 text-slate-100 shadow-lg backdrop-blur">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold" style={{ color: kit.editorMeta?.themeColor ?? '#cbd5e1' }}>{kit.displayName}</span>
        {kit.roleTypes.map((r) => (
          <span key={r} className="rounded bg-slate-700/70 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-slate-300">{r}</span>
        ))}
        <span className="ml-auto rounded bg-sky-800/70 px-1.5 py-0.5 text-[9px] text-sky-200">⟳ Ctrl · Page {page + 1}/{PAGE_COUNT} · {PAGE_LABELS[page]}</span>
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        {ACTION_KEY_LABELS.map((keyLabel, i) => {
          const slot = pageSlots[i];
          const ability = slot ? getAbilityBySlot(charId, slot) : undefined;
          if (!ability) return (
            <div key={keyLabel} className="rounded border border-dashed border-slate-700 px-2 py-1 text-[10px] text-slate-600"><b>[{keyLabel}]</b> —</div>
          );
          const id = ability.combat.skillDefinitionId;
          const sk = getCombatSkill(id);
          const frac = sk ? cooldownFraction(cooldowns, id, now, sk.cooldownSeconds) : 0;
          const ready = frac <= 0;
          const isUlt = ability.abilityCategory === 'ultimate';
          return (
            <div key={keyLabel} className={`relative overflow-hidden rounded px-2 py-1 text-[10px] ${ready ? (isUlt ? 'bg-fuchsia-800 text-white' : 'bg-slate-700 text-white') : 'bg-slate-800 text-slate-400'}`}>
              {!ready && <div className="absolute inset-0 bg-slate-900/70" style={{ width: `${frac * 100}%` }} />}
              <span className="relative"><b className={isUlt ? 'text-fuchsia-200' : 'text-sky-300'}>[{keyLabel}]</b> {ability.name}</span>
            </div>
          );
        })}
      </div>
      {hint && <div className="mt-1 text-[10px] text-amber-300/90">{hint}</div>}
      {comboFresh && comboName && <div className="mt-1 text-center text-sm font-bold text-fuchsia-300">✦ Combo! {comboName}</div>}
    </div>
  );
};
