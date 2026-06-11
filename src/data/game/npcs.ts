import type { NPCDefinition } from '../../types/game/npc';

// Seed — NPCs who give a mission a reason + basic interaction. Mina greets the player at Sunny Harbor
// (Batch 7 vertical slice); her dialogue tree starts the parcel mission. All placement is gizmo-editable.
export const SEED_NPCS: NPCDefinition[] = [
  {
    id: 'npc_mina',
    codename: 'Mina Harbor Kid',
    name: 'Mina',
    sourceConfidence: 'GameAdaptation',
    locationId: 'loc_sunnyharbor',
    role: 'Local helper',
    description: 'A cheerful harbor kid who knows everyone in Sunny Harbor and where everything goes.',
    color: '#34d399',
    missionId: 'mission_parcel_run',
    dialogueTreeId: 'dlg_mina_harbor',
    position: [8, 0, 4],
    rotationY: 200,
    interactionRadius: 4,
    initialState: 'waving',
  },
  {
    id: 'npc_postmistress',
    codename: 'Postmistress Pip',
    name: 'Postmistress Pip',
    sourceConfidence: 'GameAdaptation',
    locationId: 'loc_sunnyharbor',
    role: 'Post Office Manager',
    description: 'Runs the harbor post office and is always on time for an important parcel.',
    color: '#f472b6',
    missionId: 'mission_parcel_run',
    position: [30, 0, 2],
    rotationY: 180,
    interactionRadius: 4,
    initialState: 'waiting',
  },
  {
    id: 'npc_beachkid',
    codename: 'Sandy',
    name: 'Sandy',
    sourceConfidence: 'GameAdaptation',
    locationId: 'loc_coralisle',
    role: 'Beach Kid',
    description: 'A kid playing on Coral Isle beach whose kite was blown away by the wind.',
    color: '#fbbf24',
    missionId: 'mission_lost_kite',
    initialState: 'worried',
  },
];
