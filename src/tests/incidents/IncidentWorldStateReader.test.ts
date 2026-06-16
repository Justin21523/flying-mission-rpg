import { describe, it, expect } from 'vitest';
import { readIncidentWorldState, INCIDENT_NPC_SLOTS, INCIDENT_AREA_ID } from '../../game/incidents/IncidentWorldStateReader';

describe('IncidentWorldStateReader (Batch G)', () => {
  it('exposes the allowed npc/object placeholder pool + heroes + support types', () => {
    const w = readIncidentWorldState();
    for (const id of INCIDENT_NPC_SLOTS) expect(w.npcIds).toContain(id);
    expect(w.objectIds).toContain(INCIDENT_AREA_ID);
    expect(w.availableCharacterIds).toContain('char_jett');
    expect(w.availableSupportAbilityTypes).toContain('repair-support');
    expect(w.availableSupportAbilityTypes).toContain('scan-support');
  });

  it('always provides obstacle + device fallbacks so repair/clear objectives can bind', () => {
    const w = readIncidentWorldState();
    expect(w.obstacleIds.length).toBeGreaterThan(0);
    expect(w.deviceIds.length).toBeGreaterThan(0);
  });
});
