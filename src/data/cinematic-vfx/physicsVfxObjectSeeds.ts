import type { PhysicsVfxObjectDefinition } from '../../types/physicsVfxTypes';
import { makeDebris, makeEnergyFragments } from '../../game/vfx/physics/PhysicsDebrisRuntime';
import { makeProjectile } from '../../game/vfx/physics/PhysicsProjectileRuntime';
import { makeAssemblyPanels, makeShieldTiles, makeBarrierWall } from '../../game/vfx/physics/PhysicsPanelRuntime';
import { makeBall } from '../../game/vfx/physics/PhysicsBallRuntime';
import { makeRubble, makeDrillFragments } from '../../game/vfx/physics/PhysicsRubbleRuntime';

// Catalogue of the physics-object archetypes (Batch F.6) used across the signature library — surfaced in the
// 🎨 VFX Quality tab · Physics so each kind's mass/gravity/restitution/lifetime/count/spread is tunable.
export const SEED_PHYSICS_VFX_OBJECTS: PhysicsVfxObjectDefinition[] = [
  makeDebris('seed_debris', '#9fd0ff', 8),
  makeEnergyFragments('seed_energy_fragment', '#66ffd0', 8),
  makeProjectile('seed_scrap', '#ffcb6b', 'energy-fragment', 6),
  makeAssemblyPanels('seed_metal_panels', '#ffaa44', 6),
  makeShieldTiles('seed_shield_tiles', '#4f8cff', 8),
  makeBarrierWall('seed_barrier_wall', '#ff8844', 5),
  makeBall('seed_sport_ball', '#ff7733', 1),
  makeRubble('seed_rubble', '#b08858', 14),
  makeDrillFragments('seed_drill_fragments', '#caa15a', 10),
];
