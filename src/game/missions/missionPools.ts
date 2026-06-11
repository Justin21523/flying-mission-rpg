import type { WorldLocation } from '../../types/game/world';
import type { NPCDefinition } from '../../types/game/npc';
import type { FlightRoute } from '../../types/game/flight';
import type { CharacterDefinition } from '../../types/game/character';
import type { DestinationPart, DestinationPartKind } from '../../types/game/destination';
import { getEditorLocations } from '../../stores/game/editorLocationStore';
import { getEditorGameNpcs } from '../../stores/game/editorGameNpcStore';
import { getEditorRoutes } from '../../stores/game/editorRouteStore';
import { getEditorCharacters } from '../../stores/game/editorCharacterStore';
import { getDestinationParts } from '../../stores/game/editorDestinationStore';
import { MINI_GAME_IDS } from '../../data/game/miniGames';

// The live editable pools the rule-based generator draws from. Collected once per generation run from the
// editor stores (so authoring changes flow straight into generation). Pure data — no React, no per-frame use.
export interface MissionPools {
  locations: WorldLocation[]; // candidate destinations (non-base)
  npcs: NPCDefinition[];
  routes: FlightRoute[];
  characters: CharacterDefinition[];
  partsByKind: Record<DestinationPartKind, DestinationPart[]>; // enabled destination parts grouped by kind
  miniGameIds: string[];
}

export function collectMissionPools(): MissionPools {
  const partsByKind = {} as Record<DestinationPartKind, DestinationPart[]>;
  for (const p of getDestinationParts()) {
    if (!p.enabled) continue;
    (partsByKind[p.kind] ??= []).push(p);
  }
  return {
    locations: getEditorLocations().filter((l) => !l.isBase),
    npcs: getEditorGameNpcs(),
    routes: getEditorRoutes(),
    characters: getEditorCharacters(),
    partsByKind,
    miniGameIds: [...MINI_GAME_IDS],
  };
}
