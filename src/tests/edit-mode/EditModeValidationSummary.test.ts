import { beforeEach, describe, expect, it } from 'vitest';
import { seedGameContent } from '../../game/boot/seedGameContent';
import { buildEditModeValidationSummary } from '../../game/demo/EditModeValidationSummaryModel';

describe('EditModeValidationSummary', () => {
  beforeEach(() => { localStorage.clear(); seedGameContent(); });

  it('summarizes campaign, stages, content, playtest, and demo validation', () => {
    const entries = buildEditModeValidationSummary();
    expect(entries.map((entry) => entry.label)).toEqual(['Campaigns', 'Stages', 'Content packs', 'Playtest scenarios', 'Demo checklist']);
    expect(entries.find((entry) => entry.label === 'Stages')?.status).toBe('pass');
  });
});
