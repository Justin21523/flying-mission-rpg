import type { BossAttackPatternDefinition } from '../../types/game/boss';

// Boss attack patterns (Batch F). Per-pattern cooldown → warning (castTime) → execution state machine.
// Execution routes through injected deps (spawn projectile / trigger wave / damage player) so it's pure +
// unit-testable and never re-implements damage. Hit-volume attacks damage the player via deps.damagePlayer.

interface PatternState { phase: 'idle' | 'warning'; readyAt: number; warnUntil: number }
const states = new Map<string, PatternState>();

// Most recent attack telegraph (for the BossWarningToast HUD).
let lastWarn: { patternType: string; atMs: number } | null = null;
export function getLastWarning(): { patternType: string; atMs: number } | null { return lastWarn; }

export interface BossAttackDeps {
  now: number; // seconds
  bossPos: { x: number; z: number };
  playerPos: { x: number; z: number };
  damageMultiplier: number;
  damagePlayer: (amount: number) => void;
  spawnProjectile: (pattern: BossAttackPatternDefinition) => void;
  triggerSummonWave: (waveId: string) => void;
  playVisual: (effectId: string | undefined, x: number, z: number) => void;
}

export interface BossAttackEvent { patternId: string; kind: 'warning' | 'execute'; patternType: string }

function st(id: string): PatternState {
  let s = states.get(id);
  if (!s) { s = { phase: 'idle', readyAt: 0, warnUntil: 0 }; states.set(id, s); }
  return s;
}

function inRange(p: BossAttackPatternDefinition, deps: BossAttackDeps): boolean {
  const r = p.hitVolume.radius ?? p.hitVolume.length ?? 6;
  const dx = deps.playerPos.x - deps.bossPos.x, dz = deps.playerPos.z - deps.bossPos.z;
  return dx * dx + dz * dz <= r * r;
}

function execute(p: BossAttackPatternDefinition, deps: BossAttackDeps): void {
  deps.playVisual(p.executionVisualId, deps.bossPos.x, deps.bossPos.z);
  if (p.patternType === 'summon-wave') { if (p.summonWaveId) deps.triggerSummonWave(p.summonWaveId); return; }
  if (p.patternType === 'targeted-projectile') { deps.spawnProjectile(p); return; }
  // hit-volume attacks (shield-pulse / ground-shockwave / sweep-beam / charge): damage player if in range
  const amount = p.damageEventTemplate?.amount ?? 0;
  if (amount > 0 && inRange(p, deps)) deps.damagePlayer(Math.round(amount * deps.damageMultiplier));
}

// Tick the active attack patterns for the current phase. Returns the warning/execute events this frame.
export function update(patterns: BossAttackPatternDefinition[], deps: BossAttackDeps): BossAttackEvent[] {
  const events: BossAttackEvent[] = [];
  for (const p of patterns) {
    const s = st(p.id);
    if (s.phase === 'idle' && deps.now >= s.readyAt) {
      if (p.castTimeSeconds > 0) {
        s.phase = 'warning';
        s.warnUntil = deps.now + p.castTimeSeconds;
        deps.playVisual(p.warningVisualId, deps.bossPos.x, deps.bossPos.z);
        lastWarn = { patternType: p.patternType, atMs: deps.now * 1000 };
        events.push({ patternId: p.id, kind: 'warning', patternType: p.patternType });
      } else {
        execute(p, deps);
        s.readyAt = deps.now + p.cooldownSeconds;
        events.push({ patternId: p.id, kind: 'execute', patternType: p.patternType });
      }
    } else if (s.phase === 'warning' && deps.now >= s.warnUntil) {
      execute(p, deps);
      s.phase = 'idle';
      s.readyAt = deps.now + p.cooldownSeconds;
      events.push({ patternId: p.id, kind: 'execute', patternType: p.patternType });
    }
  }
  return events;
}

// Interrupt a warming-up attack (counterplay placeholder): cancels it back to cooldown.
export function interruptPattern(patternId: string, now: number): boolean {
  const s = states.get(patternId);
  if (s && s.phase === 'warning') { s.phase = 'idle'; s.readyAt = now + 1; return true; }
  return false;
}

export function reset(): void {
  states.clear();
  lastWarn = null;
}
