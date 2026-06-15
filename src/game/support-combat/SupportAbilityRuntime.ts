import type { SupportCombatAbilityDefinition, ActiveSupportEffectState } from '../../types/game/supportCombat';
import type { DamageEventTemplate } from '../../types/game/combat';
import type { CombatTarget } from '../../stores/game/combatTargetStore';

// Executes a support ability's effects (Batch E) by routing each effect through the right existing runtime
// seam — never re-implementing damage/repair/scan logic. Deps are injected (like SkillRuntime) so this is
// pure + unit-testable. Returns an outcome the director uses for cooldown/energy + zone progress + synergy.

export interface SupportAbilityDeps {
  nowMs: number;
  damageTarget: (targetId: string, template: DamageEventTemplate) => void;
  repairObstacle: (obstacleId: string, amount: number) => boolean;
  getTarget: (targetId: string) => CombatTarget | undefined;
  markScanned: (targetId: string) => void;
  stunTarget: (targetId: string, seconds: number) => void;
  bumpTargets: () => void;
  applyTaunt: (enemyIds: string[], center: { x: number; z: number }, seconds: number, hp: number, modelAssetId?: string) => string;
  addActiveEffect: (effect: ActiveSupportEffectState) => void;
  healPlayer: (amount: number) => void;
  playVisual: (effectDefId: string, x: number, y: number, z: number, headingRad: number) => void;
}

export interface SupportCastContext {
  center: { x: number; z: number };
  playerX: number;
  playerZ: number;
  headingRad: number;
  targetIds: string[];
  primaryId?: string;
}

export interface SupportAbilityOutcome {
  ok: boolean;
  affectedIds: string[];
  repairedDeviceIds: string[];
  clearedObstacleIds: string[];
  scannedTargetIds: string[];
  damageHits: number;
  shieldApplied: boolean;
  decoyId?: string;
}

let effectUid = 0;

function visualPos(attachTo: string | undefined, ctx: SupportCastContext, deps: SupportAbilityDeps): { x: number; y: number; z: number } {
  if (attachTo === 'target' && ctx.primaryId && ctx.primaryId !== 'player') {
    const t = deps.getTarget(ctx.primaryId);
    if (t) return { x: t.x, y: t.y + 0.5, z: t.z };
  }
  if (attachTo === 'player' || attachTo === 'support-character') return { x: ctx.playerX, y: 1, z: ctx.playerZ };
  return { x: ctx.center.x, y: 0.5, z: ctx.center.z };
}

export function executeAbility(ability: SupportCombatAbilityDefinition, ctx: SupportCastContext, deps: SupportAbilityDeps): SupportAbilityOutcome {
  const out: SupportAbilityOutcome = {
    ok: true, affectedIds: [], repairedDeviceIds: [], clearedObstacleIds: [], scannedTargetIds: [], damageHits: 0, shieldApplied: false,
  };
  const enemyTargetIds = ctx.targetIds.filter((id) => id !== 'player');
  let touched = false;

  for (const effect of ability.effects) {
    // model-first visual
    if (effect.modelFirstEffect) {
      const p = visualPos(effect.modelFirstEffect.attachTo, ctx, deps);
      deps.playVisual(effect.modelFirstEffect.effectDefinitionId, p.x, p.y, p.z, ctx.headingRad);
    }

    switch (effect.effectType) {
      case 'damage':
      case 'shield-break': {
        const tpl: DamageEventTemplate = {
          amount: effect.amount ?? 0,
          damageType: effect.damageType ?? (effect.effectType === 'shield-break' ? 'shield-break' : 'impact'),
          attackTags: effect.attackTags ?? [],
        };
        for (const id of enemyTargetIds) {
          deps.damageTarget(id, tpl);
          out.damageHits += 1;
          out.affectedIds.push(id);
          const t = deps.getTarget(id);
          if (t?.isObstacle && t.obstacleId) out.clearedObstacleIds.push(t.obstacleId);
        }
        break;
      }
      case 'repair':
      case 'obstacle-clear': {
        for (const id of enemyTargetIds) {
          const t = deps.getTarget(id);
          if (t?.isObstacle && t.obstacleId) {
            if (deps.repairObstacle(t.obstacleId, effect.amount ?? 100)) {
              out.repairedDeviceIds.push(t.obstacleId);
              out.affectedIds.push(id);
            }
          }
        }
        break;
      }
      case 'heal': {
        deps.healPlayer(effect.amount ?? 0);
        break;
      }
      case 'scan': {
        for (const id of enemyTargetIds) {
          deps.markScanned(id);
          out.scannedTargetIds.push(id);
          out.affectedIds.push(id);
        }
        touched = true;
        break;
      }
      case 'stun':
      case 'slow': {
        for (const id of enemyTargetIds) {
          deps.stunTarget(id, effect.durationSeconds ?? 2);
          out.affectedIds.push(id);
        }
        break;
      }
      case 'taunt': {
        const seconds = effect.durationSeconds ?? ability.durationSeconds ?? 5;
        out.decoyId = deps.applyTaunt(enemyTargetIds, ctx.center, seconds, effect.amount ?? 60, effect.spawnModelAssetId);
        for (const id of enemyTargetIds) out.affectedIds.push(id);
        break;
      }
      case 'shield':
      case 'spawn-cover': {
        const seconds = effect.durationSeconds ?? ability.durationSeconds ?? 6;
        const pos = visualPos(effect.effectType === 'shield' ? 'player' : 'world-position', ctx, deps);
        deps.addActiveEffect({
          id: `supeff_${effectUid++}`,
          abilityId: ability.id,
          supportCharacterId: ability.supportCharacterId,
          effectType: effect.effectType,
          x: pos.x, y: pos.y, z: pos.z,
          radius: ability.targeting.radius ?? 5,
          amount: effect.amount ?? 0.5,
          projectileBlocksRemaining: effect.projectileBlockCount,
          startedAtMs: deps.nowMs,
          untilMs: deps.nowMs + seconds * 1000,
        });
        out.shieldApplied = effect.effectType === 'shield';
        break;
      }
      case 'condition-progress':
      case 'debug-log':
      default:
        break;
    }
  }

  if (touched) deps.bumpTargets();
  return out;
}
