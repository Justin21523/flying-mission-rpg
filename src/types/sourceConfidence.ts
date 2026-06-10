// Provenance tag carried by every authored character / location / incident / tool / mission, so we never
// present adaptation-only content as official canon. Neutral home (decoupled from the dormant POLI
// `types/character.ts` copy, which is left untouched and removed with POLI later).
export type SourceConfidence =
  | 'OfficialConfirmed'
  | 'EpisodeObserved'
  | 'CrossSourceConfirmed'
  | 'SecondarySource'
  | 'FanCompiled'
  | 'Unverified'
  | 'GameAdaptation';

export const SOURCE_CONFIDENCES: readonly SourceConfidence[] = [
  'OfficialConfirmed',
  'EpisodeObserved',
  'CrossSourceConfirmed',
  'SecondarySource',
  'FanCompiled',
  'Unverified',
  'GameAdaptation',
];
