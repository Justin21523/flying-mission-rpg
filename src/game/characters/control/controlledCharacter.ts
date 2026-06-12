import { useCharacterStore } from '../../../stores/game/useCharacterStore';
import { useSupportRuntimeStore } from '../../../stores/game/supportRuntimeStore';
import { getEditorCharacter } from '../../../stores/game/editorCharacterStore';

export function getControlledCharacterId(): string | null {
  return useSupportRuntimeStore.getState().ownership.controlledCharacterId ?? useCharacterStore.getState().selectedCharacterId;
}

export function getControlledCharacterName(): string {
  const id = getControlledCharacterId();
  return id ? getEditorCharacter(id)?.name ?? id : 'None';
}
