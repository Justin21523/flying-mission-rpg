import { useGameStore } from '../../stores/game/useGameStore';
import { MissionControlScreen } from './MissionControlScreen';
import { MissionBriefingScreen } from './MissionBriefingScreen';
import { CharacterSelectScreen } from './CharacterSelectScreen';
import { HangarPlaceholderScreen } from './HangarPlaceholderScreen';

// Phase router for the game front-end. Mounted only when not editing + grey-box scene (see App), so each
// screen is a full-screen console chosen by the FSM phase. Other phases render nothing here yet.
export const GameScreens = () => {
  const phase = useGameStore((s) => s.phase);
  switch (phase) {
    case 'MISSION_CONTROL':
      return <MissionControlScreen />;
    case 'MISSION_BRIEFING':
      return <MissionBriefingScreen />;
    case 'CHARACTER_SELECTION':
      return <CharacterSelectScreen />;
    case 'HANGAR':
      return <HangarPlaceholderScreen />;
    default:
      return null;
  }
};
