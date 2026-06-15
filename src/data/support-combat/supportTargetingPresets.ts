import type { SupportTargetingDefinition } from '../../types/game/supportCombat';

// Reusable targeting presets for the Edit-Mode dropdowns + ability authoring (Batch E). Abilities embed
// their own targeting, but the editor offers these as quick starting points.
export const SUPPORT_TARGETING_PRESETS: Record<string, SupportTargetingDefinition> = {
  'enemy-group-burst': { targetType: 'enemy-group', rangeShape: 'sphere', maxRange: 30, radius: 6, targetPriority: 'highest-threat' },
  'single-shielded': { targetType: 'enemy', rangeShape: 'single', maxRange: 16, targetPriority: 'shielded' },
  'device-objective': { targetType: 'device', rangeShape: 'single', maxRange: 14, targetPriority: 'objective-linked' },
  'scan-cone': { targetType: 'enemy', rangeShape: 'cone', maxRange: 18, radius: 11, angleDegrees: 70, targetPriority: 'shielded' },
  'protect-player': { targetType: 'player', rangeShape: 'sphere', maxRange: 16, radius: 5 },
  'decoy-area': { targetType: 'area', rangeShape: 'sphere', maxRange: 16, radius: 8 },
};
