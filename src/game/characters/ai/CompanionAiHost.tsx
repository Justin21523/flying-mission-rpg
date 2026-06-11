import { useEffect } from 'react';
import { useSupportRuntimeStore } from '../../../stores/game/supportRuntimeStore';
import { getSupportAiProfile, getSupportProfileForCharacter } from '../../../stores/game/editorSupportStore';
import { updateCompanionAi } from './CompanionAiController';
import { pickCompanionTask } from './CompanionTaskExecutor';
import { applyAssistEvent } from '../../missions/missionAssist';
import { robotHandle } from '../../destination/robotHandle';

export const CompanionAiHost = () => {
  useEffect(() => {
    const id = window.setInterval(() => {
      const state = useSupportRuntimeStore.getState();
      const controlled = state.ownership.controlledCharacterId;
      const player = { x: robotHandle.pos.x, z: robotHandle.pos.z };
      const others = state.presences.map((p) => ({ x: p.position[0], z: p.position[2] }));
      const next = state.presences.map((presence, index) => {
        if (presence.characterId === controlled) return presence;
        const profile = getSupportProfileForCharacter(presence.characterId);
        const ai = profile ? getSupportAiProfile(profile.aiProfileId) : undefined;
        if (!profile || !ai) return presence;
        const task = pickCompanionTask(profile);
        if (task?.canComplete) applyAssistEvent(task.event);
        return updateCompanionAi(presence, ai, player, others, index + 1, 0.1, !!task);
      });
      useSupportRuntimeStore.setState({ presences: next });
      const assisting = next.find((p) => p.aiState === 'assist-objective');
      useSupportRuntimeStore.getState().setLastAssistText(assisting ? `${assisting.characterId} is assisting` : null);
    }, 100);
    return () => window.clearInterval(id);
  }, []);
  return null;
};
