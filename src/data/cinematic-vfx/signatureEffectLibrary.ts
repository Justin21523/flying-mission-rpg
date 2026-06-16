import type { CinematicEffectLayerDefinition } from '../../types/cinematicVfxTypes';
import type { EffectTypeV2 } from '../../types/game/transformationEffects';
import type { ModelEffectShape } from '../../types/modelEffectTypes';
import { pLayer, fLayer, gLayer, mLayer, physLayer } from './cinematicVfxBuilders';
import { GEOM_PRESETS } from './geometryEffectPresets';
import { PARTICLE_PRESETS } from './particlePresets';
import { FOG_PRESETS } from './fogCloudPresets';
import { HERO_MODELS, THEME_MODELS } from './vfxModelCatalog';
import { makeDebris, makeEnergyFragments } from '../../game/vfx/physics/PhysicsDebrisRuntime';
import { makeProjectile } from '../../game/vfx/physics/PhysicsProjectileRuntime';
import { makeAssemblyPanels, makeShieldTiles, makeBarrierWall } from '../../game/vfx/physics/PhysicsPanelRuntime';
import { makeBall } from '../../game/vfx/physics/PhysicsBallRuntime';
import { makeRubble, makeDrillFragments } from '../../game/vfx/physics/PhysicsRubbleRuntime';

// Per-character signature effect pieces (Batch F.6b — MODEL-FIRST rebuild). Every hero's pieces are anchored by
// a REAL GLB from public/models/ — each hero's OWN aircraft/pose models (self-afterimages, escorts, giant
// projection) PLUS themed real props (Paul→traffic gear, Donnie→tools/vehicles, Todd→rocks/mine cart,
// Flip→balls/rings, Bello→lion/cat/owl yokais, Chase→drones/radar) — with tuned particle/fog/physics accents.
// Particles are accents to a model centerpiece, never the whole effect.

type Piece = (color: string) => CinematicEffectLayerDefinition[];

const V2_FOR_SHAPE: Record<Exclude<ModelEffectShape, 'assembly'>, EffectTypeV2> = {
  attach: 'model_orbit_swarm', burst: 'model_particle_burst', debris: 'model_debris_field',
  orbit: 'model_orbit_swarm', rain: 'model_rain', rising: 'model_rising_swarm',
};

// Real-model layer: clones `count` copies of a GLB (or the caster's own model if id is undefined), animated as
// a burst/orbit/debris/rain/rising swarm. The explicit v2 type routes to ModelParticleRenderer.
const mdl = (
  modelId: string | undefined, shape: Exclude<ModelEffectShape, 'assembly'>, count: number, scale: number,
  color: string, start = 0, dur = 0.9, spin = 1.2, spread = 2.5,
): CinematicEffectLayerDefinition =>
  mLayer('model-component', { modelAssetId: modelId, shape, count, scale, spin, spreadRadius: spread }, V2_FOR_SHAPE[shape], color, start, dur);

const J = HERO_MODELS;

// ── Jett — speed/rescue: his own jet streaks + wind + rescue beacons ──
export const JETT_SIGNATURES: Record<string, Piece> = {
  jetAfterimage: (c) => [mdl(J.char_jett.airplane, 'orbit', 4, 0.8, c, 0, 0.7, 2.4, 3), pLayer(PARTICLE_PRESETS.windStreak(c), c, 0, 0.5, 'speed_line_effect')],
  rescueWingmen: (c) => [mdl(J.char_jett.airplane, 'burst', 3, 0.7, c, 0, 0.7, 1.2, 4), pLayer(PARTICLE_PRESETS.trail(c), c, 0, 0.5, 'speed_line_effect')],
  windTunnel: (c) => [fLayer(FOG_PRESETS.windFog(c), c, 0.05, 0.7), pLayer(PARTICLE_PRESETS.windStreak(c), c, 0, 0.5, 'speed_line_effect')],
  rescueBeacon: (c) => [mdl(THEME_MODELS.jett.radar, 'attach', 1, 0.6, c, 0, 0.6, 0.6, 0.3), gLayer('ground-marker', GEOM_PRESETS.groundMarker(5), 'shockwave_ring_effect', c, 0, 0.5, 'target')],
  thrusterDash: (c) => [pLayer(PARTICLE_PRESETS.sparks(c), c, 0, 0.4, 'spark_burst_effect'), physLayer(makeDebris('phys_jett_debris', c, 8), 0.1, 1.1)],
  giantJet: (c) => [mdl(J.char_jett.transformer ?? J.char_jett.airplane, 'attach', 1, 3.2, c, 0, 1.0, 0.6, 0.2), pLayer(PARTICLE_PRESETS.auraPulse(c), c, 0, 0.9, 'aura_particles_effect'), pLayer(PARTICLE_PRESETS.windStreak(c), c, 0, 0.6, 'speed_line_effect')],
  // Signature utility — drop a rescue beacon: marks a safe route with expanding rings + a route line + soft cloud.
  sonicBeacon: (c) => [mdl(THEME_MODELS.jett.radar ?? J.char_jett.airplane, 'attach', 1, 0.7, c, 0, 0.9, 0.5, 0.3), gLayer('ground-marker', GEOM_PRESETS.groundMarker(7), 'shockwave_ring_effect', c, 0, 0.7, 'target'), gLayer('lock-line', GEOM_PRESETS.lockLine(12), 'radial_burst_effect', c, 0.05, 0.5), pLayer(PARTICLE_PRESETS.sparks(c), c, 0, 0.5, 'spark_burst_effect'), fLayer(FOG_PRESETS.windFog(c), c, 0.05, 0.7)],
};

// ── Jerome — dance/stage: a troupe of his own pose variants under a spotlight ──
export const JEROME_SIGNATURES: Record<string, Piece> = {
  danceTroupe: (c) => [mdl(J.char_jerome.poses[0] ?? J.char_jerome.pose, 'orbit', 3, 0.7, c, 0, 0.8, 2, 3), mdl(J.char_jerome.poses[1] ?? J.char_jerome.pose, 'rising', 2, 0.6, c, 0.1, 0.8, 1.6, 2.2), pLayer(PARTICLE_PRESETS.stageSparkle(c), c, 0, 0.7, 'orbit_particles_effect')],
  spotlightStage: (c) => [gLayer('geometry-mesh', GEOM_PRESETS.scanCone(8), 'energy_dome_effect', c, 0, 0.6), pLayer(PARTICLE_PRESETS.stageSparkle(c), c, 0, 0.6, 'rising_particles_effect')],
  ringStackSpin: (c) => [mdl(THEME_MODELS.jerome.ringStack, 'orbit', 3, 0.5, c, 0, 0.7, 3, 2.5), pLayer(PARTICLE_PRESETS.stageSparkle(c), c, 0, 0.6, 'orbit_particles_effect')],
  rhythmPulse: (c) => [gLayer('geometry-mesh', GEOM_PRESETS.shockRing(6), 'shockwave_ring_effect', c, 0.1, 0.5), pLayer(PARTICLE_PRESETS.sparks(c), c, 0, 0.4, 'spark_burst_effect')],
  stageRing: (c) => [gLayer('ground-marker', GEOM_PRESETS.groundMarker(6), 'shockwave_ring_effect', c, 0, 0.6), pLayer(PARTICLE_PRESETS.stageSparkle(c), c, 0, 0.6, 'rising_particles_effect')],
  grandFinale: (c) => [mdl(J.char_jerome.transformer ?? J.char_jerome.pose, 'attach', 1, 3.0, c, 0, 1.0, 0.8, 0.2), mdl(J.char_jerome.poses[2] ?? J.char_jerome.pose, 'orbit', 4, 0.6, c, 0.05, 0.9, 2.4, 3.5), pLayer(PARTICLE_PRESETS.stageSparkle(c), c, 0, 0.9, 'aura_particles_effect')],
  // Signature utility — raise a mini rhythm stage: platform + spotlight cone + beat rings + note motes + fog floor.
  rallyStage: (c) => [mdl(THEME_MODELS.jerome.lantern ?? THEME_MODELS.jerome.ringStack ?? J.char_jerome.pose, 'attach', 1, 0.8, c, 0, 0.9, 0.4, 0.3), gLayer('geometry-mesh', GEOM_PRESETS.scanCone(8), 'energy_dome_effect', c, 0, 0.7), gLayer('ground-marker', GEOM_PRESETS.groundMarker(6), 'shockwave_ring_effect', c, 0.05, 0.7), pLayer(PARTICLE_PRESETS.stageSparkle(c), c, 0, 0.8, 'rising_particles_effect'), fLayer(FOG_PRESETS.smokeRing(c), c, 0.05, 0.7)],
};

// ── Paul — police/defense: real traffic barriers, cones, signals, police box ──
export const PAUL_SIGNATURES: Record<string, Piece> = {
  barrierWall: (c) => [mdl(THEME_MODELS.paul.trafficBarrier, 'burst', 4, 0.7, c, 0, 0.8, 0.4, 3.2), physLayer(makeShieldTiles('phys_paul_tiles', c, 8), 0, 4)],
  coneLine: (c) => [mdl(THEME_MODELS.paul.trafficCone, 'rising', 5, 0.5, c, 0, 0.7, 0.3, 2.5)],
  signalLights: (c) => [mdl(THEME_MODELS.paul.signalLight, 'attach', 1, 0.6, c, 0, 0.6, 0.4, 0.3), pLayer(PARTICLE_PRESETS.sirenFlash(c), c, 0, 0.5, 'spark_burst_effect')],
  policeBox: (c) => [mdl(THEME_MODELS.paul.policeBox, 'attach', 1, 0.5, c, 0, 0.7, 0.3, 0.2), pLayer(PARTICLE_PRESETS.sirenFlash(c), c, 0, 0.5, 'spark_burst_effect')],
  lockdownGrid: (c) => [gLayer('ground-marker', GEOM_PRESETS.groundMarker(8), 'shockwave_ring_effect', c, 0, 0.8), gLayer('geometry-mesh', GEOM_PRESETS.orbitRing(7), 'shockwave_ring_effect', c, 0.1, 0.8)],
  roadblock: (c) => [mdl(THEME_MODELS.paul.roadBarrier, 'burst', 3, 0.7, c, 0, 0.7, 0.4, 3), physLayer(makeBarrierWall('phys_paul_barrier', c, 5), 0, 5)],
  paulEscort: (c) => [mdl(J.char_paul.airplane, 'orbit', 2, 0.95, c, 0, 0.7, 1.6, 3), pLayer(PARTICLE_PRESETS.sirenFlash(c), c, 0, 0.4, 'spark_burst_effect')],
  // Signature utility — deploy a command checkpoint: barricade + cone line + warning rings + siren flash + dust.
  checkpoint: (c) => [mdl(THEME_MODELS.paul.roadBarrier ?? THEME_MODELS.paul.trafficBarrier ?? J.char_paul.airplane, 'attach', 1, 0.8, c, 0, 0.9, 0.3, 0.3), mdl(THEME_MODELS.paul.trafficCone ?? THEME_MODELS.paul.trafficBarrier, 'rising', 4, 0.5, c, 0.05, 0.8, 0.3, 2.6), gLayer('ground-marker', GEOM_PRESETS.groundMarker(6), 'shockwave_ring_effect', c, 0, 0.7), pLayer(PARTICLE_PRESETS.sirenFlash(c), c, 0, 0.5, 'spark_burst_effect'), fLayer(FOG_PRESETS.impactDust(c), c, 0.05, 0.6)],
};

// ── Donnie — engineering: real tools, forklift/crane, panels assemble into a wall ──
export const DONNIE_SIGNATURES: Record<string, Piece> = {
  toolSwarm: (c) => [mdl(THEME_MODELS.donnie.forklift, 'orbit', 2, 0.5, c, 0, 0.8, 1, 3), mdl(THEME_MODELS.donnie.toolbox, 'orbit', 3, 0.5, c, 0.1, 0.8, 2, 2.2), pLayer(PARTICLE_PRESETS.weldSparks(c), c, 0, 0.5, 'spark_burst_effect')],
  panelAssembly: (c) => [mdl(THEME_MODELS.donnie.shelving, 'attach', 1, 0.6, c, 0, 0.6, 0.3, 0.3), physLayer(makeAssemblyPanels('phys_donnie_panels', c, 6), 0, 4)],
  crateDrop: (c) => [mdl(THEME_MODELS.donnie.crate, 'debris', 5, 0.5, c, 0, 0.8, 2, 3), pLayer(PARTICLE_PRESETS.weldSparks(c), c, 0, 0.4, 'spark_burst_effect')],
  craneLift: (c) => [mdl(THEME_MODELS.donnie.crane, 'rising', 2, 0.6, c, 0, 0.8, 0.5, 2)],
  weldShower: (c) => [pLayer(PARTICLE_PRESETS.weldSparks(c), c, 0, 0.5, 'spark_burst_effect'), gLayer('ground-marker', GEOM_PRESETS.groundMarker(5), 'shockwave_ring_effect', c, 0, 0.6)],
  repairNode: (c) => [gLayer('geometry-mesh', GEOM_PRESETS.orbitRing(1), 'shockwave_ring_effect', c, 0, 0.6, 'target'), pLayer(PARTICLE_PRESETS.auraPulse(c), c, 0, 0.6, 'aura_particles_effect')],
  magneticScrap: (c) => [mdl(THEME_MODELS.donnie.toyBlocks, 'burst', 6, 0.45, c, 0, 0.7, 3, 3), physLayer(makeProjectile('phys_donnie_scrap', c, 'energy-fragment', 6), 0, 1.2)],
  donnieEscort: (c) => [mdl(J.char_donnie.airplane, 'orbit', 2, 0.95, c, 0, 0.7, 1.6, 3), pLayer(PARTICLE_PRESETS.weldSparks(c), c, 0, 0.4, 'spark_burst_effect')],
  megaRig: (c) => [mdl(J.char_donnie.transformer ?? J.char_donnie.airplane, 'attach', 1, 3.0, c, 0, 1.0, 0.6, 0.2), mdl(THEME_MODELS.donnie.bulldozer, 'burst', 3, 0.5, c, 0.05, 0.9, 1, 3.5), pLayer(PARTICLE_PRESETS.weldSparks(c), c, 0, 0.8, 'aura_particles_effect')],
  // Signature utility — assemble a rapid repair station: station + orbiting tool arms + gears + grid + repair steam.
  repairStation: (c) => [mdl(THEME_MODELS.donnie.shelving ?? J.char_donnie.airplane, 'attach', 1, 0.8, c, 0, 0.9, 0.3, 0.3), mdl(THEME_MODELS.donnie.toolbox ?? THEME_MODELS.donnie.crate, 'orbit', 3, 0.5, c, 0.05, 0.8, 2, 2.2), gLayer('ground-marker', GEOM_PRESETS.groundMarker(6), 'shockwave_ring_effect', c, 0, 0.7), pLayer(PARTICLE_PRESETS.weldSparks(c), c, 0, 0.6, 'spark_burst_effect'), fLayer(FOG_PRESETS.smokeRing(c), c, 0.05, 0.7)],
};

// ── Todd — drill/ground: real boulders, mine cart, rockfall erupt + rubble physics ──
export const TODD_SIGNATURES: Record<string, Piece> = {
  boulderErupt: (c) => [mdl(THEME_MODELS.todd.boulder, 'debris', 5, 0.55, c, 0, 0.9, 2, 3), physLayer(makeRubble('phys_todd_rubble', c, 12), 0.05, 1.6), pLayer(PARTICLE_PRESETS.rockDust(c), c, 0, 0.6, 'spark_burst_effect')],
  mineCartCharge: (c) => [mdl(THEME_MODELS.todd.mineCart, 'attach', 1, 0.6, c, 0, 0.7, 0.3, 0.3), pLayer(PARTICLE_PRESETS.rockDust(c), c, 0, 0.5, 'spark_burst_effect')],
  rockfall: (c) => [mdl(THEME_MODELS.todd.rockfall, 'rain', 5, 0.5, c, 0, 0.9, 2, 3), pLayer(PARTICLE_PRESETS.rockDust(c), c, 0, 0.5, 'spark_burst_effect')],
  spinningDrill: (c) => [gLayer('geometry-mesh', GEOM_PRESETS.scanCone(4), 'energy_dome_effect', c, 0, 0.5), physLayer(makeDrillFragments('phys_todd_drill', c, 10), 0.05, 1.3), pLayer(PARTICLE_PRESETS.rockDust(c), c, 0, 0.5, 'spark_burst_effect')],
  craterRing: (c) => [gLayer('geometry-mesh', GEOM_PRESETS.shockRing(7), 'shockwave_ring_effect', c, 0, 0.5), gLayer('ground-marker', GEOM_PRESETS.groundMarker(7), 'ground_crack_effect', c, 0, 0.6)],
  desertRocks: (c) => [mdl(THEME_MODELS.todd.desertRocks, 'debris', 6, 0.5, c, 0, 0.9, 2, 3), physLayer(makeRubble('phys_todd_rubble2', c, 10), 0.05, 1.4)],
  toddEscort: (c) => [mdl(J.char_todd.airplane, 'orbit', 2, 0.95, c, 0, 0.7, 1.6, 3), pLayer(PARTICLE_PRESETS.rockDust(c), c, 0, 0.4, 'spark_burst_effect')],
  earthTitan: (c) => [mdl(J.char_todd.transformer ?? J.char_todd.airplane, 'attach', 1, 3.0, c, 0, 1.0, 0.6, 0.2), mdl(THEME_MODELS.todd.boulder, 'debris', 6, 0.5, c, 0.05, 0.9, 2, 3.5), pLayer(PARTICLE_PRESETS.rockDust(c), c, 0, 0.8, 'aura_particles_effect')],
  // Signature utility — open a tunnel rescue route: tunnel mouth + ground crack + route lights + dust cloud.
  tunnelRoute: (c) => [mdl(THEME_MODELS.todd.mineCart ?? J.char_todd.airplane, 'attach', 1, 0.8, c, 0, 0.9, 0.3, 0.3), gLayer('ground-marker', GEOM_PRESETS.groundMarker(7), 'ground_crack_effect', c, 0, 0.8), gLayer('lock-line', GEOM_PRESETS.lockLine(12), 'radial_burst_effect', c, 0.05, 0.5), pLayer(PARTICLE_PRESETS.rockDust(c), c, 0, 0.6, 'spark_burst_effect'), fLayer(FOG_PRESETS.impactDust(c), c, 0.05, 0.7)],
};

// ── Flip — sport/bounce: real ball/torus/rings bounce, soccer-boy & runner cameos ──
export const FLIP_SIGNATURES: Record<string, Piece> = {
  sportBall: (c) => [mdl(THEME_MODELS.flip.torus, 'burst', 2, 0.6, c, 0, 0.7, 2, 3), physLayer(makeBall('phys_flip_ball', c, 1), 0, 2.5), pLayer(PARTICLE_PRESETS.ballSpin(c), c, 0, 0.5, 'orbit_particles_effect')],
  ringStack: (c) => [mdl(THEME_MODELS.flip.ringStack, 'rising', 3, 0.5, c, 0, 0.8, 3, 2)],
  soccerKick: (c) => [mdl(THEME_MODELS.flip.soccerBoy, 'attach', 1, 0.6, c, 0, 0.7, 0.5, 0.3), pLayer(PARTICLE_PRESETS.ballSpin(c), c, 0, 0.5, 'spark_burst_effect')],
  bounceTrail: (c) => [gLayer('lock-line', GEOM_PRESETS.lockLine(12), 'radial_burst_effect', c, 0, 0.4), pLayer(PARTICLE_PRESETS.ballSpin(c), c, 0, 0.5, 'speed_line_effect')],
  stadiumRing: (c) => [gLayer('geometry-mesh', GEOM_PRESETS.orbitRing(7), 'shockwave_ring_effect', c, 0, 0.7)],
  runnerDash: (c) => [mdl(THEME_MODELS.flip.runner, 'burst', 2, 0.6, c, 0, 0.7, 1, 3), pLayer(PARTICLE_PRESETS.windStreak(c), c, 0, 0.5, 'speed_line_effect')],
  flipEscort: (c) => [mdl(J.char_flip.airplane, 'orbit', 2, 0.95, c, 0, 0.7, 1.8, 3), pLayer(PARTICLE_PRESETS.ballSpin(c), c, 0, 0.4, 'orbit_particles_effect')],
  hyperStadium: (c) => [mdl(J.char_flip.transformer ?? J.char_flip.airplane, 'attach', 1, 3.0, c, 0, 1.0, 0.6, 0.2), mdl(THEME_MODELS.flip.ringStack, 'rising', 4, 0.5, c, 0.05, 0.9, 3, 3.5), physLayer(makeBall('phys_flip_ult_ball', c, 2), 0, 2.5), pLayer(PARTICLE_PRESETS.ballSpin(c), c, 0, 0.8, 'aura_particles_effect')],
  // Signature utility — set up a bounce court: court boundary + bounce pads + elastic rings + sport-ball spin.
  bounceCourt: (c) => [mdl(THEME_MODELS.flip.torus ?? THEME_MODELS.flip.ringStack ?? J.char_flip.airplane, 'attach', 1, 0.8, c, 0, 0.9, 0.5, 0.3), mdl(THEME_MODELS.flip.ringStack, 'rising', 3, 0.5, c, 0.05, 0.8, 3, 2.4), gLayer('geometry-mesh', GEOM_PRESETS.orbitRing(7), 'shockwave_ring_effect', c, 0, 0.7), gLayer('ground-marker', GEOM_PRESETS.groundMarker(6), 'shockwave_ring_effect', c, 0.05, 0.6), pLayer(PARTICLE_PRESETS.ballSpin(c), c, 0, 0.6, 'orbit_particles_effect')],
};

// ── Bello — wild/nature: real lion/cat/owl/snake yokais + nature fog ──
export const BELLO_SIGNATURES: Record<string, Piece> = {
  lionPride: (c) => [mdl(THEME_MODELS.bello.lions[0], 'burst', 2, 0.6, c, 0, 0.9, 1, 4), mdl(THEME_MODELS.bello.lions[1] ?? THEME_MODELS.bello.lions[0], 'rising', 2, 0.6, c, 0.1, 0.9, 1, 3), pLayer(PARTICLE_PRESETS.leafMotes(c), c, 0, 0.7, 'rising_particles_effect')],
  catPounce: (c) => [mdl(THEME_MODELS.bello.cats[0], 'rising', 3, 0.55, c, 0, 0.8, 1.5, 3), pLayer(PARTICLE_PRESETS.leafMotes(c), c, 0, 0.6, 'rising_particles_effect')],
  owlSpiral: (c) => [mdl(THEME_MODELS.bello.owl, 'orbit', 3, 0.5, c, 0, 0.8, 2, 3)],
  serpentCoil: (c) => [mdl(THEME_MODELS.bello.snake, 'attach', 1, 0.7, c, 0, 0.8, 0.6, 0.4)],
  natureScreen: (c) => [fLayer(FOG_PRESETS.natureFog(c), c, 0.05, 0.7), pLayer(PARTICLE_PRESETS.leafMotes(c), c, 0, 0.7, 'rising_particles_effect')],
  pawMark: (c) => [gLayer('ground-marker', GEOM_PRESETS.groundMarker(4), 'shockwave_ring_effect', c, 0, 0.5, 'target'), gLayer('geometry-mesh', GEOM_PRESETS.shockRing(6), 'shockwave_ring_effect', c, 0.1, 0.6)],
  belloEscort: (c) => [mdl(J.char_bello.airplane, 'orbit', 2, 0.95, c, 0, 0.7, 1.6, 3), pLayer(PARTICLE_PRESETS.leafMotes(c), c, 0, 0.4, 'rising_particles_effect')],
  wildKing: (c) => [mdl(J.char_bello.transformer ?? J.char_bello.airplane, 'attach', 1, 3.0, c, 0, 1.0, 0.6, 0.2), mdl(THEME_MODELS.bello.lions[2] ?? THEME_MODELS.bello.lions[0], 'burst', 3, 0.6, c, 0.05, 0.9, 1, 3.5), pLayer(PARTICLE_PRESETS.leafMotes(c), c, 0, 0.8, 'aura_particles_effect')],
  // Signature utility — summon a wild guide: animal guide circling + footprint marker + nature motes + green fog.
  guideSignal: (c) => [mdl(THEME_MODELS.bello.owl ?? THEME_MODELS.bello.cats[0] ?? J.char_bello.airplane, 'orbit', 2, 0.65, c, 0, 0.9, 1.5, 3), gLayer('ground-marker', GEOM_PRESETS.groundMarker(5), 'shockwave_ring_effect', c, 0, 0.6, 'target'), pLayer(PARTICLE_PRESETS.leafMotes(c), c, 0, 0.7, 'rising_particles_effect'), fLayer(FOG_PRESETS.natureFog(c), c, 0.05, 0.7)],
};

// ── Chase — stealth/scan: real drones, radar, hero-own holographic decoy, data ──
export const CHASE_SIGNATURES: Record<string, Piece> = {
  droneDecoys: (c) => [mdl(THEME_MODELS.chase.drones[0], 'orbit', 3, 0.5, c, 0, 0.8, 2, 3), pLayer(PARTICLE_PRESETS.dataGlints(c), c, 0, 0.5, 'spark_burst_effect')],
  holoSelf: (c) => [mdl(J.char_chase.pose ?? J.char_chase.airplane, 'orbit', 2, 0.7, c, 0, 0.8, 1.5, 2.5), pLayer(PARTICLE_PRESETS.holoScan(c), c, 0, 0.5, 'beam_particles_effect')],
  radarScan: (c) => [mdl(THEME_MODELS.chase.radar, 'attach', 1, 0.6, c, 0, 0.6, 0.5, 0.3), gLayer('scan-overlay', GEOM_PRESETS.scanCone(10), 'radial_burst_effect', c, 0, 0.6), pLayer(PARTICLE_PRESETS.holoScan(c), c, 0, 0.5, 'beam_particles_effect')],
  dataFragment: (c) => [physLayer(makeEnergyFragments('phys_chase_data', c, 8), 0, 1.0), pLayer(PARTICLE_PRESETS.dataGlints(c), c, 0, 0.5, 'spark_burst_effect'), mdl(THEME_MODELS.chase.drones[1] ?? THEME_MODELS.chase.drones[0], 'burst', 2, 0.4, c, 0, 0.6, 2, 3)],
  weakpointRing: (c) => [gLayer('geometry-mesh', GEOM_PRESETS.orbitRing(1), 'shockwave_ring_effect', c, 0, 0.5, 'target'), gLayer('lock-line', GEOM_PRESETS.lockLine(10), 'radial_burst_effect', c, 0, 0.4, 'target')],
  totemMark: (c) => [mdl(THEME_MODELS.chase.totem, 'attach', 1, 0.6, c, 0, 0.7, 0.4, 0.3), pLayer(PARTICLE_PRESETS.dataGlints(c), c, 0, 0.5, 'spark_burst_effect')],
  blackboxAssault: (c) => [mdl(J.char_chase.transformer ?? J.char_chase.airplane, 'attach', 1, 3.0, c, 0, 1.0, 0.6, 0.2), mdl(THEME_MODELS.chase.drones[0], 'orbit', 4, 0.5, c, 0.05, 0.9, 2.4, 3.5), pLayer(PARTICLE_PRESETS.dataGlints(c), c, 0, 0.8, 'aura_particles_effect')],
  // Signature utility — deploy a scan relay: relay node + grid dome + scan lines + weakpoint ring + data glints.
  scanRelay: (c) => [mdl(THEME_MODELS.chase.radar ?? THEME_MODELS.chase.drones[0] ?? J.char_chase.airplane, 'attach', 1, 0.8, c, 0, 0.9, 0.5, 0.3), gLayer('geometry-mesh', GEOM_PRESETS.scanCone(10), 'energy_dome_effect', c, 0, 0.7), gLayer('scan-overlay', GEOM_PRESETS.lockLine(10), 'radial_burst_effect', c, 0.05, 0.5, 'target'), gLayer('ground-marker', GEOM_PRESETS.groundMarker(6), 'shockwave_ring_effect', c, 0.05, 0.6), pLayer(PARTICLE_PRESETS.dataGlints(c), c, 0, 0.6, 'spark_burst_effect')],
};

export const SIGNATURE_LIBRARY: Record<string, Record<string, Piece>> = {
  char_jett: JETT_SIGNATURES, char_jerome: JEROME_SIGNATURES, char_paul: PAUL_SIGNATURES, char_donnie: DONNIE_SIGNATURES,
  char_todd: TODD_SIGNATURES, char_flip: FLIP_SIGNATURES, char_bello: BELLO_SIGNATURES, char_chase: CHASE_SIGNATURES,
};

export function signaturePieces(characterId: string): Record<string, Piece> {
  return SIGNATURE_LIBRARY[characterId] ?? {};
}
