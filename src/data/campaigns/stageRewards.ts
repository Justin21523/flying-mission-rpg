import type { StageRewardDefinition } from '../../types/stageRewardTypes';

export const SEED_STAGE_REWARDS: StageRewardDefinition[] = [
  { id: 'reward_stage_1', name: 'Basic Support Charge Upgrade', description: 'Support charge capacity increased for the campaign.', coins: 100, score: 500, unlockStageIds: ['stage_downtown_traffic_collapse'], supportAbilityIds: ['support_charge_basic'] },
  { id: 'reward_stage_2', name: 'Shield Support Enhancement', description: 'Paul-style shield support holds danger zones longer.', coins: 140, score: 700, unlockStageIds: ['stage_factory_core_breakdown'], supportAbilityIds: ['support_shield_paul'] },
  { id: 'reward_stage_3', name: 'Repair Efficiency Upgrade', description: 'Repair actions and support repair become more efficient.', coins: 180, score: 850, unlockStageIds: ['stage_mountain_tunnel_rescue'], abilityIds: ['repair-beam'] },
  { id: 'reward_stage_4', name: 'Heavy-Break Damage Upgrade', description: 'Heavy-break skills are highlighted for armored obstacles.', coins: 220, score: 1000, unlockStageIds: ['stage_skyport_core_finale'], abilityIds: ['heavy-break-boost'], characterIds: ['char_todd'] },
  { id: 'reward_stage_5', name: 'Ultimate Charge Upgrade', description: 'First boss clear unlocks the next campaign arc and ultimate charge tuning.', coins: 300, score: 1500, unlockStageIds: ['stage_night_city_blackout'], abilityIds: ['ultimate-cinematic'], supportAbilityIds: ['support_scan_chase'] },
  { id: 'reward_stage_6', name: 'Scan Duration Upgrade', description: 'Scan reveals hazards for longer in dark stages.', coins: 220, score: 1100, unlockStageIds: ['stage_storm_coast_flood_rescue'], abilityIds: ['scan-duration-upgrade'] },
  { id: 'reward_stage_7', name: 'Rescue Speed Upgrade', description: 'Evacuation and rescue marker interactions resolve faster.', coins: 240, score: 1200, unlockStageIds: ['stage_metro_rescue_labyrinth'], abilityIds: ['rescue-speed-upgrade'] },
  { id: 'reward_stage_8', name: 'Energy Capacity Upgrade', description: 'Energy capacity increases for late campaign multi-wave stages.', coins: 270, score: 1350, unlockStageIds: ['stage_aero_tower_high_rescue'], abilityIds: ['energy-capacity-upgrade'] },
  { id: 'reward_stage_9', name: 'Support Cooldown Reduction', description: 'Support calls recover faster before the finale.', coins: 300, score: 1500, unlockStageIds: ['stage_rescue_vanguard_finale'], supportAbilityIds: ['support-cooldown-reduction'] },
  { id: 'reward_stage_10', name: 'Rescue Vanguard Campaign Clear Badge', description: 'Campaign complete badge for the vertical slice.', coins: 500, score: 2500, abilityIds: ['campaign-clear-badge'] },
];
