import type { ControlOwnershipState } from '../../../types/game/support';

export function createOwnershipState(
  toCharacterId: string,
  previous: ControlOwnershipState,
): ControlOwnershipState {
  return {
    controlledCharacterId: toCharacterId,
    previousControlledCharacterId: previous.controlledCharacterId ?? undefined,
    inputOwnerId: toCharacterId,
    cameraOwnerId: toCharacterId,
    hudFocusCharacterId: toCharacterId,
    switching: false,
  };
}

export function ownershipHasSingleInputOwner(state: ControlOwnershipState): boolean {
  return !!state.inputOwnerId && state.inputOwnerId === state.controlledCharacterId;
}
