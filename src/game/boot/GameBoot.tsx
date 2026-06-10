import { useEffect } from 'react';
import { GameDirector } from '../core/GameDirector';
import { seedGameContent } from './seedGameContent';

// Mounted once in App (always-on, like the inherited POLI boot). Seeds authored content and boots the
// game state machine. Renders nothing — no effect on the 3D scene.
export const GameBoot = () => {
  useEffect(() => {
    seedGameContent();
    GameDirector.boot();
    return () => GameDirector.shutdown();
  }, []);
  return null;
};
