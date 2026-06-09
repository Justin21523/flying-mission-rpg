import { resolveAreaEnvironment } from '../environment/resolveAreaEnvironment';
import { resolveAreaTheme } from '../environment/areaBiome';
import { getKitArea } from '../../data/areas';
import { edgeGate } from './gateLayout';
import { ZoneFloor } from './ZoneFloor';
import { HeightfieldGround } from './HeightfieldGround';
import { FlatPbrGround, PbrGroundPlane } from './FlatPbrGround';
import { PbrPatchLayer } from './PbrPatchLayer';
import { SceneSetPieceLayer } from './SceneSetPieceLayer';
import { SampleEntities } from './SampleEntities';
import { EditableNpcLayer } from './EditableNpcLayer';
import { LandmarkLayer } from './LandmarkLayer';
import { MapPointLayer } from './MapPointLayer';
import { PortalLayer } from './PortalLayer';
import { RoadEditLayer } from './RoadEditLayer';
import { IncidentMarkerEditLayer } from './IncidentMarkerEditLayer';
import { BoundaryMistLayer } from './BoundaryMistLayer';
import { LayoutLayer } from './LayoutLayer';
import { EdgeTransitionLayer } from './EdgeTransitionLayer';
import { PickupLayer } from '../poli/PickupLayer';
import { CollectibleLayer } from '../poli/CollectibleLayer';
import { useEditorWorldStore } from '../../stores/editorWorldStore';
import { EditableTriggerRenderer } from '../editor/EditableTriggerRenderer';
import { QuestMarkerRenderer } from '../editor/QuestMarkerRenderer';
import { EncounterMarkerRenderer } from '../editor/EncounterMarkerRenderer';
import { ActivityArenaRenderer } from '../editor/ActivityArenaRenderer';
import { ZoneGate } from './ZoneGate';
import { PoliNpcLayer } from '../poli/PoliNpcLayer';
import { IncidentLayer } from '../poli/IncidentLayer';
import { TrafficLayer } from '../poli/TrafficLayer';
import { YokaiCombatLayer } from '../poli/YokaiCombatLayer';
import { NpcPathGizmoLayer } from './NpcPathGizmoLayer';
import { POLI_SANDBOX } from '../../data/poli/sandboxConfig';
import { useUiStore } from '../../stores/uiStore';
import { useMergedTransform } from '../../stores/sceneEditStore';
import { objKey } from '../edit/sceneEditMerge';
import { EditableObject } from '../edit/EditableObject';

// A travel gate that follows the kit Edit-Mode pipeline like every other object: in Edit Mode it's
// a selectable EditableObject (centred gizmo + W/E/R + inspector, position persisted); in Play Mode
// it's the real ZoneGate (with its travel sensor) at the merged (authored ⊕ edited) position.
const GatePlacement = ({ areaId, targetId, label }: { areaId: string; targetId: string; label: string }) => {
  const editMode = useUiStore((s) => s.editMode);
  const g = edgeGate(targetId);
  const key = objKey(areaId, 'trigger', `gate_${targetId}`);
  const base = { position: g.position, rotation: [0, 0, 0] as [number, number, number], scale: 1 };
  const m = useMergedTransform(key, base);

  if (editMode) {
    // Proxy visual only (no troika <Text> — its material must not be cloned by the selection tint).
    return (
      <EditableObject objKey={key} base={base}>
        <mesh castShadow>
          <boxGeometry args={[4, 4, 0.3]} />
          <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.3} transparent opacity={0.7} />
        </mesh>
      </EditableObject>
    );
  }
  return <ZoneGate targetAreaId={targetId} label={label} position={m.position} />;
};

// Kit — renders one area's world: the ground stack (flat / flat-PBR / heightfield terrain via the
// environment system), placed GLB set-pieces, PBR patch decals, and a travel gate to every connected
// area. Yokai-free: no spawns / encounters — extend this (or add sibling layers) to render your own
// entities. Driven entirely by data (areas.ts) + the per-area environment override.
export const AreaRenderer = ({ areaId }: { areaId: string }) => {
  const env = resolveAreaEnvironment(areaId);
  const theme = resolveAreaTheme(areaId);
  const area = getKitArea(areaId);
  // POLI — when edge-walk is on, portals are replaced by walk-off-edge transitions (EdgeTransitionLayer).
  const useEdgeWalk = useEditorWorldStore((s) => s.useEdgeWalk);

  return (
    <>
      {/* Infinite safety base under every ground type (open map → never fall). Heightfield/FlatPbr visuals
          layer on top within the area; this flat base continues beyond them. Dropped slightly for heightfield
          so it doesn't z-fight the sculpted terrain. */}
      <ZoneFloor color={theme.groundColor} y={env.groundType === 'heightfield' ? -0.6 : 0} />
      <HeightfieldGround areaId={areaId} />
      {/* Heightfield: continue the area's PBR ground material infinitely BEYOND the sculpted terrain, so the
          textured ground matches the open map (just below the terrain; terrain covers it within the area). */}
      {env.groundType === 'heightfield' && (env.pbrGround.albedoUrl || env.pbrGround.gltfMaterialUrl) && (
        <PbrGroundPlane areaId={areaId} y={-0.5} />
      )}
      <FlatPbrGround areaId={areaId} />
      <PbrPatchLayer areaId={areaId} />
      <SceneSetPieceLayer areaId={areaId} />
      {/* Pre-authored "background" content — hidden in POLI sandbox mode (blank canvas).
          Code kept; set POLI_SANDBOX=false in data/poli/sandboxConfig.ts to restore. */}
      {!POLI_SANDBOX && <SampleEntities areaId={areaId} />}
      {/* POLI seam #1: additive NPC layer — schedule-driven, trust-gated dialogue */}
      {!POLI_SANDBOX && <PoliNpcLayer areaId={areaId} />}
      {/* POLI seam #1b: incident layer — shows only incidents SPAWNED by the IncidentDirector
          (random), so it's safe to render even in sandbox mode. */}
      <IncidentLayer areaId={areaId} />
      {/* POLI yokai-hunt: live yokai while an enemyRush activity runs in this area (play-mode runtime). */}
      <YokaiCombatLayer areaId={areaId} />
      {/* POLI seam #1c: traffic layer — editable NPC vehicles + traffic signals (always rendered;
          edit them in the 🚦 Traffic tab). */}
      <TrafficLayer areaId={areaId} />
      {/* POLI seam #1d: layout layer — the active layout preset's placed models (🗺 World tab). */}
      <LayoutLayer areaId={areaId} />
      {/* POLI seam #1e: ground pickups that fill the boost meter (⭐ Boost tab). */}
      <PickupLayer areaId={areaId} />
      {/* POLI seam #1g: primitive collectibles → resource economy (🌤 Environment tab → Collectibles). */}
      <CollectibleLayer areaId={areaId} />
      <EditableNpcLayer areaId={areaId} />
      <NpcPathGizmoLayer areaId={areaId} />
      <LandmarkLayer areaId={areaId} />
      {/* POLI seam #1f: named map points (POI / spawn / teleport) authored in the 🗺 World tab. */}
      <MapPointLayer areaId={areaId} />
      {/* POLI seam #1h: portals/doors (🚪 Portals tab) — travel into buildings / indoor areas. */}
      <PortalLayer areaId={areaId} />
      {/* POLI seam #1i: Edit-Mode road route lines + draggable node gizmos (🚦 Traffic tab). */}
      <RoadEditLayer areaId={areaId} />
      {/* POLI seam #1j: Edit-Mode incident spawn-marker gizmos (🚨 Incidents tab). */}
      <IncidentMarkerEditLayer areaId={areaId} />
      {/* POLI seam #1k: soft mist at the map boundary (obscures the void past the farthest object). */}
      <BoundaryMistLayer areaId={areaId} />
      <EditableTriggerRenderer areaId={areaId} />
      <QuestMarkerRenderer areaId={areaId} />
      <EncounterMarkerRenderer areaId={areaId} />
      <ActivityArenaRenderer areaId={areaId} />

      {/* POLI: edge-walk transitions (no portals) when enabled; else the kit's travel-gate portals. */}
      {useEdgeWalk
        ? <EdgeTransitionLayer areaId={areaId} />
        : (area?.connectedAreaIds ?? []).map((targetId) => (
            <GatePlacement
              key={targetId}
              areaId={areaId}
              targetId={targetId}
              label={getKitArea(targetId)?.name ?? targetId}
            />
          ))}
    </>
  );
};
