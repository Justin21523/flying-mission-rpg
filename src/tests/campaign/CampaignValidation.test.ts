import { describe, expect, it, beforeEach } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { validateCampaign, validateStage } from '../../game/campaign/CampaignValidation';
import { getCampaignDefinitions, getStageDefinitions } from '../../stores/useStageEditorStore';

describe('CampaignValidation', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); });

  it('validates the 10 seed stages and rejects an invalid stage', () => {
    const campaigns = getCampaignDefinitions();
    const stages = getStageDefinitions();
    expect(validateCampaign(campaigns[0], stages).ok).toBe(true);
    expect(stages.length).toBeGreaterThanOrEqual(10);
    expect(stages.every((stage) => validateStage(stage, campaigns.map((c) => c.id)).ok)).toBe(true);
    expect(validateStage({ ...stages[0], id: '' }, campaigns.map((c) => c.id)).ok).toBe(false);
  });
});
