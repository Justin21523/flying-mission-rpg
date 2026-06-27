// A reusable, save-able fragment of editor content — one effect, a whole timeline, a flight keyframe, etc.
// The payload is the EXISTING config object (a TransformationEffectConfig, an effects[] array, …) cloned
// verbatim — presets WRAP existing types, they never replace them. `kind` discriminates the payload shape and
// which editor consumes it. `authoredFor` is provenance only (where it was made), NOT a binding: a preset can
// be applied to any character/form by re-keying ids on insert.
export type PresetKind =
  | 'transformation.effect' // one TransformationEffectConfig
  | 'transformation.full' // a whole TransformationEffectConfig[] (a timeline of effects)
  | 'flight.cameraKeyframe'
  | 'flight.event'
  | 'flight.phase'
  | 'skill.full'
  | 'skill.event';

export interface EditorPreset<T = unknown> {
  id: string;
  kind: PresetKind;
  name: string;
  description?: string;
  tags?: string[];
  payloadVersion: number; // schema version of `payload` for future migration
  createdAt: number;
  updatedAt: number;
  authoredFor?: { characterId?: string; formId?: string };
  payload: T;
}
