export type IncidentPackDefinition = { id: string; name: string; incidentTemplateIds: string[]; stageSuitability: string[] };

export const EXPANDED_INCIDENT_PACKS: IncidentPackDefinition[] = [
  { id: 'incident_pack_power_outage', name: 'Power Outage Pack', incidentTemplateIds: ['tmpl_power_outage'], stageSuitability: ['night-city', 'metro'] },
  { id: 'incident_pack_flood_rescue', name: 'Flood Rescue Pack', incidentTemplateIds: ['tmpl_flood_or_leak'], stageSuitability: ['storm-coast'] },
  { id: 'incident_pack_labyrinth_rescue', name: 'Metro Labyrinth Incident Pack', incidentTemplateIds: ['tmpl_npc_trapped', 'tmpl_power_outage'], stageSuitability: ['metro'] },
  { id: 'incident_pack_high_place_rescue', name: 'High Place Rescue Pack', incidentTemplateIds: ['tmpl_high_place_rescue'], stageSuitability: ['tower'] },
  { id: 'incident_pack_composite_finale', name: 'Composite Finale Pack', incidentTemplateIds: ['tmpl_multi_stage_composite'], stageSuitability: ['finale'] },
];
