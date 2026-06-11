import { useEffect, useRef } from 'react';
import { tickSupportDispatch } from './SupportDispatchDirector';
import { initializeControlOwner } from '../characters/control/ControlOwnershipService';
import { useCharacterStore } from '../../stores/game/useCharacterStore';

export const SupportDispatchDirectorHost = () => {
  const last = useRef<number | null>(null);
  const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);

  useEffect(() => {
    initializeControlOwner(selectedCharacterId);
  }, [selectedCharacterId]);

  useEffect(() => {
    last.current = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(1, Math.max(0, (now - (last.current ?? now)) / 1000));
      last.current = now;
      tickSupportDispatch(dt, now);
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  return null;
};
