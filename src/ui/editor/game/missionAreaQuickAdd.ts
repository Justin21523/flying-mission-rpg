import { nanoid } from 'nanoid';
import type { DestinationPart, DestinationPartKind } from '../../../types/game/destination';

export const MISSION_AREA_ID = 'aero_destination';

export const MISSION_PART_PRESETS: { kind: DestinationPartKind; label: string; color: string; size: [number, number, number]; radius?: number }[] = [
  { kind: 'building', label: 'Building', color: '#7c8db0', size: [4, 4, 4] },
  { kind: 'carry_item', label: 'Carry Item', color: '#f59e0b', size: [1, 1, 1], radius: 1.4 },
  { kind: 'lost_item', label: 'Lost Item', color: '#38bdf8', size: [1, 1, 1], radius: 1.4 },
  { kind: 'repair_device', label: 'Repair Device', color: '#22c55e', size: [1.4, 1.8, 1.4], radius: 1.6 },
  { kind: 'dropoff_zone', label: 'Dropoff Zone', color: '#a855f7', size: [4, 0.2, 4], radius: 3 },
  { kind: 'safe_zone', label: 'Safe Zone', color: '#10b981', size: [5, 0.2, 5], radius: 3.5 },
];

export function makeMissionAreaPart(kind: DestinationPartKind, position: [number, number, number]): DestinationPart {
  const preset = MISSION_PART_PRESETS.find((p) => p.kind === kind) ?? MISSION_PART_PRESETS[0];
  const id = `dst_${nanoid(6)}`;
  return {
    id,
    kind,
    label: preset.label,
    position,
    rotation: [0, 0, 0],
    scale: 1,
    size: preset.size,
    radius: preset.radius,
    color: preset.color,
    enabled: true,
  };
}
