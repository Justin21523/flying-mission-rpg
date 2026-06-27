import type { BossDemoProfile } from '../../types/bossDemoTypes';

export const BOSS_DEMO_PROFILES: BossDemoProfile[] = [
  {
    id: 'demo_harbor_core_sentinel',
    bossId: 'harbor_core_sentinel',
    stageId: 'stage_skyport_core_finale',
    title: 'Skyport Core Sentinel Demo',
    recommendedCharacterIds: ['char_jett', 'char_chase', 'char_paul'],
    recommendedSupportIds: ['char_chase', 'char_paul', 'char_donnie'],
    phaseOrder: ['phase_harbor_p1', 'phase_harbor_p2', 'phase_harbor_p3'],
    phaseHints: [
      {
        phaseId: 'phase_harbor_p1',
        objective: 'Scan or break the shield, expose the Shield Core, then focus the weakpoint.',
        counterplay: ['Scan', 'Shield Break', 'Precision Hit'],
        recordingBeat: 'Show weakpoint reveal and shield-break feedback.',
      },
      {
        phaseId: 'phase_harbor_p2',
        objective: 'Clear the summoned minions before the shockwave pressure stacks up.',
        counterplay: ['AOE', 'Support Shield', 'Target Adds'],
        recordingBeat: 'Show boss add wave, objective clarity and support use.',
      },
      {
        phaseId: 'phase_harbor_p3',
        objective: 'Dodge or shield the sweep beam, then destroy the Overload Core.',
        counterplay: ['Shield', 'Dodge', 'Ultimate'],
        recordingBeat: 'Show final weakpoint burst and stage clear setup.',
      },
    ],
    attackHints: [
      { patternType: 'targeted-projectile', label: 'Incoming Barrage', counterplay: 'Move sideways or block with shield support.' },
      { patternType: 'shield-pulse', label: 'Shield Pulse', counterplay: 'Back out, then break the shield window.' },
      { patternType: 'summon-wave', label: 'Summoning Adds', counterplay: 'Clear minions before returning to the core.' },
      { patternType: 'ground-shockwave', label: 'Ground Shockwave', counterplay: 'Leave the ring or guard through it.' },
      { patternType: 'sweep-beam', label: 'Sweep Beam', counterplay: 'Dodge across the beam or use shield support.' },
      { patternType: 'charge', label: 'Charge', counterplay: 'Sidestep the line and punish recovery.' },
      { patternType: 'arena-hazard', label: 'Arena Hazard', counterplay: 'Move to the safe lane before attacking.' },
      { patternType: 'future-multi-part-attack', label: 'Boss Combo', counterplay: 'Defend first, counterattack after the final hit.' },
    ],
    acceptanceText: 'Boss HUD shows phase objective, weakpoint state and attack counterplay during the storm skyport finale.',
  },
];

export function getBossDemoProfileForBoss(bossId: string): BossDemoProfile | undefined {
  return BOSS_DEMO_PROFILES.find((profile) => profile.bossId === bossId);
}

export function getBossDemoProfileForStage(stageId: string): BossDemoProfile | undefined {
  return BOSS_DEMO_PROFILES.find((profile) => profile.stageId === stageId);
}
