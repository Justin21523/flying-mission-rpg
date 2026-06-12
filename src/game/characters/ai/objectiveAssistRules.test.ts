import { beforeEach, describe, expect, it } from 'vitest';
import { SEED_SUPPORT_PROFILES } from '../../../data/game/support';
import { useEditorMissionStore, getEditorMission } from '../../../stores/game/editorMissionStore';
import { useMissionStore } from '../../../stores/game/useMissionStore';
import { useSupportRuntimeStore } from '../../../stores/game/supportRuntimeStore';
import { applyCompanionObjectiveAssist, resolveObjectiveAssistRule } from './objectiveAssistRules';

describe('objectiveAssistRules', () => {
  beforeEach(() => {
    localStorage.clear();
    useEditorMissionStore.getState().reset();
    useEditorMissionStore.getState().mergeMissingFromSeed();
    useMissionStore.getState().reset();
    useSupportRuntimeStore.getState().reset();
  });

  it('resolves a matching assist rule from support abilities', () => {
    const mission = getEditorMission('mission_parcel_run');
    const objective = mission?.objectives.find((item) => item.kind === 'activate');
    const engineer = SEED_SUPPORT_PROFILES.find((profile) => profile.abilities.includes('repair'));

    expect(objective).toBeTruthy();
    expect(engineer).toBeTruthy();
    expect(resolveObjectiveAssistRule(engineer!, objective!)?.id).toBe('assist_repair_device');
  });

  it('applies companion assist through mission runtime and presence contribution state', () => {
    const mission = getEditorMission('mission_parcel_run');
    const objective = mission?.objectives.find((item) => item.kind === 'activate');
    const engineer = SEED_SUPPORT_PROFILES.find((profile) => profile.abilities.includes('repair'));
    expect(mission).toBeTruthy();
    expect(objective).toBeTruthy();
    expect(engineer).toBeTruthy();
    useMissionStore.getState().beginMission(mission!);
    useSupportRuntimeStore.getState().upsertPresence({
      characterId: engineer!.characterId,
      tier: 'active',
      aiState: 'assist-objective',
      position: [0, 0.8, 0],
      heading: 0,
      controllerActive: false,
      colliderActive: true,
    });

    const event = applyCompanionObjectiveAssist(engineer!.characterId, objective!.id, engineer!);

    expect(event?.completed).toBe(true);
    expect(useMissionStore.getState().runtime?.objectiveProgress[objective!.id].done).toBe(true);
    expect(useSupportRuntimeStore.getState().presences[0]?.contributionScore).toBeGreaterThan(0);
    expect(useSupportRuntimeStore.getState().presences[0]?.assistRuleId).toBe('assist_repair_device');
  });
});
