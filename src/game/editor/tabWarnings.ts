import { getEditorRoutes } from '../../stores/game/editorRouteStore';
import { getEditorTransformations } from '../../stores/game/editorTransformationStore';
import { getDestinationParts } from '../../stores/game/editorDestinationStore';
import { getEditorGameNpcs } from '../../stores/game/editorGameNpcStore';
import { getEditorMissions } from '../../stores/game/editorMissionStore';
import { validateRoute } from '../flight/world/worldFlightValidation';
import { validateTimeline } from '../transformation/transformationValidation';
import { validateDestinationLayout, validateDestinationNpc, validateObjective } from '../destination/destinationValidation';

// Per-tab validation warning counts for the Editor Hub sidebar badges. `sumWarnings` is the pure core (each
// item → number of warnings, summed); `computeTabWarnings` wires it to the live stores + validators.
export function sumWarnings<T>(items: readonly T[], validate: (item: T) => readonly unknown[]): number {
  let n = 0;
  for (const it of items) n += validate(it).length;
  return n;
}

export function computeTabWarnings(): Record<string, number> {
  const partIds = new Set(getDestinationParts().filter((p) => p.enabled).map((p) => p.id));
  const out: Record<string, number> = {
    gworld: sumWarnings(getEditorRoutes(), validateRoute),
    gxform: sumWarnings(getEditorTransformations(), (t) => validateTimeline(t)),
    gdest: validateDestinationLayout(getDestinationParts()).length,
    gnpc: sumWarnings(getEditorGameNpcs(), (n) => validateDestinationNpc(n)),
    gmission: sumWarnings(getEditorMissions(), (m) => m.objectives.flatMap((o) => validateObjective(o, partIds))),
  };
  return out;
}
