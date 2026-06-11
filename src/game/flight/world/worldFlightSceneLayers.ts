// Pure layer-visibility policy for the WORLD_FLIGHT scene (no R3F → unit-testable). EDIT MODE is a clean,
// authoring-focused view: route curve + path nodes + the editable craft + segment gizmos only — no clouds,
// speed streaks, spawned events or the event-pool gallery. PLAY MODE keeps the rich flight visuals and hides
// the edit-only craft proxy / gizmos.
export interface WorldFlightLayers {
  clouds: boolean;
  speed: boolean;
  events: boolean; // the live event director + renderer
  eventPreview: boolean; // the edit-only event-pool gallery
  routeFollower: boolean; // the play craft that flies the route
  ambience: 'edit' | 'play';
  pathDebug: boolean; // route line + node handles
  segmentGizmos: boolean; // editable segment bands
  editableCraft: boolean; // edit-only selectable craft/character
  sceneGizmo: boolean; // the shared SceneEditorGizmo
}

export function worldFlightSceneLayers(editMode: boolean): WorldFlightLayers {
  if (editMode) {
    return {
      clouds: false,
      speed: false,
      events: false,
      eventPreview: false,
      routeFollower: false,
      ambience: 'edit',
      pathDebug: true,
      segmentGizmos: true,
      editableCraft: true,
      sceneGizmo: true,
    };
  }
  return {
    clouds: true,
    speed: true,
    events: true,
    eventPreview: false,
    routeFollower: true,
    ambience: 'play',
    pathDebug: false,
    segmentGizmos: false,
    editableCraft: false,
    sceneGizmo: false,
  };
}
