import type { NPCDefinition } from '../../types/game/npc';

// Seed — 2 NPCs who give a mission a reason + basic interaction. Dialogue trees wired in a later batch.
export const SEED_NPCS: NPCDefinition[] = [
  {
    id: 'npc_postmistress',
    codename: 'Postmistress Pip',
    name: 'Postmistress Pip',
    sourceConfidence: 'GameAdaptation',
    locationId: 'loc_brightcity',
    role: 'Post Office Manager',
    description: 'Runs the Bright City post office and is always on time for an important parcel.',
    color: '#f472b6',
    missionId: 'mission_parcel_run',
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
  },
];
