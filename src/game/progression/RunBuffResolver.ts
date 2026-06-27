import { useRunBuffStore } from '../../stores/game/useRunBuffStore';
import { getRunBuffDef } from '../../stores/game/useRunBuffDefStore';

// Batch N — aggregate the player's picked run buffs into combat MULTIPLIERS applied at skill-cast time
// (damage/cooldown/energy). Stat buffs (maxHp/maxEnergy/healFull) are applied live when picked (in RunDirector),
// so they're not part of this resolver. Mirrors getSkillMultipliers / getHangarBonuses.
export interface RunBuffMultipliers { damageMult: number; cooldownMult: number; energyMult: number }
const NEUTRAL: RunBuffMultipliers = { damageMult: 1, cooldownMult: 1, energyMult: 1 };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function getRunBuffMultipliers(): RunBuffMultipliers {
  const ids = useRunBuffStore.getState().selectedBuffIds;
  if (ids.length === 0) return NEUTRAL;
  let dmg = 0, cd = 0, en = 0;
  for (const id of ids) {
    const def = getRunBuffDef(id);
    if (!def) continue;
    if (def.category === 'damage') dmg += def.value;
    else if (def.category === 'cooldown') cd += def.value;
    else if (def.category === 'energy') en += def.value;
  }
  return {
    damageMult: 1 + dmg,
    cooldownMult: clamp(1 - cd, 0.2, 1),
    energyMult: clamp(1 - en, 0.2, 1),
  };
}
