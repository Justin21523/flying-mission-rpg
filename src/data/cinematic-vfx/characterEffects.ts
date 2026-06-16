import type { CinematicEffectDefinition, CinematicEffectFamily, CinematicEffectLayerDefinition, CinematicLayerType } from '../../types/cinematicVfxTypes';
import type { AbilityCategory } from '../../types/abilityArsenalTypes';
import { signaturePieces } from './signatureEffectLibrary';
import { camLayer, pLayer, gLayer, mLayer } from './cinematicVfxBuilders';
import { CAMERA_PRESETS } from './cameraFeedbackPresets';
import { getStyleProfile } from './characterVfxStyleProfiles';
import { isShowcaseAbility } from './showcaseAbilities';
import { GEOM_PRESETS } from './geometryEffectPresets';
import { PARTICLE_PRESETS } from './particlePresets';
import { HERO_MODELS } from './vfxModelCatalog';
import { MODEL_SCALE_PRESETS, MAX_MODEL_LAYER_SCALE, presetForCategory } from './modelScalePresets';

const MODEL_TYPES: ReadonlySet<CinematicLayerType> = new Set(['model-component', 'model-fragment', 'object-assembly']);
const PARTICLE_TYPES: ReadonlySet<CinematicLayerType> = new Set(['particle-burst', 'particle-trail']);
const GEOM_OR_FOG_TYPES: ReadonlySet<CinematicLayerType> = new Set([
  'geometry-mesh', 'shield-panel', 'scan-overlay', 'lock-line', 'ground-marker', 'energy-field',
  'fog-cloud', 'smoke-ring', 'dust-cloud',
]);

// Hand-authored per-ability effect composition (Batch F.6) — each ability composes its character's SIGNATURE
// pieces (model/geometry/physics-driven) so every effect reads as that hero, not a generic generator. 24
// showcase abilities get richer stacks (score >= 85); the rest are still character-distinct (score >= 65).

const FAMILY: Record<string, CinematicEffectFamily> = {
  char_jett: 'speed', char_jerome: 'dance', char_paul: 'police', char_donnie: 'engineering',
  char_todd: 'drill', char_flip: 'sport', char_bello: 'wild', char_chase: 'stealth',
};

// characterId → abilityKey → signature piece keys (the visual recipe per ability). Batch F.6b: every entry
// pulls ≥1 real-model piece; showcase entries include an OWN-model piece (escort/giant projection).
const MAPS: Record<string, Record<string, string[]>> = {
  char_jett: {
    dash_slash: ['jetAfterimage', 'thrusterDash'], rescue_rush: ['jetAfterimage', 'rescueWingmen', 'rescueBeacon', 'windTunnel'],
    courier_drop: ['rescueWingmen', 'thrusterDash'], cyclone: ['jetAfterimage', 'windTunnel', 'rescueWingmen', 'thrusterDash'],
    tailwind: ['windTunnel', 'jetAfterimage'], redline_combo: ['jetAfterimage', 'thrusterDash', 'rescueWingmen'],
    afterimage: ['jetAfterimage', 'windTunnel'], guard_drift: ['jetAfterimage', 'windTunnel'], rescue_shield: ['rescueBeacon', 'jetAfterimage'],
    sonic_beacon: ['sonicBeacon', 'rescueBeacon'],
    overdrive: ['giantJet', 'jetAfterimage', 'rescueWingmen', 'windTunnel'], meteor: ['giantJet', 'thrusterDash', 'windTunnel'],
  },
  char_jerome: {
    dance_combo: ['danceTroupe', 'stageRing'], spin_vortex: ['danceTroupe', 'ringStackSpin'], spotlight_dive: ['spotlightStage', 'danceTroupe', 'ringStackSpin', 'rhythmPulse'],
    rhythm_pulse: ['rhythmPulse', 'ringStackSpin'], waltz_sweep: ['spotlightStage', 'danceTroupe'], encore_spiral: ['danceTroupe', 'ringStackSpin', 'rhythmPulse', 'stageRing'],
    rhythm_deflect: ['rhythmPulse', 'ringStackSpin'], stage_step: ['stageRing', 'danceTroupe'], performance_guard: ['spotlightStage', 'danceTroupe'],
    rally_stage: ['rallyStage', 'spotlightStage'],
    grand_performance: ['grandFinale', 'danceTroupe', 'spotlightStage', 'ringStackSpin'], encore_galaxy: ['grandFinale', 'danceTroupe', 'ringStackSpin'],
  },
  char_paul: {
    baton_strike: ['barrierWall', 'signalLights'], containment_cuff: ['barrierWall', 'coneLine', 'signalLights', 'paulEscort'], traffic_barrier: ['roadblock', 'coneLine'],
    siren_pulse: ['signalLights', 'coneLine'], shield_bash: ['barrierWall', 'signalLights'], order_breaker: ['barrierWall', 'lockdownGrid'],
    shield_wall: ['barrierWall', 'roadblock', 'signalLights', 'paulEscort'], traffic_control: ['coneLine', 'roadblock'], authority_guard: ['policeBox', 'signalLights'],
    checkpoint: ['checkpoint', 'coneLine'],
    lockdown: ['paulEscort', 'roadblock', 'barrierWall', 'policeBox', 'lockdownGrid'], justice_convoy: ['paulEscort', 'roadblock', 'coneLine', 'signalLights'],
  },
  char_donnie: {
    tool_arm: ['toolSwarm', 'weldShower'], heavy_hammer: ['toolSwarm', 'crateDrop'], repair_overload: ['repairNode', 'toolSwarm'],
    build_cover: ['panelAssembly', 'crateDrop', 'toolSwarm', 'donnieEscort'], tool_matrix: ['toolSwarm', 'craneLift'], magnetic_scrap: ['magneticScrap', 'toolSwarm', 'donnieEscort'],
    barricade: ['panelAssembly', 'crateDrop'], auto_repair: ['repairNode', 'toolSwarm'], ground_anchor: ['panelAssembly', 'craneLift'],
    repair_station: ['repairStation', 'repairNode'],
    mega_constructor: ['megaRig', 'panelAssembly', 'toolSwarm', 'craneLift'], titan_hammer: ['megaRig', 'crateDrop', 'weldShower'],
  },
  char_todd: {
    drill_jab: ['spinningDrill', 'rockfall'], burrow_dash: ['boulderErupt', 'rockfall', 'mineCartCharge', 'toddEscort'], armor_bore: ['spinningDrill', 'boulderErupt'],
    seismic_quake: ['boulderErupt', 'desertRocks', 'craterRing', 'toddEscort'], tunnel_uppercut: ['craterRing', 'boulderErupt'], core_break_spiral: ['spinningDrill', 'mineCartCharge'],
    dig_down: ['mineCartCharge', 'rockfall'], drill_guard: ['spinningDrill', 'boulderErupt'], rock_shell: ['desertRocks', 'craterRing'],
    tunnel_route: ['tunnelRoute', 'craterRing'],
    earth_core_breaker: ['earthTitan', 'boulderErupt', 'spinningDrill', 'craterRing'], subterranean_collapse: ['earthTitan', 'rockfall', 'desertRocks'],
  },
  char_flip: {
    combo_kick: ['bounceTrail', 'soccerKick'], ricochet_ball: ['sportBall', 'bounceTrail', 'ringStack', 'flipEscort'], bounce_pad: ['ringStack', 'bounceTrail'],
    stadium_storm: ['sportBall', 'stadiumRing', 'runnerDash', 'flipEscort'], wall_trick: ['bounceTrail', 'ringStack'], air_trick: ['bounceTrail', 'runnerDash'],
    rebound_guard: ['stadiumRing', 'ringStack'], acrobatic_flip: ['bounceTrail', 'soccerKick'], barrier_net: ['stadiumRing', 'ringStack'],
    bounce_court: ['bounceCourt', 'stadiumRing'],
    hyper_stadium: ['hyperStadium', 'sportBall', 'ringStack', 'runnerDash'], goal_meteor: ['hyperStadium', 'sportBall', 'bounceTrail'],
  },
  char_bello: {
    wild_call: ['lionPride', 'natureScreen'], animal_rush: ['lionPride', 'catPounce', 'natureScreen', 'belloEscort'], savanna_echo: ['lionPride', 'owlSpiral', 'natureScreen', 'belloEscort'],
    predator_mark: ['pawMark', 'catPounce'], nature_snare: ['pawMark', 'serpentCoil'], beast_roar: ['lionPride', 'owlSpiral'],
    nature_screen: ['natureScreen', 'owlSpiral'], wild_instinct: ['pawMark', 'catPounce'], companion_cover: ['serpentCoil', 'natureScreen'],
    guide_signal: ['guideSignal', 'natureScreen'],
    call_of_wild: ['wildKing', 'lionPride', 'catPounce', 'owlSpiral'], primal_echo: ['wildKing', 'lionPride', 'natureScreen'],
  },
  char_chase: {
    covert_shot: ['droneDecoys', 'radarScan'], weakpoint_scan: ['radarScan', 'weakpointRing', 'droneDecoys', 'holoSelf'], execution_grid: ['weakpointRing', 'dataFragment'],
    decoy_detonator: ['holoSelf', 'dataFragment'], silent_shot: ['droneDecoys', 'radarScan'], blackbox_breaker: ['weakpointRing', 'dataFragment', 'droneDecoys'],
    stealth_cloak: ['holoSelf', 'radarScan'], decoy_jammer: ['holoSelf', 'droneDecoys', 'dataFragment', 'radarScan'], evasive_scan: ['radarScan', 'droneDecoys'],
    scan_relay: ['scanRelay', 'radarScan'],
    blackbox_assassination: ['blackboxAssault', 'holoSelf', 'dataFragment', 'weakpointRing'], surveillance_grid: ['blackboxAssault', 'droneDecoys', 'radarScan'],
  },
};

export function authoredEffect(characterId: string, key: string, effectId: string, name: string, color: string, category: AbilityCategory, skillId: string): CinematicEffectDefinition {
  const pieces = signaturePieces(characterId);
  const sigKeys = MAPS[characterId]?.[key] ?? Object.keys(pieces).slice(0, 2);
  const layers: CinematicEffectLayerDefinition[] = [];
  for (const k of sigKeys) { const fn = pieces[k]; if (fn) layers.push(...fn(color)); }

  // Batch F.6 — tier the model size by category so abilities read at a deliberate on-screen scale (basic
  // attacks clearly visible → ultimates with giant presence), clamped so nothing fills the frame.
  const modelMult = MODEL_SCALE_PRESETS[presetForCategory(category)];
  for (const l of layers) {
    if (l.model && MODEL_TYPES.has(l.layerType)) {
      l.model = { ...l.model, scale: Math.min(MAX_MODEL_LAYER_SCALE, +(l.model.scale * modelMult).toFixed(3)) };
    }
  }

  // Batch F.6 — completeness guard: EVERY ability must combine model + particle + geometry/fog (never
  // particle-only or model-only). Add a small themed accent for any missing channel.
  const own = HERO_MODELS[characterId as keyof typeof HERO_MODELS];
  if (!layers.some((l) => MODEL_TYPES.has(l.layerType) && l.model?.modelAssetId) && own?.airplane) {
    layers.push(mLayer('model-component', { modelAssetId: own.airplane, shape: 'burst', count: 2, scale: 0.8 * modelMult, spin: 1.4, spreadRadius: 3 }, 'model_particle_burst', color, 0, 0.7));
  }
  if (!layers.some((l) => PARTICLE_TYPES.has(l.layerType))) {
    layers.push(pLayer(PARTICLE_PRESETS.sparks(color), color, 0, 0.45, 'spark_burst_effect'));
  }
  if (!layers.some((l) => GEOM_OR_FOG_TYPES.has(l.layerType))) {
    layers.push(gLayer('ground-marker', GEOM_PRESETS.groundMarker(category === 'ultimate' ? 8 : 5), 'shockwave_ring_effect', color, 0, 0.55));
  }

  const showcase = isShowcaseAbility(skillId);
  if (category === 'ultimate') layers.push(camLayer(CAMERA_PRESETS.ultimate()));
  else if (showcase) layers.push(camLayer(CAMERA_PRESETS.heavyHit()));
  else layers.push(camLayer(CAMERA_PRESETS.lightHit()));
  const motion = getStyleProfile(characterId)?.motionLanguage ?? 'fast-linear';
  const total = category === 'ultimate' ? 1.4 : category === 'signature' ? 1.1 : showcase ? 1.1 : 0.9;
  return {
    id: effectId, name, effectFamily: FAMILY[characterId] ?? 'generic',
    characterId, signatureObjectIds: sigKeys, motionLanguage: motion,
    layers,
    timeline: { totalDurationSeconds: total },
    pooling: { poolId: `cvfx_${characterId}`, reusable: true },
    cleanup: { autoCleanup: true, cleanupDelaySeconds: 0.2 },
  };
}
