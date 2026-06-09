// POLI — portals / doors. A portal is a placed object that travels the player to a target area (incl. indoor
// areas authored in the 🗺 World tab) at a target spawn or a paired return portal. Authored in the 🚪 Portals
// tab, placed/moved with the standard Edit-Mode gizmo, and rendered by PortalLayer. The interiors themselves
// are ordinary areas the user builds — a portal just links to one.

export type PortalActivation = 'proximity' | 'interact';
export const PORTAL_ACTIVATIONS: PortalActivation[] = ['proximity', 'interact'];

export interface PortalDef {
  id: string;
  areaId: string;                       // area the portal lives in
  name: string;
  position: [number, number, number];
  rotation?: number;                    // Y rotation of the portal mesh (radians)
  modelAssetId?: string;                // GLB shown instead of the arch stub
  color?: string;                       // glow / stub colour
  activation: PortalActivation;         // 'proximity' (walk in) | 'interact' (press E)
  radius?: number;                      // trigger / prompt radius (default 2.5)
  targetAreaId: string;                 // destination area (may be indoor; default = same area)
  // The EXIT — where the player lands after teleporting. A second gizmo-movable point (in the target area).
  exitPosition?: [number, number, number];
  spawnFacing?: number;                 // arrival facing (radians)
  twoWay?: boolean;                     // flavour: this portal also serves as a return entrance
  locked?: boolean;                     // hard-locked (never opens unless a requirement is met)
  requiresItemId?: string;              // unlocks when the player holds this inventory item
  requiresFlag?: string;                // unlocks when this world flag is set
  interior?: boolean;                   // marks the destination as an interior (flavour / icon)
  fade?: boolean;                       // play a screen fade on travel
}
