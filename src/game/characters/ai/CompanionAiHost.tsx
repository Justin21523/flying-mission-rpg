import { useEffect } from 'react';
import { useSupportRuntimeStore } from '../../../stores/game/supportRuntimeStore';
import { getSupportAiProfile, getSupportProfileForCharacter } from '../../../stores/game/editorSupportStore';
import { useMissionStore } from '../../../stores/game/useMissionStore';
import { getEditorCharacter } from '../../../stores/game/editorCharacterStore';
import { updateCompanionAi } from './CompanionAiController';
import { pickObjectiveTarget } from './companionObjectiveTargets';
import { applyCompanionObjectiveAssist } from './objectiveAssistRules';
import { robotHandle } from '../../destination/robotHandle';
import { getDestinationParts } from '../../../stores/game/editorDestinationStore';
import { getEditorGameNpcs } from '../../../stores/game/editorGameNpcStore';
import type { AvoidZone } from './CompanionAvoidanceController';
import type { CharacterPresence } from '../../../types/game/support';

const TICK_DT = 0.1;

// Zones companions spread around WHILE FOLLOWING (objective spots + NPCs). Ignored while navigating to a task.
function followAvoidZones(): AvoidZone[] {
  return [
    ...getDestinationParts()
      .filter((p) => p.enabled && (p.kind === 'dropoff_zone' || p.kind === 'repair_device' || p.kind === 'marker'))
      .map((p) => ({ x: p.position[0], z: p.position[2], radius: Math.max(p.radius ?? 0, 2.2) })),
    ...getEditorGameNpcs()
      .filter((n) => n.position)
      .map((n) => ({ x: n.position![0], z: n.position![2], radius: Math.max(n.interactionRadius ?? 0, 2.4) })),
  ];
}

function activityText(p: CharacterPresence): string {
  const name = getEditorCharacter(p.characterId)?.name ?? p.characterId;
  if (p.aiState === 'assist-objective') return `${name} is working the objective`;
  if (p.aiState === 'move-to-point') return `${name} is heading to a task`;
  if (p.missionContribution) return `${name}: ${p.missionContribution}`;
  return `${name} is following`;
}

// The autonomous companion AI tick: each non-controlled companion claims the nearest objective its abilities
// suit, navigates there, works it, and (full autonomy) completes it via the mission runtime — which
// ObjectiveDirectorHost mirrors into the normal completion + reward pipeline. No task → follow the player.
export const CompanionAiHost = () => {
  useEffect(() => {
    const id = window.setInterval(() => {
      const state = useSupportRuntimeStore.getState();
      const controlled = state.ownership.controlledCharacterId;
      const runtime = useMissionStore.getState().runtime;
      const player = { x: robotHandle.pos.x, z: robotHandle.pos.z };
      const zones = followAvoidZones();
      const others = state.presences.map((p) => ({ x: p.position[0], z: p.position[2] }));
      const completed: { characterId: string; objectiveId: string }[] = [];

      // Claim objectives already being worked, so a second companion picks a different one.
      const claimed = new Set<string>();
      for (const p of state.presences) {
        if (p.characterId === controlled || !p.taskObjectiveId) continue;
        if (!runtime?.objectiveProgress[p.taskObjectiveId]?.done) claimed.add(p.taskObjectiveId);
      }

      const next = state.presences.map((presence, index) => {
        if (presence.characterId === controlled) return presence;
        const profile = getSupportProfileForCharacter(presence.characterId);
        const ai = profile ? getSupportAiProfile(profile.aiProfileId) : undefined;
        if (!profile || !ai) return presence;

        // (Re)assign a task when the companion has none or its current one is finished.
        let working = presence;
        const currentDone = presence.taskObjectiveId ? !!runtime?.objectiveProgress[presence.taskObjectiveId]?.done : true;
        if (!presence.taskObjectiveId || currentDone) {
          const from = { x: presence.position[0], z: presence.position[2] };
          const target = pickObjectiveTarget(profile, from, claimed);
          if (target) {
            claimed.add(target.objectiveId);
            working = { ...presence, taskObjectiveId: target.objectiveId, taskTarget: [target.x, target.z], workElapsed: 0 };
          } else if (presence.taskObjectiveId) {
            working = { ...presence, taskObjectiveId: undefined, taskTarget: undefined, workElapsed: 0 };
          }
        }

        const res = updateCompanionAi(working, ai, player, others, zones, index + 1, TICK_DT);
        if (res.completedObjectiveId) completed.push({ characterId: presence.characterId, objectiveId: res.completedObjectiveId });
        return res.presence;
      });

      useSupportRuntimeStore.setState({ presences: next });
      const assistMessages: string[] = [];
      for (const item of completed) {
        const profile = getSupportProfileForCharacter(item.characterId);
        if (!profile) continue;
        const event = applyCompanionObjectiveAssist(item.characterId, item.objectiveId, profile);
        if (event) assistMessages.push(event.message);
      }
      const postAssist = useSupportRuntimeStore.getState().presences;
      const busy = postAssist.find((p) => p.characterId !== controlled && (p.aiState === 'assist-objective' || p.aiState === 'move-to-point' || !!p.missionContribution));
      useSupportRuntimeStore.getState().setLastAssistText(assistMessages[0] ?? (busy ? activityText(busy) : null));
    }, 100);
    return () => window.clearInterval(id);
  }, []);
  return null;
};
