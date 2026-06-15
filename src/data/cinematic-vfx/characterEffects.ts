import type { CinematicEffectDefinition, CinematicEffectFamily, CinematicEffectLayerDefinition } from '../../types/cinematicVfxTypes';
import type { AbilityCategory } from '../../types/abilityArsenalTypes';
import { signaturePieces } from './signatureEffectLibrary';
import { camLayer } from './cinematicVfxBuilders';
import { CAMERA_PRESETS } from './cameraFeedbackPresets';
import { getStyleProfile } from './characterVfxStyleProfiles';
import { isShowcaseAbility } from './showcaseAbilities';

// Hand-authored per-ability effect composition (Batch F.6) — each ability composes its character's SIGNATURE
// pieces (model/geometry/physics-driven) so every effect reads as that hero, not a generic generator. 24
// showcase abilities get richer stacks (score >= 85); the rest are still character-distinct (score >= 65).

const FAMILY: Record<string, CinematicEffectFamily> = {
  char_jett: 'speed', char_jerome: 'dance', char_paul: 'police', char_donnie: 'engineering',
  char_todd: 'drill', char_flip: 'sport', char_bello: 'wild', char_chase: 'stealth',
};

// characterId → abilityKey → signature piece keys (the visual recipe per ability).
const MAPS: Record<string, Record<string, string[]>> = {
  char_jett: {
    dash_slash: ['afterimageBurst', 'thrusterStreak'], rescue_rush: ['speedSplineRoute', 'rescueLockMarker', 'afterimageBurst', 'windTunnelFog'],
    courier_drop: ['speedSplineRoute', 'thrusterStreak'], cyclone: ['afterimageBurst', 'windTunnelFog', 'speedSplineRoute', 'thrusterStreak'],
    tailwind: ['speedSplineRoute', 'windTunnelFog'], redline_combo: ['afterimageBurst', 'thrusterStreak', 'speedSplineRoute'],
    afterimage: ['afterimageBurst', 'windTunnelFog'], guard_drift: ['speedSplineRoute', 'windTunnelFog'], rescue_shield: ['rescueLockMarker', 'windTunnelFog'],
    overdrive: ['speedSplineRoute', 'afterimageBurst', 'rescueLockMarker', 'thrusterStreak', 'windTunnelFog'], meteor: ['speedSplineRoute', 'thrusterStreak', 'windTunnelFog'],
  },
  char_jerome: {
    dance_combo: ['stageRing', 'sparkleMotes'], spin_vortex: ['stageRing', 'dancerAfterimage'], spotlight_dive: ['spotlightCone', 'stageRing', 'sparkleMotes', 'rhythmPulseBar'],
    rhythm_pulse: ['rhythmPulseBar', 'stageRing'], waltz_sweep: ['spotlightCone', 'sparkleMotes'], encore_spiral: ['stageRing', 'dancerAfterimage', 'rhythmPulseBar', 'sparkleMotes'],
    rhythm_deflect: ['rhythmPulseBar', 'stageRing'], stage_step: ['stageRing', 'sparkleMotes'], performance_guard: ['stageRing', 'spotlightCone'],
    grand_performance: ['stageRing', 'spotlightCone', 'rhythmPulseBar', 'dancerAfterimage', 'sparkleMotes'], encore_galaxy: ['stageRing', 'dancerAfterimage', 'rhythmPulseBar'],
  },
  char_paul: {
    baton_strike: ['policeShieldPanel', 'signalLights'], containment_cuff: ['containmentCuff', 'lockdownGrid', 'signalLights'], traffic_barrier: ['roadBarrierWall', 'signalLights'],
    siren_pulse: ['lockdownGrid', 'signalLights'], shield_bash: ['policeShieldPanel', 'signalLights'], order_breaker: ['policeShieldPanel', 'lockdownGrid'],
    shield_wall: ['policeShieldPanel', 'lockdownGrid', 'signalLights'], traffic_control: ['lockdownGrid', 'roadBarrierWall'], authority_guard: ['policeShieldPanel', 'signalLights'],
    lockdown: ['lockdownGrid', 'roadBarrierWall', 'containmentCuff', 'signalLights'], justice_convoy: ['roadBarrierWall', 'lockdownGrid', 'signalLights'],
  },
  char_donnie: {
    tool_arm: ['toolArmSwarm', 'constructionGrid'], heavy_hammer: ['toolArmSwarm', 'constructionGrid'], repair_overload: ['repairNode', 'toolArmSwarm'],
    build_cover: ['metalPanelAssembly', 'constructionGrid', 'toolArmSwarm'], tool_matrix: ['toolArmSwarm', 'constructionGrid'], magnetic_scrap: ['magneticScrap', 'constructionGrid'],
    barricade: ['metalPanelAssembly', 'constructionGrid'], auto_repair: ['repairNode', 'toolArmSwarm'], ground_anchor: ['metalPanelAssembly', 'constructionGrid'],
    mega_constructor: ['toolArmSwarm', 'metalPanelAssembly', 'repairNode', 'constructionGrid'], titan_hammer: ['toolArmSwarm', 'metalPanelAssembly', 'constructionGrid'],
  },
  char_todd: {
    drill_jab: ['spinningDrill', 'dirtCloud'], burrow_dash: ['groundCrack', 'rockRubble', 'dirtCloud'], armor_bore: ['spinningDrill', 'craterRing'],
    seismic_quake: ['groundCrack', 'rockRubble', 'dirtCloud', 'craterRing'], tunnel_uppercut: ['craterRing', 'rockRubble', 'dirtCloud'], core_break_spiral: ['spinningDrill', 'groundCrack'],
    dig_down: ['groundCrack', 'dirtCloud'], drill_guard: ['spinningDrill', 'dirtCloud'], rock_shell: ['rockRubble', 'craterRing'],
    earth_core_breaker: ['spinningDrill', 'groundCrack', 'rockRubble', 'dirtCloud', 'craterRing'], subterranean_collapse: ['groundCrack', 'rockRubble', 'craterRing'],
  },
  char_flip: {
    combo_kick: ['bounceTrajectory', 'scoreFlash'], ricochet_ball: ['sportBall', 'bounceTrajectory', 'scoreFlash'], bounce_pad: ['reboundPanel', 'bounceTrajectory'],
    stadium_storm: ['sportBall', 'stadiumBoundary', 'scoreFlash'], wall_trick: ['bounceTrajectory', 'reboundPanel'], air_trick: ['bounceTrajectory', 'scoreFlash'],
    rebound_guard: ['reboundPanel', 'scoreFlash'], acrobatic_flip: ['bounceTrajectory', 'scoreFlash'], barrier_net: ['reboundPanel', 'stadiumBoundary'],
    hyper_stadium: ['sportBall', 'stadiumBoundary', 'reboundPanel', 'bounceTrajectory', 'scoreFlash'], goal_meteor: ['sportBall', 'bounceTrajectory', 'scoreFlash'],
  },
  char_bello: {
    wild_call: ['soundCone', 'natureFog'], animal_rush: ['animalSpirit', 'pawMark', 'natureFog'], savanna_echo: ['soundCone', 'echoRing', 'natureFog'],
    predator_mark: ['pawMark', 'soundCone'], nature_snare: ['pawMark', 'natureFog'], beast_roar: ['soundCone', 'echoRing'],
    nature_screen: ['echoRing', 'natureFog'], wild_instinct: ['pawMark', 'natureFog'], companion_cover: ['animalSpirit', 'natureFog'],
    call_of_wild: ['animalSpirit', 'soundCone', 'echoRing', 'natureFog', 'pawMark'], primal_echo: ['soundCone', 'echoRing', 'natureFog'],
  },
  char_chase: {
    covert_shot: ['scanCone', 'dataFragment'], weakpoint_scan: ['scanCone', 'weakpointRing', 'dataGrid'], execution_grid: ['dataGrid', 'weakpointRing', 'dataFragment'],
    decoy_detonator: ['hologramDecoy', 'dataFragment'], silent_shot: ['scanCone', 'dataFragment'], blackbox_breaker: ['weakpointRing', 'dataFragment', 'dataGrid'],
    stealth_cloak: ['scanCone', 'dataGrid'], decoy_jammer: ['hologramDecoy', 'dataGrid', 'dataFragment'], evasive_scan: ['scanCone', 'dataGrid'],
    blackbox_assassination: ['weakpointRing', 'hologramDecoy', 'dataFragment', 'dataGrid', 'scanCone'], surveillance_grid: ['dataGrid', 'scanCone', 'weakpointRing'],
  },
};

export function authoredEffect(characterId: string, key: string, effectId: string, name: string, color: string, category: AbilityCategory, skillId: string): CinematicEffectDefinition {
  const pieces = signaturePieces(characterId);
  const sigKeys = MAPS[characterId]?.[key] ?? Object.keys(pieces).slice(0, 2);
  const layers: CinematicEffectLayerDefinition[] = [];
  for (const k of sigKeys) { const fn = pieces[k]; if (fn) layers.push(...fn(color)); }
  const showcase = isShowcaseAbility(skillId);
  if (category === 'ultimate') layers.push(camLayer(CAMERA_PRESETS.ultimate()));
  else if (showcase) layers.push(camLayer(CAMERA_PRESETS.heavyHit()));
  else layers.push(camLayer(CAMERA_PRESETS.lightHit()));
  const motion = getStyleProfile(characterId)?.motionLanguage ?? 'fast-linear';
  const total = category === 'ultimate' ? 1.4 : showcase ? 1.1 : 0.9;
  return {
    id: effectId, name, effectFamily: FAMILY[characterId] ?? 'generic',
    characterId, signatureObjectIds: sigKeys, motionLanguage: motion,
    layers,
    timeline: { totalDurationSeconds: total },
    pooling: { poolId: `cvfx_${characterId}`, reusable: true },
    cleanup: { autoCleanup: true, cleanupDelaySeconds: 0.2 },
  };
}
