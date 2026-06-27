// Batch J — Random Boss encounters via a "threat gauge". A zone references a RandomBossPool
// (MissionZoneDefinition.randomBossPoolId). While the player fights small enemies in a non-boss combat
// segment, a threat gauge fills from kills + elapsed time. When it crosses `threshold`, the
// RandomBossDirector air-drops a weighted-random boss from the pool's candidates (respecting a cooldown
// and a per-zone cap), reusing the existing data-driven BossDirector. Everything here is an editor
// collection (createEditorCollection) edited in the 👹 Boss tab, so it is fully restorable in Edit Mode.

export interface RandomBossPoolEntry {
  bossId: string; // references a BossDefinition (useBossDefinitionStore)
  weight: number; // relative selection weight (>0). Higher = more likely.
}

export interface RandomBossThreatConfig {
  perKill: number; // threat added each time a small enemy is defeated
  perSecond: number; // passive threat added per second while in an active combat segment
  threshold: number; // gauge value that triggers a random-boss air-drop
  cooldownSeconds: number; // minimum seconds between two random-boss drops in the same zone
  maxPerZone: number; // hard cap of random bosses per zone visit (0 = unlimited)
}

export interface RandomBossPoolDefinition {
  id: string;
  name: string;
  enabled: boolean;
  candidates: RandomBossPoolEntry[];
  threat: RandomBossThreatConfig;
  // Batch K — dramatic environment theme applied while a random boss from this pool is alive; the active
  // segment's own theme is restored once the boss is defeated. Optional (undefined = keep the segment theme).
  bossEnvironmentThemeId?: string;
  editorMeta?: {
    notes?: string;
    color?: string;
  };
}
