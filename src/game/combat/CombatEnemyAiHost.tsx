import { useFrame } from '@react-three/fiber';
import { liveTargets, type CombatTarget } from '../../stores/game/combatTargetStore';
import { liveSpawns } from '../../stores/game/combatSpawnStore';
import { getCombatSkill, getBossPhases, getEnemyDef } from '../../stores/game/editorCombatStore';
import { robotHandle } from '../destination/robotHandle';
import { applyDamageToPlayer } from './CombatDirector';
import { spawnFromSkill } from './skillBehaviors';
import { isSpawnSkill } from './skillBehaviors';
import { bossActivePhase, spawnEnemyFromDef } from './enemyRuntime';
import { stepEnemyAi } from './enemyAi';
import { spawnGroup } from './enemySpawnDirector';
import { applySquadTactics } from './squadCoordinator';
import { getDecoyTargetFor } from '../support-combat/SupportThreatController';
import type { SkillCaster } from './SkillRuntime';

// MVP enemy + boss AI: each live enemy approaches the player (kiters keep range, turrets hold), and casts
// its skills on cooldown. Enemy/boss-faction spawns + melee hits damage the PLAYER via CombatDirector. The
// boss swaps its active skill set + spawns minions as its HP crosses phase thresholds. Frame-throttled.

const CAST_GAP = 0.9; // min seconds between any two casts by one enemy
const nowS = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

function castEnemySkill(enemy: CombatTarget, skillId: string, playerX: number, playerZ: number, t: number): void {
  const skill = getCombatSkill(skillId);
  if (!skill) return;
  const cd = enemy.skillCooldowns ?? (enemy.skillCooldowns = {});
  if (t < (cd[skillId] ?? 0)) return;
  cd[skillId] = t + Math.max(0.5, skill.cooldownSeconds);
  cd.__gap = t + CAST_GAP;

  const dx = playerX - enemy.x, dz = playerZ - enemy.z;
  const caster: SkillCaster = { characterId: enemy.id, x: enemy.x, y: enemy.y, z: enemy.z, headingRad: Math.atan2(dx, dz) };

  if (isSpawnSkill(skill)) {
    spawnFromSkill(skill, caster); // faction enemy/boss → targets the player
    return;
  }
  // Hit-volume melee/shockwave/line — if the player is within reach, deal the skill's damage.
  const reach = skill.hitVolume.radius ?? skill.hitVolume.length ?? enemy.attackRange ?? 3;
  if (dx * dx + dz * dz <= reach * reach) {
    const dmg = skill.damageEvents?.[0]?.amount ?? 8;
    applyDamageToPlayer(dmg);
    // Wave 1 — vampiric affix: heal a fraction of damage dealt to the player.
    const ls = enemy.aiData?.affixLifesteal;
    if (ls) enemy.hp = Math.min(enemy.maxHp, enemy.hp + dmg * ls);
  }
}

// Batch I — Repair Wisp heals the nearest damaged enemy ally within range (in place; read each frame).
function healNearestAlly(wisp: CombatTarget, range: number, amount: number): void {
  let best: CombatTarget | undefined; let bestD = range * range;
  for (const a of liveTargets) {
    if (!a.isEnemy || a.defeatedAt || a.id === wisp.id || a.hp >= a.maxHp) continue;
    const d = (a.x - wisp.x) ** 2 + (a.z - wisp.z) ** 2;
    if (d <= bestD) { bestD = d; best = a; }
  }
  if (best) best.hp = Math.min(best.maxHp, best.hp + amount);
}

// Wave 2 — buffer affixes a shield to nearby enemy allies (capped). Allies without a shield gain a temp one.
function shieldNearbyAllies(buffer: CombatTarget, range: number, amount: number): void {
  const r2 = range * range;
  for (const a of liveTargets) {
    if (!a.isEnemy || a.defeatedAt || a.id === buffer.id) continue;
    if ((a.x - buffer.x) ** 2 + (a.z - buffer.z) ** 2 > r2) continue;
    a.maxShield = Math.max(a.maxShield ?? 0, amount);
    a.shield = Math.min(a.maxShield, (a.shield ?? 0) + amount * 0.5);
  }
}

// Wave 2 — live player projectiles, for the dodger to sidestep.
function playerThreats(): { x: number; z: number; vx: number; vz: number }[] {
  const out: { x: number; z: number; vx: number; vz: number }[] = [];
  for (const s of liveSpawns) {
    if (s.faction === 'player' && s.kind === 'projectile' && !s.hasImpacted) out.push({ x: s.x, z: s.z, vx: s.vx, vz: s.vz });
  }
  return out;
}

function updateBossPhase(enemy: CombatTarget): void {
  if (!enemy.bossId) return;
  const phases = getBossPhases(enemy.bossId);
  if (phases.length === 0) return;
  const phase = bossActivePhase(phases, enemy.hp / enemy.maxHp);
  if (!phase) return;
  const idx = phases.findIndex((p) => p.id === phase.id);
  if (idx === enemy.bossPhaseIndex) return;
  enemy.bossPhaseIndex = idx;
  enemy.skillIds = [...phase.skillIds];
  for (const m of phase.spawnMinions ?? []) {
    const def = getEnemyDef(m.enemyId);
    if (!def) continue;
    for (let i = 0; i < m.count; i++) {
      const ang = Math.random() * Math.PI * 2;
      spawnEnemyFromDef(def, enemy.x + Math.cos(ang) * 4, enemy.z + Math.sin(ang) * 4);
    }
  }
  if (phase.enrageMoveSpeedMult && enemy.moveSpeed) enemy.moveSpeed *= phase.enrageMoveSpeedMult;
}

export const CombatEnemyAiHost = () => {
  useFrame((_, dtRaw) => {
    const dt = Math.min(0.05, dtRaw);
    const t = nowS();
    const px = robotHandle.pos.x, pz = robotHandle.pos.z;
    // Wave 2 — squad coordinator nudges role spacing before the per-enemy AI runs; threats feed the dodger.
    applySquadTactics(liveTargets, px, pz);
    const threats = playerThreats();

    for (const e of liveTargets) {
      if (!e.isEnemy || e.defeatedAt) continue;
      // Wave 1 — regenerating affix: heal over time regardless of stun/freeze state.
      const regen = e.aiData?.affixRegenPerSec;
      if (regen && e.hp < e.maxHp) e.hp = Math.min(e.maxHp, e.hp + regen * dt);
      // Generic stun (Paul's Containment Cuff etc.) — frozen until stunUntil passes.
      if ((e.aiData?.stunUntil ?? 0) > t) continue;
      // Batch O — shock briefly interrupts all action (like a mini-stun); freeze slows movement.
      if ((e.aiData?.shockUntil ?? 0) > t) continue;
      const freezeMult = (e.aiData?.freezeUntil ?? 0) > t ? (e.aiData?.freezeMultiplier ?? 1) : 1;
      // Batch E taunt/decoy: while taunted, steer + aim at the decoy instead of the player.
      const decoy = getDecoyTargetFor(e.id);
      const tx = decoy ? decoy.x : px, tz = decoy ? decoy.z : pz;
      const dx = tx - e.x, dz = tz - e.z;
      const dist = Math.hypot(dx, dz) || 1;
      const aggro = e.aggroRange ?? 20;
      const attackRange = e.attackRange ?? 3;
      const speed = (e.moveSpeed ?? 2.5) * freezeMult;

      if (e.bossId) updateBossPhase(e);

      // Shield-carrier: when the front shield breaks, stagger (exposed) for breakStaggerSeconds.
      if (e.archetype === 'shield-carrier' && e.maxShield > 0 && e.shield <= 0 && !e.shieldBroken) {
        const def0 = e.enemyDefId ? getEnemyDef(e.enemyDefId) : undefined;
        e.shieldBroken = true;
        (e.aiData ??= {}).stunUntil = t + (def0?.shield?.breakStaggerSeconds ?? 1.5);
      }

      // Per-archetype AI state machine (Crusher / Turret / Shield Carrier). Generic enemies fall through.
      const def = e.enemyDefId ? getEnemyDef(e.enemyDefId) : undefined;
      if (def && def.archetype && def.archetype !== 'generic') {
        const step = stepEnemyAi(e, def, { playerX: tx, playerZ: tz, nowS: t, dt: dt * freezeMult, threats });
        if (step) {
          e.x += step.moveX; e.z += step.moveZ; e.facingRad = step.facingRad;
          if (step.action === 'charge-hit') applyDamageToPlayer(def.charge?.damageAmount ?? 12);
          else if (step.action === 'bash') applyDamageToPlayer(def.shield?.bashDamage ?? 10);
          // Wave 2 — suppressor reuses the turret projectile spawn (its own skill id).
          else if (step.action === 'fire' && (def.turret || def.suppressor)) { const sk = getCombatSkill(def.turret?.projectileSkillId ?? def.suppressor!.projectileSkillId); if (sk) spawnFromSkill(sk, { characterId: e.id, x: e.x, y: e.y, z: e.z, headingRad: e.facingRad ?? 0 }); }
          // Batch I — new archetype actions.
          else if (step.action === 'spawn-minions' && def.spawner) spawnGroup(def.spawner.spawnGroupId, e.x, e.z);
          else if (step.action === 'quake-slam' && def.quake) { if (Math.hypot(px - e.x, pz - e.z) <= def.quake.slamRadius) applyDamageToPlayer(def.quake.slamDamage); }
          else if (step.action === 'heal-ally' && def.repairWisp) healNearestAlly(e, def.repairWisp.healRange, def.repairWisp.healAmount);
          // Wave 2 — tactical actions.
          else if (step.action === 'melee-hit') applyDamageToPlayer(def.dodger?.meleeDamage ?? def.flanker?.meleeDamage ?? 10);
          else if (step.action === 'self-destruct' && def.bomber) { if (Math.hypot(px - e.x, pz - e.z) <= def.bomber.blastRadius) applyDamageToPlayer(def.bomber.blastDamage); e.hp = 0; e.defeatedAt = t; }
          else if (step.action === 'buff-allies' && def.buffer) shieldNearbyAllies(e, def.buffer.buffRange, def.buffer.shieldAmount);
          continue;
        }
      }

      // --- movement ---
      if (dist <= aggro) {
        if (e.aiBehavior === 'turret') {
          // hold position
        } else if (e.aiBehavior === 'kiter') {
          // keep mid-range: back off if too close, approach if too far
          const ideal = Math.max(6, attackRange);
          if (dist < ideal - 1) { e.x -= (dx / dist) * speed * dt; e.z -= (dz / dist) * speed * dt; }
          else if (dist > ideal + 2) { e.x += (dx / dist) * speed * dt; e.z += (dz / dist) * speed * dt; }
        } else {
          // chaser / boss — close in until in attack range
          if (dist > attackRange) { e.x += (dx / dist) * speed * dt; e.z += (dz / dist) * speed * dt; }
        }
      }

      // --- cast ---
      const cd = e.skillCooldowns ?? (e.skillCooldowns = {});
      if (dist <= aggro && t >= (cd.__gap ?? 0) && e.skillIds && e.skillIds.length) {
        const ready = e.skillIds.find((sid) => t >= (cd[sid] ?? 0));
        if (ready) castEnemySkill(e, ready, tx, tz, t);
      }
    }
  });
  return null;
};
