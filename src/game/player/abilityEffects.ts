import { playerMotion } from './playerMotion';
import { useBoostStore } from '../../stores/boostStore';
import type { AbilityType } from '../../types/character';

// POLI — child-friendly (non-combat) gameplay effect for each built-in Q ability. FX are handled by
// AbilityFx (colour/particles); this applies the mechanical effect. Params are editable per character.
export interface ActiveAbility {
  type: AbilityType;
  radius: number;
  duration: number;
  strength: number;
}

let boostToken = 0;

export function applyAbility(a: ActiveAbility): void {
  switch (a.type) {
    case 'speed_boost': {
      // Temporary self speed buff (strength = multiplier).
      const mult = a.strength > 1 ? a.strength : 1.8;
      playerMotion.speedMult = mult;
      const token = ++boostToken;
      window.setTimeout(() => { if (boostToken === token) playerMotion.speedMult = 1; }, Math.max(500, a.duration * 1000));
      break;
    }
    case 'heal_aura':
      // Refill some of the boost meter (a helpful "recharge").
      useBoostStore.getState().addMeter(a.strength > 0 ? a.strength : 25);
      break;
    case 'water_spray':
    case 'wind_gust':
      // Sweep nearby pickups toward the player (collect helpers). Boost store handles the radius pull.
      useBoostStore.getState().attractPickups(a.radius);
      break;
    case 'scan_pulse':
      // Briefly reveal nearby pickups/incidents on the radar.
      useBoostStore.getState().pulseScan(a.duration);
      break;
  }
}
