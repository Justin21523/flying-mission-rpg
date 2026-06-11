import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { useGameStore } from '../../stores/game/useGameStore';
import { useMissionStore } from '../../stores/game/useMissionStore';
import { getEditorMission } from '../../stores/game/editorMissionStore';
import { getDestinationParts } from '../../stores/game/editorDestinationStore';
import { getEditorGameNpcs } from '../../stores/game/editorGameNpcStore';
import { useDestinationRuntimeStore } from '../../stores/game/destinationRuntimeStore';
import { useDialogueStore } from '../../stores/dialogueStore';
import { getDialogueTree } from '../dialogue/dialogueRegistry';
import { phaserBridge } from '../phaser/phaserBridge';
import { ObjectiveModel } from './objectiveModel';
import { runEffects } from './missionEffects';
import { robotHandle } from '../destination/robotHandle';
import { destinationDev } from '../destination/destinationDev';
import type { DestinationPart } from '../../types/game/destination';

// The OBJECTIVE DIRECTOR (logic host, one useFrame — the rules live in the pure ObjectiveModel). Watches
// the robot's distance to NPCs / mission objects, shows the [E] prompt, applies pickups/dropoffs, opens the
// repair mini-game, receives Phaser results through the bridge ONLY, syncs progress into useMissionStore,
// and transitions to MISSION_COMPLETE when every required objective is done.
const dist2 = (p: DestinationPart | { position: [number, number, number] }, x: number, z: number) => {
  const dx = p.position[0] - x;
  const dz = p.position[2] - z;
  return dx * dx + dz * dz;
};

export const ObjectiveDirectorHost = () => {
  const model = useRef<ObjectiveModel | null>(null);
  const eDown = useRef(false);
  const done = useRef(false);
  const carried = useRef<Group>(null);
  const missionId = useMissionStore((s) => s.currentMissionId);

  // (Re)build the model for the active mission; subscribe to the Phaser bridge for repair results.
  useEffect(() => {
    const def = missionId ? getEditorMission(missionId) : undefined;
    if (def) {
      const partIds = new Set(getDestinationParts().filter((p) => p.enabled).map((p) => p.id));
      model.current = new ObjectiveModel(def.objectives, partIds);
      model.current.startAll();
    } else {
      model.current = null;
    }
    done.current = false;

    const unsub = phaserBridge.subscribe((evt) => {
      const m = model.current;
      if (!m) return;
      if (evt.type === 'mini-game-success') {
        const r = m.miniGameResult(evt.miniGameId, true);
        if (r.objective) useMissionStore.getState().setObjective(r.objective.id, r.completed, m.counts[r.objective.id]);
      }
      // fail / cancel → objective stays active for retry (no state pollution)
    });

    const down = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.code === 'KeyE') eDown.current = true;
    };
    window.addEventListener('keydown', down);
    return () => {
      unsub();
      window.removeEventListener('keydown', down);
      useDestinationRuntimeStore.getState().setPrompt(null);
    };
  }, [missionId]);

  useFrame(() => {
    const rt = useDestinationRuntimeStore.getState();
    const phase = useGameStore.getState().phase;
    const m = model.current;
    const x = robotHandle.pos.x;
    const z = robotHandle.pos.z;
    const pressed = eDown.current;
    eDown.current = false;

    // dev commands
    if (destinationDev.forceCompleteMission && m) {
      destinationDev.forceCompleteMission = false;
      for (const key of Object.keys(m.states)) if (m.states[key] === 'active') m.states[key] = 'completed';
    }
    if (destinationDev.resetCarry && m) {
      destinationDev.resetCarry = false;
      m.resetCarry();
      rt.setCarrying(null);
    }

    // dialogue open → no world prompts/interactions
    if (useDialogueStore.getState().isActive) {
      rt.setPrompt(null);
      return;
    }

    let prompt: string | null = null;
    const parts = getDestinationParts().filter((p) => p.enabled);

    // 1) NPC talk (greeting + gameplay)
    const npcs = getEditorGameNpcs().filter((n) => n.position);
    for (const n of npcs) {
      const r = n.interactionRadius ?? 4;
      if (dist2({ position: n.position! }, x, z) <= r * r) {
        prompt = `Talk to ${n.name} (E)`;
        if (pressed) {
          const treeId = n.dialogueTreeId && getDialogueTree(n.dialogueTreeId) ? n.dialogueTreeId : null;
          if (treeId) useDialogueStore.getState().startDialogue(treeId);
        }
        break;
      }
    }

    // 2) mission-object interactions (gameplay only)
    if (!prompt && phase === 'MISSION_GAMEPLAY' && m) {
      for (const p of parts) {
        const r = p.radius ?? 3;
        if (dist2(p, x, z) > r * r) continue;
        if ((p.kind === 'carry_item' || p.kind === 'lost_item') && !rt.collectedIds.includes(p.id) && rt.carryingId !== p.id) {
          prompt = `Pick up ${p.label} (E)`;
          if (pressed) {
            const res = m.tryPickup(p.id);
            if (res.attached) rt.setCarrying(p.id);
            else if (res.objective) {
              rt.addCollected(p.id);
              useMissionStore.getState().setObjective(res.objective.id, res.completed, m.counts[res.objective.id]);
            }
          }
          break;
        }
        if (p.kind === 'dropoff_zone' && rt.carryingId) {
          prompt = `Deliver ${getDestinationParts().find((q) => q.id === rt.carryingId)?.label ?? 'item'} (E)`;
          if (pressed) {
            const res = m.tryDropoff(p.id);
            if (res.completed && res.objective) {
              rt.addCollected(rt.carryingId);
              rt.setCarrying(null);
              useMissionStore.getState().setObjective(res.objective.id, true, m.counts[res.objective.id]);
            }
          }
          break;
        }
        if (p.kind === 'repair_device' && !rt.collectedIds.includes(p.id)) {
          prompt = `Repair ${p.label} (E)`;
          if (pressed && !phaserBridge.isOpen()) phaserBridge.openMiniGame(p.miniGameId ?? 'repair_wiring');
          break;
        }
      }
    }

    rt.setPrompt(prompt);

    // carried item rides above the robot
    if (carried.current) {
      carried.current.visible = !!rt.carryingId;
      carried.current.position.set(robotHandle.pos.x, robotHandle.pos.y + 2.2, robotHandle.pos.z);
    }

    // completion → fire the mission's reward/flag effects (once), then MISSION_COMPLETE
    if (phase === 'MISSION_GAMEPLAY' && m && !done.current && m.allRequiredDone()) {
      done.current = true;
      const def = missionId ? getEditorMission(missionId) : undefined;
      runEffects(def?.completionEffects);
      useMissionStore.getState().completeMission();
      useGameStore.getState().requestTransition('MISSION_COMPLETE');
    }
  });

  const carriedColor = useDestinationRuntimeStore((s) => (s.carryingId ? getDestinationParts().find((p) => p.id === s.carryingId)?.color ?? '#f59e0b' : '#f59e0b'));
  return (
    <group ref={carried} visible={false}>
      <mesh castShadow>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial color={carriedColor} emissive={carriedColor} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
};
