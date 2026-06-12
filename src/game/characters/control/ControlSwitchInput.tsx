import { useEffect } from 'react';
import { useSupportRuntimeStore } from '../../../stores/game/supportRuntimeStore';
import { getEditorCharacter } from '../../../stores/game/editorCharacterStore';
import { switchControlToCharacter } from './ControlOwnershipService';

// In-play control switching: V cycles who you drive across the on-scene ACTIVE roster (the controlled character
// + active companion presences). The previous character becomes an AI companion (handled by
// ControlOwnershipService); RobotGroundController re-derives from useCharacterStore.selectedCharacterId.
export const ControlSwitchInput = () => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.code !== 'KeyV' || e.repeat) return;
      const s = useSupportRuntimeStore.getState();
      const controlled = s.ownership.controlledCharacterId;
      const active = s.presences.filter((p) => p.tier === 'active').map((p) => p.characterId);
      const order = [controlled, ...active.filter((id) => id !== controlled)].filter((x): x is string => !!x);
      if (order.length < 2) return;
      const i = Math.max(0, order.indexOf(controlled ?? order[0]));
      const nextId = order[(i + 1) % order.length];
      if (nextId && nextId !== controlled && switchControlToCharacter(nextId)) {
        s.pushToast(nextId, `Now controlling ${getEditorCharacter(nextId)?.name ?? nextId}`);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return null;
};
