import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorFlightStore, getFlightTuning } from './editorFlightStore';
import { DEFAULT_FLIGHT_TUNING } from '../../data/game/flightTuning';

describe('editorFlightStore', () => {
  beforeEach(() => useEditorFlightStore.getState().reset());

  it('reset yields the full default tuning incl. the base fly-around fields', () => {
    const t = getFlightTuning();
    expect(t.flyAroundCamDistance).toBe(DEFAULT_FLIGHT_TUNING.flyAroundCamDistance);
    expect(t.flyAroundCraftScale).toBe(DEFAULT_FLIGHT_TUNING.flyAroundCraftScale);
    expect(t.flyAroundCraftOffset).toEqual([0, 0, 0]);
  });

  it('importState back-fills missing new fields from the defaults (back-compat)', () => {
    // A pre-existing doc without the fly-around fields (simulating an older persisted/imported state).
    useEditorFlightStore.getState().importState({ tuning: { maxSpeed: 99 } });
    const t = getFlightTuning();
    expect(t.maxSpeed).toBe(99); // kept
    expect(t.flyAroundCamHeight).toBe(DEFAULT_FLIGHT_TUNING.flyAroundCamHeight); // defaulted
    expect(t.worldCamDistance).toBe(DEFAULT_FLIGHT_TUNING.worldCamDistance);
  });

  it('update persists fly-around values independently of the world leg', () => {
    useEditorFlightStore.getState().update({ flyAroundCraftScale: 5, worldCraftScale: 2 });
    expect(getFlightTuning().flyAroundCraftScale).toBe(5);
    expect(getFlightTuning().worldCraftScale).toBe(2);
  });
});
