import { useFrame } from '@react-three/fiber';
import { liveTargets, type CombatTarget } from '../../stores/game/combatTargetStore';
import { getCombatSkill, getBossPhases, getEnemyDef } from '../../stores/game/editorCombatStore';
import { robotHandle } from '../destination/robotHandle';
import { applyDamageToPlayer } from './CombatDirector';
import { spawnFromSkill } from './skillBehaviors';
import { isSpawnSkill } from './skillBehaviors';
import { bossActivePhase, spawnEnemyFromDef } from './enemyRuntime';
import { stepEnemyAi } from './enemyAi';
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
    applyDamageToPlayer(skill.damageEvents?.[0]?.amount ?? 8);
  }
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

    for (const e of liveTargets) {
      if (!e.isEnemy || e.defeatedAt) continue;
      // Generic stun (Paul's Containment Cuff etc.) — frozen until stunUntil passes.
      if ((e.aiData?.stunUntil ?? 0) > t) continue;
      // Batch E taunt/decoy: while taunted, steer + aim at the decoy instead of the player.
      const decoy = getDecoyTargetFor(e.id);
      const tx = decoy ? decoy.x : px, tz = decoy ? decoy.z : pz;
      const dx = tx - e.x, dz = tz - e.z;
      const dist = Math.hypot(dx, dz) || 1;
      const aggro = e.aggroRange ?? 20;
      const attackRange = e.attackRange ?? 3;
      const speed = e.moveSpeed ?? 2.5;

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
        const step = stepEnemyAi(e, def, { playerX: tx, playerZ: tz, nowS: t, dt });
        if (step) {
          e.x += step.moveX; e.z += step.moveZ; e.facingRad = step.facingRad;
          if (step.action === 'charge-hit') applyDamageToPlayer(def.charge?.damageAmount ?? 12);
          else if (step.action === 'bash') applyDamageToPlayer(def.shield?.bashDamage ?? 10);
          else if (step.action === 'fire' && def.turret) { const sk = getCombatSkill(def.turret.projectileSkillId); if (sk) spawnFromSkill(sk, { characterId: e.id, x: e.x, y: e.y, z: e.z, headingRad: e.facingRad ?? 0 }); }
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
