// A region groups world locations on the map (the managed map system). Authored in the 🗺 Map tab; used to
// filter the runtime Mission Control map and to gate access (unlocked). Abstract — not a real-scale geography.
export interface Region {
  id: string;
  name: string;
  color: string; // hex — pin tint + filter chip
  description?: string;
  order?: number; // sort order in lists / filter chips
  unlocked?: boolean; // false = the whole region (its locations) is locked in Mission Control (default true)
}
