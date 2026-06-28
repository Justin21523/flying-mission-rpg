import { describe, it, expect } from 'vitest';
import { SEED_ZONE_SEGMENTS } from './advancedMissionZones';

// Content-fill — assert the campaign actually uses objective variety (not just "clear the enemy group").
const VARIETY_TYPES = new Set(['defense-waves', 'timed-rescue', 'scan-targets', 'hold-zone', 'survive-timer', 'escort-npc', 'hack-terminals']);

const hasVariety = (seg: typeof SEED_ZONE_SEGMENTS[number]) =>
  seg.completionConditions.some((c) => VARIETY_TYPES.has(c.type));

describe('zone objective coverage', () => {
  it('a large share of non-boss segments now use a varied objective', () => {
    const nonBoss = SEED_ZONE_SEGMENTS.filter((s) => s.segmentType !== 'boss');
    const varied = nonBoss.filter(hasVariety);
    // After the content-fill pass we expect well over 20 segments with variety (15 added + pre-existing).
    expect(varied.length).toBeGreaterThanOrEqual(20);
  });

  it('every varied objective references markers that exist on its segment', () => {
    for (const seg of SEED_ZONE_SEGMENTS) {
      const markerIds = new Set((seg.markers ?? []).map((m) => m.id));
      for (const c of seg.completionConditions) {
        if (c.type === 'hold-zone') expect(markerIds.has(c.markerId), `${seg.id} hold-zone → ${c.markerId}`).toBe(true);
        if (c.type === 'escort-npc') {
          expect(markerIds.has(c.npcMarkerId), `${seg.id} escort npc → ${c.npcMarkerId}`).toBe(true);
          expect(markerIds.has(c.destinationMarkerId), `${seg.id} escort dest → ${c.destinationMarkerId}`).toBe(true);
        }
        if (c.type === 'hack-terminals') for (const t of c.terminalMarkerIds) expect(markerIds.has(t), `${seg.id} hack → ${t}`).toBe(true);
      }
    }
  });
});
