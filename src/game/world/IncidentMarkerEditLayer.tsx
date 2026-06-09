import { Text } from '@react-three/drei';
import { useUiStore } from '../../stores/uiStore';
import { useEditorIncidentStore } from '../../stores/editorIncidentStore';
import { DataBackedPlacement } from '../edit/DataBackedPlacement';
import { objKey } from '../edit/sceneEditMerge';

// POLI — Edit-Mode handles for incident SPAWN markers. Incidents only render at runtime when spawned, so the
// authored markerPosition had no 3D handle. Here each incident in the area gets a gizmo-movable marker that
// writes straight back to its markerPosition (numeric fields in the 🚨 tab stay in sync). Edit mode only.
const noRaycast = () => null;

export const IncidentMarkerEditLayer = ({ areaId }: { areaId: string }) => {
  const editMode = useUiStore((s) => s.editMode);
  const incidents = useEditorIncidentStore((s) => s.incidents).filter((i) => i.spawnAreaId === areaId);
  if (!editMode || incidents.length === 0) return null;
  return (
    <>
      {incidents.map((i) => (
        <DataBackedPlacement
          key={i.id}
          objKey={objKey(areaId, 'trigger', i.id)}
          position={i.markerPosition}
          color="#ef4444"
          onMove={(pos) => useEditorIncidentStore.getState().updateIncident(i.id, { markerPosition: pos })}
        >
          <mesh position={[0, 0.6, 0]} castShadow>
            <coneGeometry args={[0.5, 1.2, 8]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
          </mesh>
          <Text raycast={noRaycast} position={[0, 1.7, 0]} fontSize={0.35} color="#fecaca" anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor="#000">
            {`🚨 ${i.title}`}
          </Text>
        </DataBackedPlacement>
      ))}
    </>
  );
};
