import { useEnvironmentHazardPresetStore } from '../../stores/useEnvironmentEditorStore';

let hazardsEnabled = true;

export function getEnvironmentHazards(hazardPresetIds: string[]) {
  const hazards = useEnvironmentHazardPresetStore.getState().items;
  return hazardPresetIds.map((id) => hazards.find((hazard) => hazard.id === id)).filter((hazard) => !!hazard);
}

export function setStageHazardsEnabled(enabled: boolean): void {
  hazardsEnabled = enabled;
}

export function areStageHazardsEnabled(): boolean {
  return hazardsEnabled;
}
