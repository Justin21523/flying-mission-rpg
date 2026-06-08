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

      {(area?.connectedAreaIds ?? []).map((targetId) => {
        const g = edgeGate(targetId);
        return (
          <ZoneGate
            key={targetId}
            targetAreaId={targetId}
            label={getKitArea(targetId)?.name ?? targetId}
            position={g.position}
          />
        );
      })}
    </>
  );
};
