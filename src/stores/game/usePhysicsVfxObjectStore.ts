import { nanoid } from 'nanoid';
import { createEditorCollection } from './createEditorCollection';
import type { PhysicsVfxObjectDefinition } from '../../types/physicsVfxTypes';
import { SEED_PHYSICS_VFX_OBJECTS } from '../../data/cinematic-vfx/physicsVfxObjectSeeds';

// Editable physics-object archetypes (🎨 VFX Quality tab · Physics). Each entry tunes a kinematic VFX kind
// (type/shape/mass/gravity/restitution/friction/lifetime/count/spread/speed/fade).
export const usePhysicsVfxObjectStore = createEditorCollection<PhysicsVfxObjectDefinition>({
  storageKey: 'aero-rescue-editor-physics-vfx-v1',
  seed: SEED_PHYSICS_VFX_OBJECTS,
  makeId: () => `pvfxobj_${nanoid(6)}`,
});
