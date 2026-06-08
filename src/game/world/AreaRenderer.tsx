import { resolveAreaEnvironment } from '../environment/resolveAreaEnvironment';
import { resolveAreaTheme } from '../environment/areaBiome';
import { getKitArea } from '../../data/areas';
import { edgeGate } from './gateLayout';
import { ZoneFloor } from './ZoneFloor';
import { HeightfieldGround } from './HeightfieldGround';
import { FlatPbrGround } from './FlatPbrGround';
import { PbrPatchLayer } from './PbrPatchLayer';
import { SceneSetPieceLayer } from './SceneSetPieceLayer';
import { SampleEntities } from './SampleEntities';
import { EditableNpcLayer } from './EditableNpcLayer';
import { EditableTriggerRenderer } from '../editor/EditableTriggerRenderer';
import { QuestMarkerRenderer } from '../editor/QuestMarkerRenderer';
import { EncounterMarkerRenderer } from '../editor/EncounterMarkerRenderer';
import { ActivityArenaRenderer } from '../editor/ActivityArenaRenderer';
import { ZoneGate } from './ZoneGate';
import { PoliNpcLayer } from '../poli/PoliNpcLayer';
import { IncidentLayer } from '../poli/IncidentLayer';
import { TrafficLayer } from '../poli/TrafficLayer';
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

  return (
    <>
      {env.groundType !== 'heightfield' && <ZoneFloor color={theme.groundColor} />}
      <HeightfieldGround areaId={areaId} />
      <FlatPbrGround areaId={areaId} />
      <PbrPatchLayer areaId={areaId} />
      <SceneSetPieceLayer areaId={areaId} />
      {/* Pre-authored "background" content — hidden in POLI sandbox mode (blank canvas).
          Code kept; set POLI_SANDBOX=false in data/poli/sandboxConfig.ts to restore. */}
      {!POLI_SANDBOX && <SampleEntities areaId={areaId} />}
      {/* POLI seam #1: additive NPC layer — schedule-driven, trust-gated dialogue */}
      {!POLI_SANDBOX && <PoliNpcLayer areaId={areaId} />}
      {/* POLI seam #1b: incident layer — world incidents + rescue interaction */}
      {!POLI_SANDBOX && <IncidentLayer areaId={areaId} />}
      {/* POLI seam #1c: traffic layer — NPC vehicles + traffic signals */}
      {!POLI_SANDBOX && <TrafficLayer areaId={areaId} />}
      <EditableNpcLayer areaId={areaId} />
      <EditableTriggerRenderer areaId={areaId} />
      <QuestMarkerRenderer areaId={areaId} />
      <EncounterMarkerRenderer areaId={areaId} />
      <ActivityArenaRenderer areaId={areaId} />

      {(area?.connectedAreaIds ?? []).map((targetId) => (
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
