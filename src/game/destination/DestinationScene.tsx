import { useEffect } from 'react';
import { Physics } from '@react-three/rapier';
import { useUiStore } from '../../stores/uiStore';
import { useGameStore } from '../../stores/game/useGameStore';
import { EditModeAmbience } from '../edit/EditModeAmbience';
import { WorldSkyAmbience } from '../flight/world/WorldSkyAmbience';
import { SceneEditorGizmo } from '../edit/SceneEditorGizmo';
import { FollowCamera } from '../camera/FollowCamera';
import { PhaseCameraGizmo } from '../camera/PhaseCameraGizmo';
import { EditableGround } from '../world/EditableGround';
import { DestinationLayoutLayer } from './DestinationLayoutLayer';
import { DestinationNpcLayer } from './DestinationNpcLayer';
import { RobotDescentController } from './RobotDescentController';
import { RobotGroundController } from './RobotGroundController';
import { LandingSettle } from './LandingSettle';
import { ObjectiveDirectorHost } from '../missions/ObjectiveDirectorHost';
import { useDestinationRuntimeStore } from '../../stores/game/destinationRuntimeStore';
import { useGroundAbilityStore } from '../../stores/game/groundAbilityStore';
import { GroundAbilityFx } from './GroundAbilityFx';
import { GroundAfterimageLayer } from './GroundAfterimageLayer';
import { SuperAbilityFx } from '../player/SuperAbilityFx';

// The destination vertical slice (DESCENT → LANDING → NPC_GREETING → MISSION_GAMEPLAY → MISSION_COMPLETE).
// One scene for all five phases: the POLI editable ground ('aero_destination' — sculpt/PBR/environment
// tools work here), the gizmo-editable layout + NPCs, and the phase-appropriate controller. Edit Mode shows
// everything selectable with the flat-bright ambience. Runtime resets on unmount.
const GROUND_PHASES = new Set(['NPC_GREETING', 'MISSION_GAMEPLAY', 'MISSION_COMPLETE']);

export const DestinationScene = () => {
  const editMode = useUiStore((s) => s.editMode);
  const phase = useGameStore((s) => s.phase);

  useEffect(() => {
    return () => {
      useDestinationRuntimeStore.getState().reset();
      useGroundAbilityStore.getState().reset();
    };
  }, []);

  return (
    <>
      {editMode ? <EditModeAmbience /> : <WorldSkyAmbience top="#4a90d9" bottom="#d6ecff" />}

      <Physics gravity={[0, -9.81, 0]}>
        {/* POLI editable landing ground — 🌤 Environment / 🗺 World / terrain sculpt / PBR edit this area. */}
        <EditableGround areaId="aero_destination" />
        <DestinationLayoutLayer />
        {!editMode && GROUND_PHASES.has(phase) && <RobotGroundController />}
      </Physics>

      <DestinationNpcLayer />
      {!editMode && phase === 'DESCENT' && <RobotDescentController />}
      {!editMode && phase === 'LANDING' && <LandingSettle />}
      {!editMode && (phase === 'NPC_GREETING' || phase === 'MISSION_GAMEPLAY') && <ObjectiveDirectorHost />}
      {!editMode && GROUND_PHASES.has(phase) && (
        <>
          <GroundAbilityFx />
          <GroundAfterimageLayer />
          <SuperAbilityFx />
        </>
      )}

      <FollowCamera />
      {editMode && <SceneEditorGizmo />}
      {editMode && <PhaseCameraGizmo />}
    </>
  );
};
