import { MODEL_ASSET_LIST } from '../modelLibrary';
import type { ModelAsset } from '../modelLibrary';
import type { CharacterPoseModel } from '../../types/game/character';

const SW = 'super-wings/';

export const SUPER_WINGS_CHARACTER_NAMES = ['jett', 'jerome', 'donnie', 'paul', 'bello', 'chase', 'flip', 'todd'] as const;
export type HeroCharacterName = (typeof SUPER_WINGS_CHARACTER_NAMES)[number];

export type HeroPoseKind = 'robot' | 'plane' | 'pose' | 'extra';
export type HeroIntakeStatus = 'assigned' | 'hidden' | 'unassigned';

export interface HeroModelSet {
  characterId: string;
  name: string;
  robotAssetId?: string;
  planeAssetId?: string;
  poseAssetIds: string[];
  extraAssetIds: string[];
  allAssetIds: string[];
}

export interface HeroModelOverride {
  robotAssetId?: string;
  planeAssetId?: string;
  hiddenAssetIds?: readonly string[];
}

export type HeroModelOverrides = Record<string, HeroModelOverride>;
export type HeroAssetInput = Pick<ModelAsset, 'id' | 'label'>;

export interface HeroModelIntakeRow {
  assetId: string;
  label: string;
  status: HeroIntakeStatus;
  kind: HeroPoseKind;
  characterId?: string;
  characterName?: string;
  isPrimaryRobot: boolean;
  isPrimaryPlane: boolean;
  isHidden: boolean;
  isInPoseModels: boolean;
}

export const SUPER_WINGS_MODEL_OVERRIDES: HeroModelOverrides = {
  char_jett: { robotAssetId: 'super-wings/Jett+transformer+3d+model' },
  char_jerome: { robotAssetId: 'super-wings/Jerome+transformer+3d+model' },
  char_donnie: {
    robotAssetId: 'super-wings/Donnie+transformer+3d+model',
    planeAssetId: 'super-wings/Donnie airplane 3d model',
  },
  char_paul: {
    robotAssetId: 'super-wings/Paul+transformer+3d+model',
    planeAssetId: 'super-wings/Paul airplane 3d model',
  },
  char_bello: { robotAssetId: 'super-wings/Bello+transformer+3d+model' },
  char_chase: { robotAssetId: 'super-wings/Chase+transformer+3d+model' },
  char_flip: {
    robotAssetId: 'super-wings/Flip+transformer+3d+model',
    planeAssetId: 'super-wings/Flip airplane 3d model',
  },
  char_todd: { robotAssetId: 'super-wings/Todd+transformer+3d+model' },
};

function displayName(name: string): string {
  return name ? `${name[0]?.toUpperCase() ?? ''}${name.slice(1).toLowerCase()}` : '';
}

function characterIdForName(name: string): string {
  return `char_${name.toLowerCase()}`;
}

function characterNameFromId(characterId: string): string {
  return characterId.replace(/^char_/, '').toLowerCase();
}

function filenameFromAssetId(assetId: string): string {
  return assetId.startsWith(SW) ? assetId.slice(SW.length) : assetId;
}

export const id = (filename: string): string => (filename.startsWith(SW) ? filename : `${SW}${filename}`);

function tidyAssetId(assetId: string): string {
  return filenameFromAssetId(assetId).replace(/3d models?/i, '').replace(/[+_]/g, ' ').replace(/\s+/g, ' ').trim();
}

function slug(assetId: string): string {
  return tidyAssetId(assetId).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function startsWithCharacterName(assetId: string, name: string): boolean {
  return filenameFromAssetId(assetId).toLowerCase().startsWith(name.toLowerCase());
}

export function classifyHeroAsset(assetId: string): HeroPoseKind {
  const file = filenameFromAssetId(assetId).toLowerCase();
  if (file.includes('transformer')) return 'robot';
  if (file.includes('airplane') || file.includes('plane')) return 'plane';
  if (file.includes('landing') || file.includes('segment')) return 'extra';
  return 'pose';
}

function orderWeight(assetId: string, pinnedRobot?: string, pinnedPlane?: string): number {
  if (assetId === pinnedRobot) return 0;
  if (assetId === pinnedPlane) return 1;
  const kind = classifyHeroAsset(assetId);
  if (kind === 'robot') return 2;
  if (kind === 'plane') return 3;
  if (kind === 'pose') return 4;
  return 5;
}

function uniqueSortedAssetIds(assetIds: string[], pinnedRobot?: string, pinnedPlane?: string): string[] {
  return [...new Set(assetIds)].sort((a, b) => {
    const aw = orderWeight(a, pinnedRobot, pinnedPlane);
    const bw = orderWeight(b, pinnedRobot, pinnedPlane);
    return aw === bw ? tidyAssetId(a).localeCompare(tidyAssetId(b)) : aw - bw;
  });
}

function firstExistingPin(pin: string | undefined, assets: Set<string>): string | undefined {
  return pin && assets.has(pin) ? pin : undefined;
}

function firstOfKind(assetIds: readonly string[], kind: HeroPoseKind): string | undefined {
  return assetIds.find((assetId) => classifyHeroAsset(assetId) === kind);
}

function toPoseModels(assetIds: readonly string[]): CharacterPoseModel[] {
  const seen = new Set<string>();
  return assetIds.map((assetId) => {
    const kind = classifyHeroAsset(assetId);
    const baseId = slug(assetId);
    let unique = baseId;
    let n = 2;
    while (seen.has(unique)) {
      unique = `${baseId}_${n}`;
      n += 1;
    }
    seen.add(unique);
    const name = tidyAssetId(assetId);
    const label = kind === 'robot' ? `Robot (${name})` : kind === 'plane' ? `Plane (${name})` : name;
    return { id: unique, label, assetId };
  });
}

export function deriveHeroModelCatalog(
  assets: readonly HeroAssetInput[],
  overrides: HeroModelOverrides = SUPER_WINGS_MODEL_OVERRIDES,
  characterNames: readonly string[] = SUPER_WINGS_CHARACTER_NAMES,
): Record<string, HeroModelSet> {
  const heroAssetIds = assets.map((asset) => asset.id).filter((assetId) => assetId.startsWith(SW));
  const assetIdSet = new Set(heroAssetIds);
  const catalog: Record<string, HeroModelSet> = {};

  for (const rawName of characterNames) {
    const name = rawName.toLowerCase();
    const characterId = characterIdForName(name);
    const override = overrides[characterId];
    const hidden = new Set(override?.hiddenAssetIds ?? []);
    const visibleIds = heroAssetIds.filter((assetId) => startsWithCharacterName(assetId, name) && !hidden.has(assetId));
    if (visibleIds.length === 0) continue;

    const robotPin = firstExistingPin(override?.robotAssetId, assetIdSet);
    const planePin = firstExistingPin(override?.planeAssetId, assetIdSet);
    const allAssetIds = uniqueSortedAssetIds(visibleIds, robotPin, planePin);
    const robotAssetId = robotPin ?? firstOfKind(allAssetIds, 'robot');
    const planeAssetId = planePin ?? firstOfKind(allAssetIds, 'plane');
    const poseAssetIds = allAssetIds.filter((assetId) => assetId !== robotAssetId && assetId !== planeAssetId && classifyHeroAsset(assetId) === 'pose');
    const extraAssetIds = allAssetIds.filter((assetId) => assetId !== robotAssetId && assetId !== planeAssetId && classifyHeroAsset(assetId) === 'extra');

    catalog[characterId] = {
      characterId,
      name: displayName(name),
      robotAssetId,
      planeAssetId,
      poseAssetIds,
      extraAssetIds,
      allAssetIds,
    };
  }

  return catalog;
}

function characterMatchForAsset(assetId: string, characterNames: readonly string[]): { characterId: string; name: string } | undefined {
  const name = characterNames.find((candidate) => startsWithCharacterName(assetId, candidate));
  if (!name) return undefined;
  return { characterId: characterIdForName(name), name: displayName(name) };
}

export function buildHeroModelIntakeRows(
  assets: readonly HeroAssetInput[],
  overrides: HeroModelOverrides = SUPER_WINGS_MODEL_OVERRIDES,
  characterNames: readonly string[] = SUPER_WINGS_CHARACTER_NAMES,
): HeroModelIntakeRow[] {
  const catalog = deriveHeroModelCatalog(assets, overrides, characterNames);
  return assets
    .filter((asset) => asset.id.startsWith(SW))
    .map((asset) => {
      const match = characterMatchForAsset(asset.id, characterNames);
      const set = match ? catalog[match.characterId] : undefined;
      const hidden = match ? (overrides[match.characterId]?.hiddenAssetIds ?? []).includes(asset.id) : false;
      const status: HeroIntakeStatus = hidden ? 'hidden' : match && set ? 'assigned' : 'unassigned';
      return {
        assetId: asset.id,
        label: asset.label,
        status,
        kind: classifyHeroAsset(asset.id),
        characterId: match?.characterId,
        characterName: match?.name,
        isPrimaryRobot: set?.robotAssetId === asset.id,
        isPrimaryPlane: set?.planeAssetId === asset.id,
        isHidden: hidden,
        isInPoseModels: !!set?.allAssetIds.includes(asset.id),
      };
    })
    .sort((a, b) => {
      const ac = a.characterName ?? 'zz';
      const bc = b.characterName ?? 'zz';
      if (ac !== bc) return ac.localeCompare(bc);
      if (a.status !== b.status) return a.status.localeCompare(b.status);
      return a.label.localeCompare(b.label);
    });
}

function deriveSingleCharacterSet(characterId: string): HeroModelSet | undefined {
  const name = characterNameFromId(characterId);
  return deriveHeroModelCatalog(MODEL_ASSET_LIST, SUPER_WINGS_MODEL_OVERRIDES, [name])[characterId];
}

export const SUPER_WINGS_MODELS: Record<string, HeroModelSet> = deriveHeroModelCatalog(MODEL_ASSET_LIST);

function modelSetFor(characterId: string): HeroModelSet | undefined {
  return SUPER_WINGS_MODELS[characterId] ?? deriveSingleCharacterSet(characterId);
}

export function poseModelsFor(characterId: string): CharacterPoseModel[] {
  return toPoseModels(modelSetFor(characterId)?.allAssetIds ?? []);
}

export function primaryRobotModelAssetIdFor(characterId: string): string | undefined {
  return modelSetFor(characterId)?.robotAssetId;
}

export function primaryPlaneModelAssetIdFor(characterId: string): string | undefined {
  return modelSetFor(characterId)?.planeAssetId;
}

export function allHeroPoseAssetIds(): string[] {
  return [...new Set(Object.values(SUPER_WINGS_MODELS).flatMap((set) => set.allAssetIds))];
}

/** A flat list of hero pose ids (for set-piece placement of "posing heroes"). */
export function heroPoseAssetIds(characterId: string): string[] {
  return modelSetFor(characterId)?.poseAssetIds ?? [];
}
