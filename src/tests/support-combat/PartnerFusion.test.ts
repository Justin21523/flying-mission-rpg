import { describe, it, expect, beforeEach } from 'vitest';
import { canCastFusion, castPartnerFusion, initFusionsForZone, accrueSyncFromAction, cleanupFusions } from '../../game/support-combat/PartnerFusionDirector';
import { useFusionEditorStore } from '../../stores/game/useFusionEditorStore';
import { useSupportRuntimeStore } from '../../stores/game/supportRuntimeStore';
import { useCombatTargetStore, liveTargets } from '../../stores/game/combatTargetStore';
import { useEditorEnemyStore, getEnemyDef } from '../../stores/game/editorCombatStore';
import { spawnEnemyFromDef } from '../../game/combat/enemyRuntime';
import { robotHandle } from '../../game/destination/robotHandle';
import { SEED_PARTNER_FUSIONS } from '../../data/support-combat/partnerFusions';
import { SEED_ENEMIES } from '../../data/combat/enemyDefinitions';

const JETT_FUSION = 'fusion_jett_chase_recon_strike';
const setPartner = (characterId: string, tier: string) => useSupportRuntimeStore.setState({ presences: ([{ characterId, tier }] as unknown) as never });

beforeEach(() => {
  useFusionEditorStore.getState().importState({ items: SEED_PARTNER_FUSIONS, seeded: true });
  useEditorEnemyStore.getState().importState({ items: SEED_ENEMIES, seeded: true });
  useCombatTargetStore.getState().reset();
  cleanupFusions();
  initFusionsForZone();
  robotHandle.pos.set(0, 0, 0);
  setPartner('char_chase', 'standby');
});

describe('Partner Fusion (Batch I)', () => {
  it('gates on the sync gauge + a present support partner', () => {
    expect(canCastFusion(JETT_FUSION).ok).toBe(false); // gauge empty
    accrueSyncFromAction(100);
    expect(canCastFusion(JETT_FUSION).ok).toBe(true);
    setPartner('char_chase', 'remote'); // not active/standby
    expect(canCastFusion(JETT_FUSION).ok).toBe(false);
  });

  it('casts an AOE combo: damages enemies in radius + decrements a charge', () => {
    spawnEnemyFromDef(getEnemyDef('zip_glitch')!, 3, 0); // within radius 9 of the player
    const enemy = liveTargets[0];
    const hpBefore = enemy.hp;
    accrueSyncFromAction(100);
    const res = castPartnerFusion('char_jett');
    expect(res.ok).toBe(true);
    expect(res.fusionId).toBe(JETT_FUSION);
    expect(res.hits).toBeGreaterThanOrEqual(1);
    expect(liveTargets[0].hp).toBeLessThan(hpBefore);
  });

  it('is blocked once charges are spent (advancing past the cooldown each time)', () => {
    accrueSyncFromAction(100); expect(castPartnerFusion('char_jett', 0).ok).toBe(true);
    accrueSyncFromAction(100); expect(castPartnerFusion('char_jett', 20_000).ok).toBe(true); // 2 charges
    accrueSyncFromAction(100); expect(castPartnerFusion('char_jett', 40_000).ok).toBe(false); // 0 charges
  });

  it('is blocked while on cooldown even with charges + sync', () => {
    accrueSyncFromAction(100); expect(castPartnerFusion('char_jett', 0).ok).toBe(true);
    accrueSyncFromAction(100); expect(castPartnerFusion('char_jett', 1_000).ok).toBe(false); // still cooling down
  });

  it('returns no-fusion for a character without one', () => {
    // Wave 2 — Paul is only ever a support partner, never a fusion primary.
    accrueSyncFromAction(100);
    expect(castPartnerFusion('char_paul').ok).toBe(false);
  });
});
