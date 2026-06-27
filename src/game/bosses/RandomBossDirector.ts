import { liveTargets } from '../../stores/game/combatTargetStore';
import { useBossStore } from '../../stores/game/useBossStore';
import { getBoss } from '../../stores/game/useBossEditorStore';
import { getRandomBossPool } from '../../stores/game/editorCombatStore';
import { activeZone, activeSegment } from '../advanced-mission-zone/AdvancedMissionZoneDirector';
import type { RandomBossPoolDefinition } from '../../types/game/randomBoss';
import { startBoss } from './BossDirector';
import { robotHandle } from '../destination/robotHandle';
import { applyEnvironmentTheme, applySegmentEnvironment } from '../environment/applyEnvironmentTheme';

// Batch J — Random Boss via a threat gauge. Driven each frame from AdvancedMissionZoneDirectorHost while in
// ZONE_SEGMENT_GAMEPLAY. The active zone's randomBossPoolId selects an (editable) pool; the gauge fills from
// small-enemy kills + elapsed combat time and, at threshold, air-drops a weighted-random boss from the pool
// (reusing the data-driven BossDirector). Respects a cooldown + a per-zone cap, and never stacks on top of a
// scripted boss segment or an already-active boss. Pure module state — reset per zone via resetRandomBoss().

interface RandomBossRuntime {
  zoneId?: string;
  gauge: number;
  threshold: number;
  lastDropAtS: number;
  drops: number;
  enabled: boolean;
}

const counted = new Set<string>(); // defeated enemy target ids already added to the gauge
const rt: RandomBossRuntime = { zoneId: undefined, gauge: 0, threshold: 0, lastDropAtS: -1e9, drops: 0, enabled: false };
// Batch K — when a drop applied a dramatic boss environment, restore the segment theme once the boss dies.
let envRestorePending = false;

const nowS = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

export function resetRandomBoss(zoneId?: string): void {
  counted.clear();
  rt.zoneId = zoneId;
  rt.gauge = 0;
  rt.threshold = 0;
  rt.lastDropAtS = -1e9;
  rt.drops = 0;
  rt.enabled = false;
  envRestorePending = false;
}

// A boss is "in progress" (scripted or random) when a runtime exists and isn't defeated/inactive.
function bossInProgress(): boolean {
  const r = useBossStore.getState().runtime;
  return !!r && r.status !== 'defeated' && r.status !== 'inactive';
}

// Weighted pick over candidates whose boss definition exists and weight > 0. Returns a bossId or undefined.
function pickBoss(pool: RandomBossPoolDefinition): string | undefined {
  const valid = pool.candidates.filter((c) => c.weight > 0 && getBoss(c.bossId));
  if (valid.length === 0) return undefined;
  const total = valid.reduce((s, c) => s + c.weight, 0);
  let r = Math.random() * total;
  for (const c of valid) {
    r -= c.weight;
    if (r <= 0) return c.bossId;
  }
  return valid[valid.length - 1].bossId;
}

export function update(dt: number): void {
  const zone = activeZone();
  const pool = getRandomBossPool(zone?.randomBossPoolId);
  rt.enabled = !!(pool && pool.enabled);
  if (!zone || !pool || !pool.enabled) { rt.threshold = 0; return; }
  rt.threshold = pool.threat.threshold;

  // Pause accrual during a scripted boss segment or while any boss is already active (random or scripted).
  const seg = activeSegment();
  if (seg?.segmentType === 'boss' || bossInProgress()) return;

  // A random boss just died — restore the segment's own environment (the dramatic boss theme was applied on drop).
  if (envRestorePending) {
    applySegmentEnvironment(seg, zone.environmentThemeId);
    envRestorePending = false;
  }

  // Accrue from kills (each defeated small enemy counted once) + passive time.
  for (const t of liveTargets) {
    if (!t.isEnemy || t.defeatedAt <= 0 || counted.has(t.id)) continue;
    counted.add(t.id);
    rt.gauge += pool.threat.perKill;
  }
  rt.gauge += pool.threat.perSecond * Math.max(0, dt);

  // Trigger conditions: gauge full, off cooldown, under the per-zone cap.
  const capReached = pool.threat.maxPerZone > 0 && rt.drops >= pool.threat.maxPerZone;
  const offCooldown = nowS() - rt.lastDropAtS >= pool.threat.cooldownSeconds;
  if (rt.gauge >= pool.threat.threshold && offCooldown && !capReached) {
    const bossId = pickBoss(pool);
    rt.gauge = 0;
    if (bossId) {
      rt.lastDropAtS = nowS();
      rt.drops += 1;
      startBoss(bossId, [robotHandle.pos.x, 0, robotHandle.pos.z]); // Batch P — drop on the player
      // Swap to the dramatic boss environment for the duration of the fight (restored on defeat).
      if (pool.bossEnvironmentThemeId) {
        applyEnvironmentTheme(pool.bossEnvironmentThemeId);
        envRestorePending = true;
      }
    }
  }
}

// Read-only snapshot for HUD / tests / debug.
export function getRandomBossRuntime(): Readonly<RandomBossRuntime> {
  return rt;
}

// Debug: force the gauge to threshold so the next update drops a boss immediately.
export function debugForceRandomBoss(): void {
  rt.gauge = Math.max(rt.gauge, rt.threshold || 1);
  rt.lastDropAtS = -1e9;
}
