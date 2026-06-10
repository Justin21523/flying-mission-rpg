import type { TransformationDefinition } from '../../types/game/transformation';

// Seed — one transformation per roster character (id matches CharacterDefinition.transformationId).
// particleColor follows each character's colour. `steps` is a timeline shell; Batch 6 builds the full
// real-time vehicle⇄robot director on top. English display text.
const standardSteps = (prefix: string): TransformationDefinition['steps'] => [
  { id: `${prefix}_parts`, label: 'parts-unfold', atSec: 0.5 },
  { id: `${prefix}_limbs`, label: 'limbs-extend', atSec: 2.0 },
  { id: `${prefix}_pose`, label: 'finish-pose', atSec: 3.5 },
];

export const SEED_TRANSFORMATIONS: TransformationDefinition[] = [
  { id: 'xf_jett', name: 'Jett Transform', characterId: 'char_jett', durationSec: 4, backdropColor: '#1a0a08', particleColor: '#e8442c', steps: standardSteps('st_jett') },
  { id: 'xf_donnie', name: 'Donnie Transform', characterId: 'char_donnie', durationSec: 4, backdropColor: '#1a1405', particleColor: '#f5b21e', steps: standardSteps('st_donnie') },
  { id: 'xf_paul', name: 'Paul Transform', characterId: 'char_paul', durationSec: 4, backdropColor: '#0a1020', particleColor: '#2b4c8c', steps: standardSteps('st_paul') },
  { id: 'xf_jerome', name: 'Jerome Transform', characterId: 'char_jerome', durationSec: 4, backdropColor: '#0a1428', particleColor: '#2f6fd6', steps: standardSteps('st_jerome') },
  { id: 'xf_bello', name: 'Bello Transform', characterId: 'char_bello', durationSec: 4, backdropColor: '#15100a', particleColor: '#8a6240', steps: standardSteps('st_bello') },
  { id: 'xf_chase', name: 'Chase Transform', characterId: 'char_chase', durationSec: 4, backdropColor: '#0b1020', particleColor: '#3b4a78', steps: standardSteps('st_chase') },
  { id: 'xf_flip', name: 'Flip Transform', characterId: 'char_flip', durationSec: 4, backdropColor: '#1a0a08', particleColor: '#e23b2e', steps: standardSteps('st_flip') },
  { id: 'xf_todd', name: 'Todd Transform', characterId: 'char_todd', durationSec: 4.5, backdropColor: '#15100a', particleColor: '#b5793a', steps: standardSteps('st_todd') },
];
