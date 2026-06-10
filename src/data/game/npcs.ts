import type { NPCDefinition } from '../../types/game/npc';

// Seed — 2 NPCs who give a mission a reason + basic interaction. Dialogue trees wired in a later batch.
export const SEED_NPCS: NPCDefinition[] = [
  {
    id: 'npc_postmistress',
    codename: 'Postmistress Pip',
    nameZhTW: '郵務琪琪',
    sourceConfidence: 'GameAdaptation',
    locationId: 'loc_brightcity',
    role: '郵局站長',
    description: '亮亮城郵局的站長,總是準時等著重要的包裹。',
    color: '#f472b6',
    missionId: 'mission_parcel_run',
  },
  {
    id: 'npc_beachkid',
    codename: 'Sandy',
    nameZhTW: '小沙',
    sourceConfidence: 'GameAdaptation',
    locationId: 'loc_coralisle',
    role: '海邊小孩',
    description: '在珊瑚島沙灘玩耍的小孩,風箏被海風吹走了。',
    color: '#fbbf24',
    missionId: 'mission_lost_kite',
  },
];
