import { MODEL_ASSETS } from '../modelLibrary';

// Real-model catalog for VFX (Batch F.6b). The 491 GLBs under public/models/ are the visual vocabulary for
// per-character effects. Filenames mix '+' and spaces (e.g. `Jett+airplane+3d+model` vs `Donnie airplane 3d
// model`), so we NEVER hardcode the separator form — we resolve ids dynamically from MODEL_ASSETS by
// normalized substring match. Uses [[character-model-naming]]: a model whose name starts with a hero's name
// belongs to that hero.

const norm = (s: string) => s.replace(/\+/g, ' ').toLowerCase();
const KEYS = Object.keys(MODEL_ASSETS);
const NORM_KEYS: { id: string; n: string }[] = KEYS.map((id) => ({ id, n: norm(id) }));

// First model id whose normalized key contains ALL given substrings (also normalized). undefined if none.
export function pickModel(...subs: string[]): string | undefined {
  const needles = subs.map(norm);
  const hit = NORM_KEYS.find(({ n }) => needles.every((q) => n.includes(q)));
  return hit?.id;
}

// All model ids whose normalized key contains ALL given substrings (sorted for determinism).
export function pickModels(...subs: string[]): string[] {
  const needles = subs.map(norm);
  return NORM_KEYS.filter(({ n }) => needles.every((q) => n.includes(q))).map(({ id }) => id).sort();
}

export interface HeroModelSet {
  airplane?: string;
  pose?: string;
  transformer?: string;
  poses: string[]; // every pose model (base + numbered variants) — used as a swarm of "the hero" clones
  all: string[];
}

// Resolve a hero's own model set from the super-wings/ folder by name prefix.
export function heroModels(name: string): HeroModelSet {
  const all = pickModels(`super-wings/${name}`);
  const poses = all.filter((id) => norm(id).includes('pose'));
  // base pose = the shortest pose id (numbered variants are longer, e.g. "... pose 02 ...").
  const basePose = [...poses].sort((a, b) => a.length - b.length)[0];
  return {
    airplane: all.find((id) => norm(id).includes('airplane')),
    pose: basePose,
    transformer: all.find((id) => norm(id).includes('transformer')),
    poses,
    all,
  };
}

// Per-character hero sets (resolved once).
export const HERO_MODELS = {
  char_jett: heroModels('Jett'),
  char_jerome: heroModels('Jerome'),
  char_paul: heroModels('Paul'),
  char_donnie: heroModels('Donnie'),
  char_todd: heroModels('Todd'),
  char_flip: heroModels('Flip'),
  char_bello: heroModels('Bello'),
  char_chase: heroModels('Chase'),
} as const;

export function getHeroModels(characterId: string): HeroModelSet | undefined {
  return (HERO_MODELS as Record<string, HeroModelSet>)[characterId];
}

// True if a model id belongs to this hero's own super-wings/ set.
export function isOwnHeroModel(characterId: string, modelId: string | undefined): boolean {
  if (!modelId) return false;
  return getHeroModels(characterId)?.all.includes(modelId) ?? false;
}

// Curated themed prop ids per character's visual language (all resolved from real GLBs).
export const THEME_MODELS = {
  jett: {
    rescueAircraft: pickModel('tiltrotor rescue aircraft'),
    radar: pickModel('radar dish'),
  },
  jerome: {
    ringStack: pickModel('colorful ring stack'),
    sigil: pickModel('flaming sigil'),
    lantern: pickModel('japanese lantern'),
  },
  paul: {
    trafficBarrier: pickModel('traffic barrier'),
    trafficCone: pickModel('traffic cone'),
    signalLight: pickModel('red-green light') ?? pickModel('pedestrian signal light'),
    roadBarrier: pickModel('road barrier'),
    stopSign: pickModel('stop sign'),
    policeBox: pickModel('koban police box'),
  },
  donnie: {
    constructionBarrier: pickModel('construction barrier'),
    shelving: pickModel('colorful shelving unit'),
    toolbox: pickModel('stylized toolbox'),
    tireRack: pickModel('tire rack'),
    cementBucket: pickModel('cement bucket'),
    forklift: pickModel('cartoon forklift'),
    crane: pickModel('crane toy'),
    bulldozer: pickModel('bulldozer toy'),
    toyBlocks: pickModel('construction toy blocks'),
    crate: pickModel('wooden crate'),
  },
  todd: {
    mineCart: pickModel('underground mine cart'),
    boulder: pickModel('rock boulder'),
    desertRocks: pickModel('stylized desert rocks'),
    mountainRocks: pickModel('stylized mountain rocks'),
    rockfall: pickModel('rockfall obstacle'),
  },
  flip: {
    ringStack: pickModel('colorful ring stack'),
    torus: pickModel('inflatable torus'),
    soccerBoy: pickModel('advanced', 'soccer', 'boy') ?? pickModel('soccer', 'boy'),
    runner: pickModel('super', 'fast', 'runner'),
  },
  bello: {
    lions: [pickModel('red', 'fire', 'lion'), pickModel('hip', 'hop', 'orange', 'lion'), pickModel('hip', 'hop', 'white', 'lion'), pickModel('yello', 'god', 'lion'), pickModel('red', 'lion', 'captain')].filter(Boolean) as string[],
    cats: [pickModel('brave', 'cat', 'warrior'), pickModel('armored', 'ancient', 'cat'), pickModel('stylized', 'cat', 'warrior')].filter(Boolean) as string[],
    owl: pickModel('scholarly owl'),
    snake: pickModel('giant', 'water', 'snake'),
  },
  chase: {
    drones: [pickModel('Carey drone'), pickModel('Droney drone')].filter(Boolean) as string[],
    radar: pickModel('radar dish'),
    detective: pickModel('purple', 'detective', 'bear'),
    totem: pickModel('golden', 'discovery', 'totem'),
  },
} as const;
