import type { PathFollowerDef } from '../../types/pathFollower';

// Phase E — test followers in rescue_hq riding the Phase B curve paths: a slow NPC walker on the straight, and
// a two-vehicle convoy on the curve that yields to incidents and can reroute. Demonstrates spacing + smooth
// curve following + incident reaction. Authored further in 🛣 Tracks → Followers.
export const FOLLOWER_SEED: PathFollowerDef[] = [
  {
    id: 'fol_npc_walker', name: '散步居民', areaId: 'rescue_hq', kind: 'npc', pathId: 'path_test_straight',
    count: 2, speed: 2.4, lookAhead: 4, minGap: 2, color: '#f59e0b', scale: 1.6,
    size: [0.35, 1.6, 0.35], yieldToIncidents: true, canReroute: false, loop: true, enabled: true,
  },
  {
    id: 'fol_vehicle_convoy', name: '社區接駁車', areaId: 'rescue_hq', kind: 'vehicle', pathId: 'path_test_curve',
    count: 2, speed: 8, lookAhead: 8, minGap: 4, color: '#38bdf8', scale: 2.4,
    size: [0.9, 1.2, 2.2], yieldToIncidents: true, canReroute: true, loop: true, enabled: true,
  },
  {
    id: 'fol_main_convoy', name: '中央大道車流', areaId: 'main_road', kind: 'vehicle', pathId: 'path_main_road',
    count: 3, speed: 9, lookAhead: 8, minGap: 5, color: '#94a3b8', scale: 2.4,
    size: [0.9, 1.2, 2.4], yieldToIncidents: true, obeyTraffic: true, canReroute: false, loop: true, enabled: true,
  },
];
