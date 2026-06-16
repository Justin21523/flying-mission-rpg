import type { IncidentType, RescueRoleTag } from '../../types/incidentTypes';

// Per-type metadata (Batch G) — drives mock generation defaults + Edit-Mode display. Pure data.
export interface IncidentTypeDefinition {
  type: IncidentType;
  label: string;
  blurb: string;
  defaultDangerLevel: 1 | 2 | 3 | 4 | 5;
  typicalRoles: RescueRoleTag[];
  icon: string;
}

export const INCIDENT_TYPE_DEFINITIONS: Record<IncidentType, IncidentTypeDefinition> = {
  'road-accident': { type: 'road-accident', label: 'Road Accident', blurb: 'Stalled vehicle blocks the road; bystanders panic.', defaultDangerLevel: 2, typicalRoles: ['traffic-control', 'repair', 'air-rescue'], icon: '🚗' },
  'fire-event': { type: 'fire-event', label: 'Fire Event', blurb: 'A fire source spreads smoke; NPCs need evacuation.', defaultDangerLevel: 4, typicalRoles: ['fire-rescue', 'medical', 'shield', 'evacuation'], icon: '🔥' },
  'mechanical-failure': { type: 'mechanical-failure', label: 'Mechanical Failure', blurb: 'A device is corrupted and an energy barrier blocks the way.', defaultDangerLevel: 3, typicalRoles: ['repair', 'engineering', 'scan'], icon: '🔧' },
  'npc-trapped': { type: 'npc-trapped', label: 'NPC Trapped', blurb: 'A bystander is trapped behind debris or stuck high up.', defaultDangerLevel: 2, typicalRoles: ['air-rescue', 'heavy-break', 'evacuation'], icon: '🆘' },
  'building-damaged': { type: 'building-damaged', label: 'Building Damaged', blurb: 'A structure is damaged and unsafe.', defaultDangerLevel: 3, typicalRoles: ['engineering', 'shield', 'evacuation'], icon: '🏚' },
  'bridge-collapse': { type: 'bridge-collapse', label: 'Bridge Collapse', blurb: 'A crossing has failed; the route is blocked.', defaultDangerLevel: 4, typicalRoles: ['heavy-break', 'engineering', 'air-rescue'], icon: '🌉' },
  'flood-or-leak': { type: 'flood-or-leak', label: 'Flood / Leak', blurb: 'Water floods an area and shorts devices.', defaultDangerLevel: 3, typicalRoles: ['repair', 'evacuation', 'shield'], icon: '🌊' },
  'power-outage': { type: 'power-outage', label: 'Power Outage', blurb: 'Power is down; systems and signals fail.', defaultDangerLevel: 2, typicalRoles: ['repair', 'engineering', 'scan'], icon: '⚡' },
  'traffic-chaos': { type: 'traffic-chaos', label: 'Traffic Chaos', blurb: 'Signals fail and traffic snarls.', defaultDangerLevel: 2, typicalRoles: ['traffic-control', 'scan'], icon: '🚦' },
  'high-place-rescue': { type: 'high-place-rescue', label: 'High-place Rescue', blurb: 'Someone is stranded at height.', defaultDangerLevel: 3, typicalRoles: ['air-rescue', 'medical'], icon: '🪂' },
  'medical-rescue': { type: 'medical-rescue', label: 'Medical Rescue', blurb: 'An injured NPC needs stabilizing + evacuation.', defaultDangerLevel: 3, typicalRoles: ['medical', 'evacuation'], icon: '🚑' },
  'multi-stage-composite': { type: 'multi-stage-composite', label: 'Composite Incident', blurb: 'Several problems chain together: accident + failure + threat.', defaultDangerLevel: 5, typicalRoles: ['scan', 'traffic-control', 'repair', 'air-rescue', 'combat'], icon: '🌀' },
};

export function getIncidentTypeDefinition(type: IncidentType): IncidentTypeDefinition {
  return INCIDENT_TYPE_DEFINITIONS[type];
}
