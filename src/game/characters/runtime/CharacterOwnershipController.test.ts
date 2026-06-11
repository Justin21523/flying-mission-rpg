import { describe, expect, it } from 'vitest';
import type { ControlOwnershipState } from '../../../types/game/support';
import { createOwnershipState, ownershipHasSingleInputOwner } from './CharacterOwnershipController';

const previous: ControlOwnershipState = {
  controlledCharacterId: 'char_jett',
  inputOwnerId: 'char_jett',
  cameraOwnerId: 'char_jett',
  hudFocusCharacterId: 'char_jett',
  switching: false,
};

describe('CharacterOwnershipController', () => {
  it('moves input, camera, and hud focus to the new character', () => {
    const next = createOwnershipState('char_paul', previous);
    expect(next.previousControlledCharacterId).toBe('char_jett');
    expect(next.controlledCharacterId).toBe('char_paul');
    expect(next.inputOwnerId).toBe('char_paul');
    expect(next.cameraOwnerId).toBe('char_paul');
    expect(next.hudFocusCharacterId).toBe('char_paul');
    expect(ownershipHasSingleInputOwner(next)).toBe(true);
  });

  it('detects an invalid ownership state with split input owner', () => {
    expect(ownershipHasSingleInputOwner({ ...previous, inputOwnerId: 'char_paul' })).toBe(false);
  });
});
