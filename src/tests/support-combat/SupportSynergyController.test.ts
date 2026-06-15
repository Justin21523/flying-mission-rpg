import { describe, it, expect } from 'vitest';
import { detectSynergy } from '../../game/support-combat/SupportSynergyController';
import { SEED_SUPPORT_SYNERGIES } from '../../data/support-combat/supportSynergyPlaceholders';

describe('SupportSynergyController.detectSynergy', () => {
  it('fires Chase scan → Jett dash bonus when scanned + ability + tags match', () => {
    const s = detectSynergy(SEED_SUPPORT_SYNERGIES, {
      nowMs: 0, scannedEnemy: true, lastSupportAbilityId: 'support_scan_chase', primaryRecentSkillTags: ['speed', 'rescue'],
    });
    expect(s?.id).toBe('synergy_chase_scan_jett_dash');
  });

  it('does not fire when the required skill tags are absent', () => {
    const s = detectSynergy(SEED_SUPPORT_SYNERGIES, {
      nowMs: 0, scannedEnemy: true, lastSupportAbilityId: 'support_scan_chase', primaryRecentSkillTags: ['engineering'],
    });
    expect(s?.id).not.toBe('synergy_chase_scan_jett_dash');
  });

  it('respects the cooldown gate', () => {
    const ctx = { nowMs: 0, scannedEnemy: true, lastSupportAbilityId: 'support_scan_chase', primaryRecentSkillTags: ['speed', 'rescue'] };
    expect(detectSynergy(SEED_SUPPORT_SYNERGIES, ctx, () => false)).toBeNull();
  });

  it('does not fire on the wrong trigger context', () => {
    const s = detectSynergy(SEED_SUPPORT_SYNERGIES, { nowMs: 0, scannedEnemy: false });
    expect(s).toBeNull();
  });
});
