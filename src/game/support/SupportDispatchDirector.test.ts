import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorCharacterStore } from '../../stores/game/editorCharacterStore';
import { useEditorSupportStore } from '../../stores/game/editorSupportStore';
import { useCharacterStore } from '../../stores/game/useCharacterStore';
import { useSupportRuntimeStore } from '../../stores/game/supportRuntimeStore';
import { cancelSupport, requestSupport, tickSupportDispatch } from './SupportDispatchDirector';

function seed(): void {
  localStorage.clear();
  useEditorCharacterStore.getState().reset();
  useEditorCharacterStore.getState().mergeMissingFromSeed();
  useEditorSupportStore.getState().reset();
  useEditorSupportStore.getState().mergeMissingFromSeed();
  useCharacterStore.getState().reset();
  useSupportRuntimeStore.getState().reset();
}

describe('SupportDispatchDirector', () => {
  beforeEach(seed);

  it('requests support and enters queued state', () => {
    const result = requestSupport('char_jett', 'quick-simulated', 100);
    expect(result.ok).toBe(true);
    expect(useSupportRuntimeStore.getState().dispatches[0]?.status).toBe('queued');
  });

  it('rejects duplicate dispatch for the same character', () => {
    expect(requestSupport('char_jett', 'quick-simulated', 100).ok).toBe(true);
    const duplicate = requestSupport('char_jett', 'quick-simulated', 200);
    expect(duplicate.ok).toBe(false);
  });

  it('advances quick dispatch through every runtime stage and arrives', () => {
    requestSupport('char_jett', 'quick-simulated', 100);
    tickSupportDispatch(1.1, 200);
    expect(useSupportRuntimeStore.getState().dispatches[0]?.status).toBe('launching');
    tickSupportDispatch(2.1, 300);
    expect(useSupportRuntimeStore.getState().dispatches[0]?.status).toBe('flying');
    tickSupportDispatch(6.1, 400);
    expect(useSupportRuntimeStore.getState().dispatches[0]?.status).toBe('transforming');
    tickSupportDispatch(2.1, 500);
    expect(useSupportRuntimeStore.getState().dispatches[0]?.status).toBe('arriving');
    tickSupportDispatch(2, 600);
    expect(useSupportRuntimeStore.getState().dispatches).toEqual([]);
    expect(useSupportRuntimeStore.getState().presences.some((p) => p.characterId === 'char_jett')).toBe(true);
  });

  it('updates ETA while dispatching', () => {
    requestSupport('char_jett', 'quick-simulated', 100);
    const before = useSupportRuntimeStore.getState().dispatches[0]?.etaSeconds ?? 0;
    tickSupportDispatch(2, 200);
    const after = useSupportRuntimeStore.getState().dispatches[0]?.etaSeconds ?? before;
    expect(after).toBeLessThan(before);
  });

  it('does not arrive after cancellation', () => {
    requestSupport('char_jett', 'quick-simulated', 100);
    cancelSupport('char_jett');
    tickSupportDispatch(100, 200);
    expect(useSupportRuntimeStore.getState().presences.some((p) => p.characterId === 'char_jett')).toBe(false);
  });

  it('pauses and resumes without advancing elapsed time while paused', () => {
    requestSupport('char_jett', 'quick-simulated', 100);
    useSupportRuntimeStore.getState().setPaused(true);
    tickSupportDispatch(10, 200);
    expect(useSupportRuntimeStore.getState().dispatches[0]?.elapsedSeconds).toBe(0);
    useSupportRuntimeStore.getState().setPaused(false);
    tickSupportDispatch(1, 300);
    expect(useSupportRuntimeStore.getState().dispatches[0]?.elapsedSeconds).toBe(1);
  });
});
