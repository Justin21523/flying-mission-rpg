import { allFusions, fusionsForPrimary } from '../../stores/game/useFusionEditorStore';
import { useFusionRuntimeStore, fusionEntry } from '../../stores/game/useFusionRuntimeStore';
import { useSupportRuntimeStore } from '../../stores/game/supportRuntimeStore';
import { liveTargets } from '../../stores/game/combatTargetStore';
import { robotHandle } from '../destination/robotHandle';
import { damageTargetByTemplate } from '../combat/CombatDirector';
import { playEffect } from '../vfx/CinematicVfxDirector';

// Partner Fusion runtime (Batch I) — a synchronized combo: player + an Active/Standby support partner fire a
// unified AOE strike. Gated by per-zone charges + cooldown + a sync gauge. Reuses the shared damage path
// (damageTargetByTemplate → DamageResolver) + the cinematic VFX runtime. No new damage logic.
const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export function initFusionsForZone(): void {
  useFusionRuntimeStore.getState().initForZone(allFusions());
}

function supportTierOk(supportId: string, required?: 'active' | 'standby'): boolean {
  const p = useSupportRuntimeStore.getState().presences.find((x) => x.characterId === supportId);
  if (!p) return false;
  return required === 'active' ? p.tier === 'active' : p.tier === 'active' || p.tier === 'standby';
}

export interface FusionGate { ok: boolean; reason?: string }
export function canCastFusion(fusionId: string, now = nowMs()): FusionGate {
  const def = allFusions().find((f) => f.id === fusionId);
  if (!def || def.enabled === false) return { ok: false, reason: 'unknown fusion' };
  const e = fusionEntry(fusionId);
  if (!e) return { ok: false, reason: 'not initialized' };
  if (e.charges <= 0) return { ok: false, reason: 'no charges' };
  if (now < e.cooldownUntil) return { ok: false, reason: 'cooldown' };
  if (useFusionRuntimeStore.getState().syncGauge < def.sync.requiredGauge) return { ok: false, reason: 'sync gauge' };
  if (!supportTierOk(def.supportCharacterId, def.requiredSupportStatus)) return { ok: false, reason: 'partner not present' };
  return { ok: true };
}

export interface FusionCastResult { ok: boolean; fusionId?: string; reason?: string; hits: number }
export function castPartnerFusion(primaryCharacterId: string | undefined, now = nowMs()): FusionCastResult {
  if (!primaryCharacterId) return { ok: false, reason: 'no character', hits: 0 };
  const candidates = fusionsForPrimary(primaryCharacterId);
  for (const def of candidates) {
    if (!canCastFusion(def.id, now).ok) continue;
    const px = robotHandle.pos.x, pz = robotHandle.pos.z;
    let hits = 0;
    for (const t of liveTargets) {
      if (!t.isEnemy || t.defeatedAt) continue;
      if ((t.x - px) ** 2 + (t.z - pz) ** 2 <= def.combo.radius ** 2) {
        damageTargetByTemplate(t.id, { amount: def.combo.damage, damageType: def.combo.damageType, attackTags: def.combo.attackTags });
        hits++;
      }
    }
    playEffect(def.combo.cinematicEffectId, { casterId: primaryCharacterId, x: robotHandle.pos.x, y: robotHandle.pos.y, z: robotHandle.pos.z, heading: robotHandle.heading });
    useFusionRuntimeStore.getState().spend(def.id, def.cooldownSeconds, now);
    return { ok: true, fusionId: def.id, hits };
  }
  return { ok: false, reason: candidates.length ? 'not ready' : 'no fusion for character', hits: 0 };
}

// Sync gauge accrues from support/skill use (hooked from the skill + support directors).
export function accrueSyncFromAction(amount = 12): void {
  useFusionRuntimeStore.getState().addSync(amount);
}

export function cleanupFusions(): void {
  useFusionRuntimeStore.getState().reset();
}
