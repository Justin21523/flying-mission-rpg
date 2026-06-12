import type { CharacterPoseModel } from '../../types/game/character';

// Post-content — the full super-wings GLB catalog per hero, ids taken EXACTLY from the files in
// public/models/super-wings/ (spaces and '+' preserved; double-spaces are real). Single source reused by the
// character seed (poseModels) and the hero set-pieces. Per the character-model-naming rule, every model whose
// filename starts with a hero's name belongs to that hero.
const SW = 'super-wings/';

export interface HeroModelSet {
  characterId: string;
  transformer: string;   // robot model
  airplane?: string;     // plane/vehicle model (where a dedicated one exists)
  poses: string[];       // pose/look variants (filenames as-is, sans the SW prefix)
  extras?: string[];     // landing / segments etc.
}

// poses/extras values are the raw filename (minus extension); the SW prefix is added by id().
export const SUPER_WINGS_MODELS: Record<string, HeroModelSet> = {
  char_jett: { characterId: 'char_jett', transformer: 'Jett+transformer+3d+model', poses: [] },
  char_jerome: {
    characterId: 'char_jerome', transformer: 'Jerome+transformer+3d+model',
    poses: ['Jerome pose 3d model', 'Jerome pose 02 3d model', 'Jerome+pose+03+3d+model', 'Jerome+pose+04+3d+model', 'Jerome pose 05 3d model', 'Jerome pose 06 3d model', 'Jerome pose 07 3d model', 'Jerome+pose+08+3d+model', 'Jerome+pose+09+3d+model', 'Jerome+pose+12+3d+model', 'Jerome+pose+13+3d+model'],
  },
  char_donnie: {
    characterId: 'char_donnie', transformer: 'Donnie+transformer+3d+model', airplane: 'Donnie airplane 3d model',
    poses: ['Donnie pose  3d model', 'Donnie pose 02 3d model', 'Donnie pose 03 3d model', 'Donnie pose 04 3d model', 'Donnie+poses+03+3d+model', 'Donnie+poses+04+3d+model'],
  },
  char_paul: {
    characterId: 'char_paul', transformer: 'paul+transformer+3d+model', airplane: 'Paul airplane 3d model',
    poses: ['Paul pose 3d model', 'Paul pose 02 3d model', 'Paul+pose+03+3d+model', 'Paul+pose+04+3d+model'],
  },
  char_bello: {
    characterId: 'char_bello', transformer: 'Bello+transformer+3d+model',
    poses: ['Bello+pose+3d+model', 'Bello+pose+02+3d+model', 'Bello+pose+03+3d+model', 'Bello+pose+04+3d+model', 'Bello+pose+05+3d+model', 'Bello+pose+06+3d+model', 'Bello+pose+07+3d+model'],
  },
  char_chase: {
    characterId: 'char_chase', transformer: 'Chase+transformer+3d+model',
    poses: ['Chase+pose+3d+model', 'Chase pose 3d model', 'Chase+pose+02+3d+model', 'Chase+pose+04+3d+model', 'Chase+pose+05+3d+model'],
  },
  char_flip: {
    characterId: 'char_flip', transformer: 'Flip+transformer+3d+model', airplane: 'Flip airplane 3d model',
    poses: ['Flip pose 3d model', 'Flip pose 02 3d model', 'Flip+pose+02+3d+model', 'Flip pose 03 3d model', 'Flip+pose+04+3d+model', 'Flip+poses+3d+model', 'Flip+poses+02+3d+model', 'Flip+poses+03+3d+model'],
    extras: ['Flip+landing+1+robot', 'Flip+segments+3d+model'],
  },
  char_todd: {
    characterId: 'char_todd', transformer: 'Todd+transformer+3d+model',
    poses: ['Todd+pose+3d+model', 'Todd+pose+02+3d+model', 'Todd+pose+03+3d+model', 'Todd+pose+04+3d+model', 'Todd+pose+05+3d+model', 'Todd+pose+06+3d+model', 'Todd+pose+07+3d+model'],
  },
};

export const id = (filename: string): string => SW + filename;

function tidy(filename: string): string {
  return filename.replace(/3d models?/i, '').replace(/[+_]/g, ' ').replace(/\s+/g, ' ').trim();
}
function slug(filename: string): string {
  return tidy(filename).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

/** Build the character's poseModels list (transformer → airplane → poses → extras), with unique ids. */
export function poseModelsFor(characterId: string): CharacterPoseModel[] {
  const set = SUPER_WINGS_MODELS[characterId];
  if (!set) return [];
  const entries: { filename: string; kind: string }[] = [
    { filename: set.transformer, kind: 'robot' },
    ...(set.airplane ? [{ filename: set.airplane, kind: 'plane' }] : []),
    ...set.poses.map((p) => ({ filename: p, kind: 'pose' })),
    ...(set.extras ?? []).map((e) => ({ filename: e, kind: 'extra' })),
  ];
  const seen = new Set<string>();
  return entries.map(({ filename, kind }) => {
    const baseId = slug(filename);
    let unique = baseId;
    let n = 2;
    while (seen.has(unique)) unique = `${baseId}_${n++}`;
    seen.add(unique);
    const label = kind === 'robot' ? `Robot (${tidy(filename)})` : kind === 'plane' ? `Plane (${tidy(filename)})` : tidy(filename);
    return { id: unique, label, assetId: id(filename) };
  });
}

/** A flat list of hero pose ids (for set-piece placement of "posing heroes"). */
export function heroPoseAssetIds(characterId: string): string[] {
  const set = SUPER_WINGS_MODELS[characterId];
  return set ? set.poses.map(id) : [];
}
