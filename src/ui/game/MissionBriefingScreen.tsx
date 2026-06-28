import { useEffect } from 'react';
import { ScreenFrame, Btn, panel, chip } from './screenChrome';
import { useMissionStore } from '../../stores/game/useMissionStore';
import { useGameStore } from '../../stores/game/useGameStore';
import { getEditorMission } from '../../stores/game/editorMissionStore';
import { getEditorLocation } from '../../stores/game/editorLocationStore';
import { getEditorCharacter } from '../../stores/game/editorCharacterStore';
import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';
import { StageBriefingPanel } from '../campaign/StageBriefingPanel';
import { DialogueBox } from '../DialogueBox';

// MISSION_BRIEFING — details of the selected mission. Enter accepts (→ CHARACTER_SELECTION), Esc returns.
export const MissionBriefingScreen = () => {
  const missionId = useMissionStore((s) => s.currentMissionId);
  const activeStageId = useStageProgressionStore((s) => s.activeStageId);
  const requestTransition = useGameStore((s) => s.requestTransition);
  const mission = missionId ? getEditorMission(missionId) : undefined;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter') requestTransition('CHARACTER_SELECTION');
      else if (e.code === 'Escape') requestTransition('MISSION_CONTROL');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [requestTransition]);

  if (activeStageId) {
    return (
      <ScreenFrame title="Stage Briefing" subtitle="campaign">
        <StageBriefingPanel />
        <DialogueBox />
      </ScreenFrame>
    );
  }

  if (!mission) {
    return (
      <ScreenFrame title="Mission Briefing" subtitle="briefing">
        <div className="flex items-center gap-3 text-slate-400">
          No mission selected.
          <Btn tone="ghost" onClick={() => requestTransition('MISSION_CONTROL')}>
            Back
          </Btn>
        </div>
      </ScreenFrame>
    );
  }

  const loc = getEditorLocation(mission.locationId);
  return (
    <ScreenFrame title="Mission Briefing" subtitle="briefing">
      <div className={`mx-auto max-w-2xl ${panel} p-5`}>
        <h2 className="text-2xl font-black text-sky-100">{mission.name}</h2>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className={`${chip} border-sky-600 text-sky-200`}>{mission.type}</span>
          <span className={`${chip} border-slate-600 text-slate-300`}>📍 {loc?.name ?? mission.locationId}</span>
          <span className={`${chip} border-slate-600 text-slate-300`}>Difficulty {mission.difficulty}</span>
          <span className={`${chip} border-slate-600 text-slate-300`}>Weather {mission.weather}</span>
          {mission.recommendedAbility && (
            <span className={`${chip} border-emerald-600 text-emerald-200`}>Ability {mission.recommendedAbility}</span>
          )}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-200">{mission.summary}</p>
        <div className="mt-3 text-xs text-slate-400">
          Objectives: {mission.objectives.map((o) => o.description).join(', ') || '—'}
        </div>
        <div className="mt-1 text-xs text-slate-400">
          Recommended characters: {mission.recommendedCharacterIds.map((id) => getEditorCharacter(id)?.name ?? id).join(', ') || '—'}
        </div>
        <div className="mt-5 flex justify-between">
          <Btn tone="ghost" sound="back" onClick={() => requestTransition('MISSION_CONTROL')}>
            ← Back
          </Btn>
          <Btn tone="primary" sound="confirm" onClick={() => requestTransition('CHARACTER_SELECTION')}>
            Accept Mission →
          </Btn>
        </div>
      </div>
      <DialogueBox />
    </ScreenFrame>
  );
};
