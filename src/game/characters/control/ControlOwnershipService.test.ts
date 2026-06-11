import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorSupportStore } from '../../../stores/game/editorSupportStore';
import { useCharacterStore } from '../../../stores/game/useCharacterStore';
import { useSupportRuntimeStore } from '../../../stores/game/supportRuntimeStore';
import { robotHandle } from '../../destination/robotHandle';
import { initializeControlOwner, switchControlToCharacter } from './ControlOwnershipService';
import type { CharacterPresence } from '../../../types/game/support';

function presence(characterId: string, tier: CharacterPresence['tier']): CharacterPresence {
  return {
    characterId,
    tier,
    aiState: 'follow-player',
    position: [8, 0.8, 3],
    heading: 1,
    controllerActive: false,
    colliderActive: tier !== 'remote',
  };
}

describe('ControlOwnershipService', () => {
  beforeEach(() => {
    localStorage.clear();
    useCharacterStore.getState().reset();
    useSupportRuntimeStore.getState().reset();
    useEditorSupportStore.getState().reset();
    useEditorSupportStore.getState().mergeMissingFromSeed();
    robotHandle.pos.set(0, 0.8, 0);
    robotHandle.heading = 0;
    useCharacterStore.getState().selectCharacter('char_jett');
    initializeControlOwner('char_jett');
  });

  it('can switch control to any present character, including remote companions', () => {
    useSupportRuntimeStore.getState().upsertPresence(presence('char_paul', 'remote'));
    expect(switchControlToCharacter('char_paul')).toBe(true);
    const runtime = useSupportRuntimeStore.getState();
    expect(runtime.ownership.controlledCharacterId).toBe('char_paul');
    expect(runtime.ownership.inputOwnerId).toBe('char_paul');
    expect(runtime.ownership.cameraOwnerId).toBe('char_paul');
    expect(useCharacterStore.getState().selectedCharacterId).toBe('char_paul');
    expect(runtime.presences.find((p) => p.characterId === 'char_paul')?.tier).toBe('active');
    expect(runtime.presences.find((p) => p.characterId === 'char_paul')?.controllerActive).toBe(true);
    expect(runtime.presences.find((p) => p.characterId === 'char_jett')?.aiState).toBe('follow-player');
    expect(runtime.presences.find((p) => p.characterId === 'char_jett')?.controllerActive).toBe(false);
  });
});
