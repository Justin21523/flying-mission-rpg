import { useEquipmentModStore } from '../../stores/game/useEquipmentModStore';
import { getEquipmentModDef } from '../../stores/game/useEquipmentModDefStore';

// Wave 3 — aggregate a character's equipped mods into cast-time multipliers (mirrors RunBuffResolver). Plugged
// into CharacterSkillKitDirector alongside skill-upgrade + run-buff multipliers (all multiply together).
export interface EquipmentModMultipliers { damageMult: number; cooldownMult: number; energyMult: number }

const NEUTRAL: EquipmentModMultipliers = { damageMult: 1, cooldownMult: 1, energyMult: 1 };
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function getEquipmentModMultipliers(characterId: string | undefined): EquipmentModMultipliers {
  if (!characterId) return NEUTRAL;
  const ids = useEquipmentModStore.getState().getEquipped(characterId);
  if (ids.length === 0) return NEUTRAL;
  let dmg = 0, cd = 0, en = 0;
  for (const id of ids) {
    const def = getEquipmentModDef(id);
    if (!def || def.enabled === false) continue;
    if (def.category === 'damage') dmg += def.value;
    else if (def.category === 'cooldown') cd += def.value;
    else if (def.category === 'energy') en += def.value;
  }
  return { damageMult: 1 + dmg, cooldownMult: clamp(1 - cd, 0.2, 1), energyMult: clamp(1 - en, 0.2, 1) };
}
