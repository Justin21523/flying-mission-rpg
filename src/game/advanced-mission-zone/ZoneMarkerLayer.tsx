import { useMemo } from 'react';
import { useUiStore } from '../../stores/uiStore';
import { useAdvancedMissionZoneStore } from '../../stores/game/useAdvancedMissionZoneStore';
import { useEditorZoneSegmentStore } from '../../stores/game/editorZoneSegmentStore';
import type { ZoneMarkerDefinition, ZoneSegmentDefinition } from '../../types/game/advancedMissionZone';

// Renders Advanced Mission Zone markers. Edit/Play parity: in Edit Mode show ALL markers of the active
// (or first) zone's segments; in Play show only the active segment's markers. Simple ring + beacon meshes
// (no nav system) — a pulsing ring on the ground and a floating beacon so the next objective reads clearly.
const DEFAULT_RADIUS = 3;

const ZoneMarker = ({ marker, dim }: { marker: ZoneMarkerDefinition; dim?: boolean }) => {
  const r = marker.radius ?? DEFAULT_RADIUS;
  const color = marker.color ?? '#38bdf8';
  const opacity = dim ? 0.25 : 0.7;
  return (
    <group position={marker.position} rotation={marker.rotation ?? [0, 0, 0]}>
      {/* ground ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[Math.max(0.1, r - 0.35), r, 40]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
      </mesh>
      {/* floating beacon */}
      <mesh position={[0, 1.6, 0]}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={dim ? 0.2 : 0.9} transparent opacity={dim ? 0.5 : 1} />
      </mesh>
    </group>
  );
};

export const ZoneMarkerLayer = () => {
  const editMode = useUiStore((s) => s.editMode);
  const activeZoneId = useAdvancedMissionZoneStore((s) => s.activeZoneId);
  const activeSegmentId = useAdvancedMissionZoneStore((s) => s.activeSegmentId);
  const completedSegmentIds = useAdvancedMissionZoneStore((s) => s.completedSegmentIds);
  const segments = useEditorZoneSegmentStore((s) => s.items);

  const { activeMarkers, dimMarkers } = useMemo(() => {
    if (editMode) {
      // Show every marker of the relevant zone, dimmed, for authoring.
      const zoneId = activeZoneId ?? segments[0]?.zoneId;
      const owned = segments.filter((s: ZoneSegmentDefinition) => s.zoneId === zoneId);
      return { activeMarkers: [] as ZoneMarkerDefinition[], dimMarkers: owned.flatMap((s) => s.markers) };
    }
    const active = segments.find((s: ZoneSegmentDefinition) => s.id === activeSegmentId);
    // Completed segments' markers dimmed; active segment's markers bright.
    const dim = segments
      .filter((s: ZoneSegmentDefinition) => completedSegmentIds.includes(s.id))
      .flatMap((s) => s.markers);
    return { activeMarkers: active?.markers ?? [], dimMarkers: dim };
  }, [editMode, activeZoneId, activeSegmentId, completedSegmentIds, segments]);

  if (!editMode && !activeZoneId) return null;

  return (
    <group>
      {dimMarkers.map((m) => (
        <ZoneMarker key={`dim_${m.id}`} marker={m} dim />
      ))}
      {activeMarkers.map((m) => (
        <ZoneMarker key={m.id} marker={m} />
      ))}
    </group>
  );
};
