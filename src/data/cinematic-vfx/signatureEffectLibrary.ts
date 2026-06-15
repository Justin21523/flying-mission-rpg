import type { CinematicEffectLayerDefinition } from '../../types/cinematicVfxTypes';
import { pLayer, fLayer, gLayer, mLayer, physLayer } from './cinematicVfxBuilders';
import { GEOM_PRESETS } from './geometryEffectPresets';
import { PARTICLE_PRESETS } from './particlePresets';
import { FOG_PRESETS } from './fogCloudPresets';
import { MODEL_PRESETS } from './modelEffectPresets';
import { makeDebris, makeEnergyFragments } from '../../game/vfx/physics/PhysicsDebrisRuntime';
import { makeProjectile } from '../../game/vfx/physics/PhysicsProjectileRuntime';
import { makeAssemblyPanels, makeShieldTiles, makeBarrierWall } from '../../game/vfx/physics/PhysicsPanelRuntime';
import { makeBall } from '../../game/vfx/physics/PhysicsBallRuntime';
import { makeRubble, makeDrillFragments } from '../../game/vfx/physics/PhysicsRubbleRuntime';

// Per-character signature effect pieces (Batch F.6). Each piece is a builder → CinematicEffectLayerDefinition[]
// themed to that hero's visual language; abilities compose from these so every effect is character-distinct
// (model/geometry/physics-driven, particles as accents). Keys match characterVfxStyleProfiles.signatureObjects.

type Piece = (color: string) => CinematicEffectLayerDefinition[];

// ── Jett — fast-linear: jet trails / afterimage / wind ──
export const JETT_SIGNATURES: Record<string, Piece> = {
  speedSplineRoute: (c) => [gLayer('lock-line', GEOM_PRESETS.lockLine(18), 'radial_burst_effect', c, 0, 0.5)],
  afterimageBurst: (c) => [gLayer('geometry-mesh', GEOM_PRESETS.shockRing(4), 'shockwave_ring_effect', c, 0.05, 0.4), pLayer(PARTICLE_PRESETS.trail(c), c, 0, 0.5, 'speed_line_effect')],
  windTunnelFog: (c) => [fLayer(FOG_PRESETS.windFog(c), c, 0.05, 0.7)],
  rescueLockMarker: (c) => [gLayer('ground-marker', GEOM_PRESETS.groundMarker(5), 'shockwave_ring_effect', c, 0, 0.5, 'target')],
  thrusterStreak: (c) => [pLayer(PARTICLE_PRESETS.sparks(c), c, 0, 0.4, 'speed_line_effect'), physLayer(makeDebris('phys_jett_debris', c, 8), 0.1, 1.1)],
};

// ── Jerome — rhythmic-circular: stage / spotlight / beat ──
export const JEROME_SIGNATURES: Record<string, Piece> = {
  stageRing: (c) => [gLayer('ground-marker', GEOM_PRESETS.groundMarker(6), 'shockwave_ring_effect', c, 0, 0.6)],
  spotlightCone: (c) => [gLayer('geometry-mesh', GEOM_PRESETS.scanCone(8), 'energy_dome_effect', c, 0, 0.6)],
  rhythmPulseBar: (c) => [gLayer('geometry-mesh', GEOM_PRESETS.shockRing(6), 'shockwave_ring_effect', c, 0.15, 0.5)],
  dancerAfterimage: (c) => [mLayer('model-component', { ...MODEL_PRESETS.droneSwarm(), count: 3, scale: 0.6 }, 'model_orbit_swarm', c, 0.1, 0.8)],
  sparkleMotes: (c) => [pLayer(PARTICLE_PRESETS.motes(c), c, 0, 0.6)],
};

// ── Paul — defensive-grid: shield panels / barriers / lockdown ──
export const PAUL_SIGNATURES: Record<string, Piece> = {
  policeShieldPanel: (c) => [gLayer('shield-panel', GEOM_PRESETS.shieldPanel(), 'radial_burst_effect', c, 0, 0.6), physLayer(makeShieldTiles('phys_paul_tiles', c, 8), 0, 4)],
  roadBarrierWall: (c) => [physLayer(makeBarrierWall('phys_paul_barrier', c, 5), 0, 5)],
  lockdownGrid: (c) => [gLayer('ground-marker', GEOM_PRESETS.groundMarker(8), 'shockwave_ring_effect', c, 0, 0.8), gLayer('geometry-mesh', GEOM_PRESETS.orbitRing(7), 'shockwave_ring_effect', c, 0.1, 0.8)],
  containmentCuff: (c) => [gLayer('geometry-mesh', GEOM_PRESETS.orbitRing(1.2), 'shockwave_ring_effect', c, 0, 0.5, 'target')],
  signalLights: (c) => [pLayer(PARTICLE_PRESETS.sparks(c), c, 0, 0.4)],
};

// ── Donnie — mechanical-assembly: tools / panels / fragments ──
export const DONNIE_SIGNATURES: Record<string, Piece> = {
  toolArmSwarm: (c) => [mLayer('model-component', MODEL_PRESETS.toolSwarm(), 'model_orbit_swarm', c, 0, 0.8)],
  metalPanelAssembly: (c) => [physLayer(makeAssemblyPanels('phys_donnie_panels', c, 6), 0, 4)],
  repairNode: (c) => [gLayer('geometry-mesh', GEOM_PRESETS.orbitRing(1), 'shockwave_ring_effect', c, 0, 0.6, 'target')],
  magneticScrap: (c) => [physLayer(makeProjectile('phys_donnie_scrap', c, 'energy-fragment', 6), 0, 1.2)],
  constructionGrid: (c) => [gLayer('ground-marker', GEOM_PRESETS.groundMarker(5), 'shockwave_ring_effect', c, 0, 0.6), pLayer(PARTICLE_PRESETS.sparks(c), c, 0, 0.4)],
};

// ── Todd — heavy-ground-impact: drill / crack / rubble ──
export const TODD_SIGNATURES: Record<string, Piece> = {
  spinningDrill: (c) => [gLayer('geometry-mesh', GEOM_PRESETS.scanCone(4), 'energy_dome_effect', c, 0, 0.5), physLayer(makeDrillFragments('phys_todd_drill', c, 10), 0.05, 1.3)],
  groundCrack: (c) => [gLayer('ground-marker', GEOM_PRESETS.groundMarker(7), 'shockwave_ring_effect', c, 0, 0.6)],
  rockRubble: (c) => [physLayer(makeRubble('phys_todd_rubble', c, 14), 0.05, 1.6)],
  dirtCloud: (c) => [fLayer(FOG_PRESETS.impactDust(c), c, 0.05, 0.7)],
  craterRing: (c) => [gLayer('geometry-mesh', GEOM_PRESETS.shockRing(7), 'shockwave_ring_effect', c, 0, 0.5)],
};

// ── Flip — bouncy-ricochet: balls / court / bounce ──
export const FLIP_SIGNATURES: Record<string, Piece> = {
  sportBall: (c) => [physLayer(makeBall('phys_flip_ball', c, 1), 0, 2.5)],
  bounceTrajectory: (c) => [gLayer('lock-line', GEOM_PRESETS.lockLine(12), 'radial_burst_effect', c, 0, 0.4)],
  stadiumBoundary: (c) => [gLayer('geometry-mesh', GEOM_PRESETS.orbitRing(7), 'shockwave_ring_effect', c, 0, 0.7)],
  reboundPanel: (c) => [gLayer('shield-panel', GEOM_PRESETS.shieldPanel(), 'radial_burst_effect', c, 0, 0.5)],
  scoreFlash: (c) => [pLayer(PARTICLE_PRESETS.sparks(c), c, 0, 0.4)],
};

// ── Bello — organic-wave: animal spirits / sound / nature ──
export const BELLO_SIGNATURES: Record<string, Piece> = {
  animalSpirit: (c) => [mLayer('model-component', MODEL_PRESETS.animalSpirit(), 'model_particle_burst', c, 0, 0.9)],
  soundCone: (c) => [gLayer('geometry-mesh', GEOM_PRESETS.scanCone(9), 'radial_burst_effect', c, 0, 0.5)],
  natureFog: (c) => [fLayer(FOG_PRESETS.natureFog(c), c, 0.05, 0.7)],
  pawMark: (c) => [gLayer('ground-marker', GEOM_PRESETS.groundMarker(4), 'shockwave_ring_effect', c, 0, 0.5, 'target')],
  echoRing: (c) => [gLayer('geometry-mesh', GEOM_PRESETS.shockRing(6), 'shockwave_ring_effect', c, 0.1, 0.6)],
};

// ── Chase — stealth-scan: scan grid / weakpoint / data ──
export const CHASE_SIGNATURES: Record<string, Piece> = {
  scanCone: (c) => [gLayer('scan-overlay', GEOM_PRESETS.scanCone(10), 'radial_burst_effect', c, 0, 0.6)],
  dataGrid: (c) => [gLayer('ground-marker', GEOM_PRESETS.groundMarker(6), 'shockwave_ring_effect', c, 0, 0.6)],
  weakpointRing: (c) => [gLayer('geometry-mesh', GEOM_PRESETS.orbitRing(1), 'shockwave_ring_effect', c, 0, 0.5, 'target')],
  hologramDecoy: (c) => [mLayer('model-component', MODEL_PRESETS.decoy(), 'model_orbit_swarm', c, 0, 0.9)],
  dataFragment: (c) => [physLayer(makeEnergyFragments('phys_chase_data', c, 8), 0, 1.0), pLayer(PARTICLE_PRESETS.electric(c), c, 0, 0.4)],
};

export const SIGNATURE_LIBRARY: Record<string, Record<string, Piece>> = {
  char_jett: JETT_SIGNATURES, char_jerome: JEROME_SIGNATURES, char_paul: PAUL_SIGNATURES, char_donnie: DONNIE_SIGNATURES,
  char_todd: TODD_SIGNATURES, char_flip: FLIP_SIGNATURES, char_bello: BELLO_SIGNATURES, char_chase: CHASE_SIGNATURES,
};

export function signaturePieces(characterId: string): Record<string, Piece> {
  return SIGNATURE_LIBRARY[characterId] ?? {};
}
