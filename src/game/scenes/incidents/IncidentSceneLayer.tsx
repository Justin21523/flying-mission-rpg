import { useUiStore } from '../../../stores/uiStore';
import { IncidentAreaRenderer } from './IncidentAreaRenderer';
import { IncidentMarkerRenderer } from './IncidentMarkerRenderer';
import { IncidentNpcStateRenderer } from './IncidentNpcStateRenderer';
import { IncidentObjectStateRenderer } from './IncidentObjectStateRenderer';
import { IncidentEnvironmentHazardRenderer } from './IncidentEnvironmentHazardRenderer';
import { IncidentDebugGizmos } from './IncidentDebugGizmos';

// In-Canvas incident scene visuals (Batch G §13). Composed + mounted in DestinationScene over zone phases so the
// SCENE reflects incident state (affected area, NPC/object states, hazards), not just the HUD. Debug gizmos in
// Edit Mode.
export const IncidentSceneLayer = () => {
  const editMode = useUiStore((s) => s.editMode);
  return (
    <>
      <IncidentAreaRenderer />
      <IncidentMarkerRenderer />
      <IncidentNpcStateRenderer />
      <IncidentObjectStateRenderer />
      <IncidentEnvironmentHazardRenderer />
      {editMode && <IncidentDebugGizmos />}
    </>
  );
};
