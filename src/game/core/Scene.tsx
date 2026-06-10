import { Physics } from '@react-three/rapier';
import { PerformanceMonitor, OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useUiStore } from '../../stores/uiStore';
import { useDevStore } from '../../stores/devStore';
import { GreyBoxScene } from '../../app/GreyBoxScene';
import { useEditorEnvironmentStore } from '../../stores/editorEnvironmentStore';
import { useEditorWorldStore } from '../../stores/editorWorldStore';
import { usePlayerStore } from '../../stores/playerStore';
import { DynamicAmbience } from '../world/DynamicAmbience';
import { EditModeAmbience } from '../edit/EditModeAmbience';
import { AreaRenderer } from '../world/AreaRenderer';
import { WeatherParticles } from '../world/WeatherParticles';
import { BiomeParticles } from '../world/BiomeParticles';
import { SceneEditorGizmo } from '../edit/SceneEditorGizmo';
import { FollowCamera } from '../camera/FollowCamera';
import { Player } from '../player/Player';
import { TransformSmoke } from '../player/TransformSmoke';
import { FlightJet } from '../player/FlightJet';
import { SkidMarks } from '../player/SkidMarks';
import { AbilityFx } from '../player/AbilityFx';
import { SuperAbilityFx } from '../player/SuperAbilityFx';
import { KillFxLayer } from '../player/KillFxLayer';
import { SummonLayer } from '../poli/SummonLayer';
import { AfterimageLayer } from '../player/AfterimageLayer';

// Kit — the 3D scene: ambience (day/night or flat-bright edit lighting + sky backdrop), the current
// area (ground + set-pieces + travel gates via AreaRenderer), weather/biome particles, the player, and
// the camera. Switching areas (walk through a gate) just re-renders AreaRenderer with the new id.
// Adaptive resolution: when FPS drops, render at a lower device-pixel-ratio (the biggest fill-bound win
// with 4K textures / shadows); recover it when there's headroom. Bounds keep it readable.
const AdaptiveDpr = () => {
  const setDpr = useThree((s) => s.setDpr);
  return <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} flipflops={3} onFallback={() => setDpr(1)} />;
};

export const Scene = () => {
  const editMode = useUiStore((s) => s.editMode);
  const sceneMode = useDevStore((s) => s.sceneMode);
  const areaId = usePlayerStore((s) => s.currentAreaId);
  // Subscribe so the world reacts to environment edits.
  useEditorEnvironmentStore((s) => s.overrides);
  useEditorEnvironmentStore((s) => s.defaultMode);
  // Indoor areas have no sky/weather — subscribe so toggling indoor in the 🗺 World tab applies live.
  const indoor = useEditorWorldStore((s) => s.areas.find((a) => a.id === areaId)?.indoor === true);

  // Batch 0 grey-box base scene — a self-contained ground + cubes + orbit camera. No physics/player/
  // world coupling; Edit Mode lighting + gizmos still attach so F1 keeps working. Default scene mode.
  if (sceneMode === 'greybox') {
    return (
      <>
        <AdaptiveDpr />
        {editMode ? <EditModeAmbience /> : <DynamicAmbience />}
        <GreyBoxScene />
        <OrbitControls makeDefault target={[0, 0.75, 0]} />
        {editMode && <SceneEditorGizmo />}
      </>
    );
  }

  return (
    <>
      <AdaptiveDpr />
      {editMode ? <EditModeAmbience /> : <DynamicAmbience />}

      <Physics gravity={[0, -9.81, 0]}>
        <AreaRenderer areaId={areaId} />
        <Player />
      </Physics>

      {/* Sky-driven ambient particles — outdoor only (indoor areas have no weather). */}
      {!editMode && !indoor && (
        <>
          <WeatherParticles />
          <BiomeParticles />
        </>
      )}
      {/* Player VFX — always on in play mode (indoor or outdoor). */}
      {!editMode && (
        <>
          <TransformSmoke />
          <FlightJet />
          <SkidMarks />
          <AbilityFx />
          <SuperAbilityFx />
          <KillFxLayer />
          <SummonLayer />
          <AfterimageLayer />
        </>
      )}

      <FollowCamera />
      {editMode && <SceneEditorGizmo />}
    </>
  );
};
