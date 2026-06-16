import type { BossArenaDefinition } from '../../types/game/boss';

// Harbor Core arena (Batch F) — matches the seed zone's seg_harbor_core bounds. Locked on boss start,
// unlocked on defeat.
export const SEED_BOSS_ARENAS: BossArenaDefinition[] = [
  {
    id: 'harbor_core_arena',
    zoneId: 'zone_sunny_harbor_advanced_foundation',
    segmentId: 'seg_harbor_core',
    name: 'Harbor Core Arena',
    bounds: { center: [16, 0, 8], size: [24, 8, 24] },
    entryMarkerId: 'arena_entry',
    bossSpawnPointId: 'arena_boss_spawn',
    playerStartPointId: 'arena_player_start',
    bossSpawnPosition: [16, 0, 14],
    playerStartPosition: [16, 0, 0],
    arenaLock: { lockOnStart: true, unlockOnBossDefeat: true, boundaryModelPresetId: 'arena_ring' },
    supportBeaconIds: [],
    supplyStationIds: [],
    camera: { useArenaCameraHints: true, minDistance: 8, maxDistance: 22 },
    editorMeta: { debugColor: '#38bdf8' },
  },
  // Batch I — Glitch Hive arena (matches seg_glitch_hive bounds).
  {
    id: 'glitch_hive_arena',
    zoneId: 'zone_sunny_harbor_advanced_foundation',
    segmentId: 'seg_glitch_hive',
    name: 'Glitch Hive Arena',
    bounds: { center: [22, 0, -36], size: [24, 8, 24] },
    entryMarkerId: 'hive_entry',
    bossSpawnPointId: 'hive_boss_spawn',
    playerStartPointId: 'hive_player_start',
    bossSpawnPosition: [22, 0, -30],
    playerStartPosition: [22, 0, -42],
    arenaLock: { lockOnStart: true, unlockOnBossDefeat: true, boundaryModelPresetId: 'arena_ring' },
    supportBeaconIds: [],
    supplyStationIds: [],
    camera: { useArenaCameraHints: true, minDistance: 8, maxDistance: 22 },
    editorMeta: { debugColor: '#84cc16' },
  },
];
