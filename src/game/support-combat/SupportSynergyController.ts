import type { PartnerSynergyPlaceholderDefinition, SupportSynergyTrigger } from '../../types/game/supportCombat';
import { getSupportSynergies } from '../../stores/game/useSupportCombatEditorStore';
import { useSupportCombatStore } from '../../stores/game/useSupportCombatStore';
import { useSupportRuntimeStore } from '../../stores/game/supportRuntimeStore';

// Partner synergy PLACEHOLDER controller (Batch E) — detects a trigger, applies a light bonus (recorded in
// the store + a toast), cooldown-gated. NOT full cinematic fusion. Pure `detectSynergy` + a store wrapper.

export interface SynergyContext {
  nowMs: number;
  scannedEnemy?: boolean;
  shieldBroken?: boolean;
  playerLowHp?: boolean;
  zoneConditionActive?: boolean;
  lastSupportAbilityId?: string;
  primaryRecentSkillTags?: string[];
}

function triggerSatisfied(trigger: SupportSynergyTrigger, ctx: SynergyContext): boolean {
  switch (trigger) {
    case 'enemy-scanned': return !!ctx.scannedEnemy;
    case 'shield-broken': return !!ctx.shieldBroken;
    case 'player-low-hp': return !!ctx.playerLowHp;
    case 'zone-condition-active': return !!ctx.zoneConditionActive;
    case 'support-used-after-skill': return !!ctx.lastSupportAbilityId;
    case 'debug-only': return false;
    default: return false;
  }
}

export function detectSynergy(
  synergies: PartnerSynergyPlaceholderDefinition[],
  ctx: SynergyContext,
  isReady: (id: string) => boolean = () => true,
): PartnerSynergyPlaceholderDefinition | null {
  for (const s of synergies) {
    if (!isReady(s.id)) continue;
    if (!triggerSatisfied(s.triggerCondition, ctx)) continue;
    if (s.requiredSupportAbilityId && s.requiredSupportAbilityId !== ctx.lastSupportAbilityId) continue;
    if (s.requiredSkillTags && s.requiredSkillTags.length > 0) {
      const have = ctx.primaryRecentSkillTags ?? [];
      if (!s.requiredSkillTags.some((t) => have.includes(t))) continue;
    }
    return s;
  }
  return null;
}

const cooldowns = new Map<string, number>();

// Store wrapper: detect (respecting cooldown) → record + toast. Returns the fired synergy or null.
export function tryTriggerSynergy(ctx: SynergyContext): PartnerSynergyPlaceholderDefinition | null {
  const s = detectSynergy(getSupportSynergies(), ctx, (id) => ctx.nowMs >= (cooldowns.get(id) ?? 0));
  if (!s) return null;
  cooldowns.set(s.id, ctx.nowMs + s.cooldownSeconds * 1000);
  useSupportCombatStore.getState().setSynergyTriggered(s.id, ctx.nowMs);
  useSupportRuntimeStore.getState().pushToast(s.primaryCharacterId, `✦ ${s.name}`);
  return s;
}

export function resetSynergyCooldowns(): void {
  cooldowns.clear();
}
