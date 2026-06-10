import { useGameStore } from '../../stores/game/useGameStore';
import { MissionControlScreen } from './MissionControlScreen';
import { MissionBriefingScreen } from './MissionBriefingScreen';
import { CharacterSelectScreen } from './CharacterSelectScreen';

// Phase router for the DOM game front-end (Mission Control → Briefing → Character Select). The on-ground
// base phases (HANGAR / PLATFORM_ALIGNMENT / LAUNCH_PREPARATION) render the 3D BaseScene instead, with the
// BaseHud overlay — so this returns null for them.
export const GameScreens = () => {
  const phase = useGameStore((s) => s.phase);
  switch (phase) {
    case 'MISSION_CONTROL':
      return <MissionControlScreen />;
    case 'MISSION_BRIEFING':
      return <MissionBriefingScreen />;
    case 'CHARACTER_SELECTION':
      return <CharacterSelectScreen />;
    default:
      return null;
  }
};
