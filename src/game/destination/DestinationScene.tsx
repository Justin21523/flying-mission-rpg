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
import { SceneSetPieceLayer } from '../world/SceneSetPieceLayer';
import { DestinationLayoutLayer } from './DestinationLayoutLayer';
import { DestinationNpcLayer } from './DestinationNpcLayer';
import { RobotDescentController } from './RobotDescentController';
import { RobotGroundController } from './RobotGroundController';
import { LandingSettle } from './LandingSettle';
import { ObjectiveDirectorHost } from '../missions/ObjectiveDirectorHost';
import { AdvancedMissionZoneDirectorHost } from '../advanced-mission-zone/AdvancedMissionZoneDirectorHost';
import { ZoneMarkerLayer } from '../advanced-mission-zone/ZoneMarkerLayer';
import { CombatRuntimeLayer } from '../combat/CombatRuntimeLayer';
import { useDestinationRuntimeStore } from '../../stores/game/destinationRuntimeStore';
import { useGroundAbilityStore } from '../../stores/game/groundAbilityStore';
import { GroundAbilityFx } from './GroundAbilityFx';
import { GroundAfterimageLayer } from './GroundAfterimageLayer';
import { GroundJetExhaustLayer } from './GroundJetExhaustLayer';
import { SuperAbilityFx } from '../player/SuperAbilityFx';
import { DestinationYokaiLayer } from './DestinationYokaiLayer';
import { KillFxLayer } from '../player/KillFxLayer';
import { SupportCompanionLayer } from '../characters/runtime/SupportCompanionLayer';
import { CompanionAiHost } from '../characters/ai/CompanionAiHost';
import { ControlSwitchInput } from '../characters/control/ControlSwitchInput';
import { PoseSwitchFxLayer } from '../characters/PoseSwitchFxLayer';

// The destination vertical slice (DESCENT → LANDING → NPC_GREETING → MISSION_GAMEPLAY → MISSION_COMPLETE).
// One scene for all five phases: the POLI editable ground ('aero_destination' — sculpt/PBR/environment
// tools work here), the gizmo-editable layout + NPCs, and the phase-appropriate controller. Edit Mode shows
// everything selectable with the flat-bright ambience. Runtime resets on unmount.
const GROUND_PHASES = new Set(['NPC_GREETING', 'MISSION_GAMEPLAY', 'ADVANCED_MISSION_ZONE', 'ZONE_SEGMENT_GAMEPLAY', 'ZONE_COMPLETE', 'SUPPORT_SELECTION', 'MISSION_COMPLETE']);
// Advanced Mission Zone gameplay phases — drive the zone director host + markers.
const ZONE_PHASES = new Set(['ADVANCED_MISSION_ZONE', 'ZONE_SEGMENT_GAMEPLAY', 'ZONE_COMPLETE']);
// Combat Runtime phases — where skills / dummy targets / damage are active (not during ZONE_COMPLETE toast).
const COMBAT_PHASES = new Set(['ADVANCED_MISSION_ZONE', 'ZONE_SEGMENT_GAMEPLAY', 'MISSION_GAMEPLAY']);

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
        <SceneSetPieceLayer areaId="aero_destination" />
        {!editMode && GROUND_PHASES.has(phase) && <RobotGroundController />}
        {!editMode && GROUND_PHASES.has(phase) && <SupportCompanionLayer />}
      </Physics>

      <DestinationNpcLayer />
      <PoseSwitchFxLayer />
      {!editMode && phase === 'DESCENT' && <RobotDescentController />}
      {!editMode && phase === 'LANDING' && <LandingSettle />}
      {!editMode && (phase === 'NPC_GREETING' || phase === 'MISSION_GAMEPLAY' || phase === 'ZONE_SEGMENT_GAMEPLAY') && <ObjectiveDirectorHost />}
      {/* Advanced Mission Zone — markers (edit + play) and the per-frame director host (play only). */}
      <ZoneMarkerLayer />
      {!editMode && ZONE_PHASES.has(phase) && <AdvancedMissionZoneDirectorHost />}
      {!editMode && COMBAT_PHASES.has(phase) && <CombatRuntimeLayer />}
      {!editMode && GROUND_PHASES.has(phase) && (
        <>
          <CompanionAiHost />
          <ControlSwitchInput />
          <GroundAbilityFx />
          <GroundAfterimageLayer />
          <GroundJetExhaustLayer />
          <SuperAbilityFx />
          <DestinationYokaiLayer />
          <KillFxLayer />
        </>
      )}

      <FollowCamera />
      {editMode && <SceneEditorGizmo />}
      {editMode && <PhaseCameraGizmo />}
    </>
  );
};
