import type { StagePolishPreset } from '../../types/stagePolishTypes';
import { SEED_STAGES } from '../campaigns/stageDefinitions';

const clearTitles: Record<string, string> = {
  stage_sunny_harbor_emergency: 'Harbor Terminal Repaired',
  stage_downtown_traffic_collapse: 'Traffic Routes Stabilized',
  stage_factory_core_breakdown: 'Factory Core Stabilized',
  stage_mountain_tunnel_rescue: 'Tunnel Survivors Rescued',
  stage_skyport_core_finale: 'Skyport Core Secured',
  stage_night_city_blackout: 'District Power Restored',
  stage_storm_coast_flood_rescue: 'Flood Evacuation Complete',
  stage_metro_rescue_labyrinth: 'Metro Crew Extracted',
  stage_aero_tower_high_rescue: 'Aero Tower Stabilized',
  stage_rescue_vanguard_finale: 'Rescue Vanguard Campaign Clear',
};

const icons = ['☀️', '🚦', '🏭', '⛰️', '🌩️', '🌃', '🌊', '🚇', '🗼', '🏁'];
const colors = ['#38bdf8', '#f59e0b', '#fb923c', '#a8a29e', '#93c5fd', '#a78bfa', '#67e8f9', '#c084fc', '#7dd3fc', '#f97316'];

export const SEED_STAGE_POLISH_PRESETS: StagePolishPreset[] = SEED_STAGES.map((stage, index) => ({
  id: `polish_${stage.id}`,
  stageId: stage.id,
  clearTitle: clearTitles[stage.id] ?? `${stage.name} Clear`,
  clearSubtitle: stage.briefing.summary,
  rewardToastTitle: `Reward unlocked: ${stage.rewardId ?? 'Stage clear'}`,
  rewardToastBody: stage.unlocksOnClear.stageIds?.length ? `Next stage unlocked: ${stage.unlocksOnClear.stageIds.join(', ')}` : 'Campaign reward saved.',
  themeIcon: icons[index] ?? '◇',
  threatSummary: stage.briefing.threatSummary ?? 'Mixed stage threats.',
  objectiveSummary: stage.briefing.objectives.join(' / '),
  stageColor: colors[index] ?? '#38bdf8',
  editorMeta: { notes: `Stage clear and select polish for ${stage.name}.` },
}));
