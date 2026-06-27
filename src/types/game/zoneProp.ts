// World-build Wave 2 — decorative GLB props placed inside the advanced mission zones. Edit-Mode editable
// (gizmo-draggable via ZonePropLayer + the 🌳 Zone Props tab). Purely cosmetic this wave (no collision).
export interface ZonePropDefinition {
  id: string;
  zoneId: string;
  segmentId?: string; // omitted = shown zone-wide; set = shown only while that segment is active
  modelAssetId: string;
  position: [number, number, number];
  rotationY?: number; // degrees
  scale?: number;
  label?: string;
  enabled?: boolean;
}
