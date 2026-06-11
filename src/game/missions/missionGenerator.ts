import type {
  MissionDefinition, MissionObjective, MissionReward, MissionTemplate, MissionType, MissionObjectiveRecipe,
} from '../../types/game/mission';
import type { FlightDifficulty, WeatherKind } from '../../types/game/flight';
import type { DestinationPart } from '../../types/game/destination';
import { mulberry32, type Rng } from '../game/rng';
import { validateMission } from './missionValidation';
import type { MissionPools } from './missionPools';

// Pure, deterministic rule-based mission generator. Same seed + same pools → identical missions. Builds each
// mission best-effort from a template + the live pools, then gates it through validateMission; anything that
// can't be made playable (e.g. the destination lacks the needed parts) is reported in `rejected` with a reason.
export interface GenerateInput {
  seed: string | number;
  count: number;
  types?: MissionType[]; // restrict to these mission types (default: all)
}
export interface GenerateResult {
  missions: MissionDefinition[];
  rejected: { reason: string }[];
}

const DIFFICULTY_COIN_MULT: Record<FlightDifficulty, number> = { easy: 1, normal: 1.3, hard: 1.7, expert: 2.2 };

const fill = (pattern: string, place: string): string => pattern.replace(/\{place\}/g, place);

function weightedKeys<K extends string>(rng: Rng, weights: Partial<Record<K, number>>, fallback: K): K {
  const entries = Object.entries(weights) as [K, number][];
  if (entries.length === 0) return fallback;
  return rng.weighted(entries.map((e) => e[0]), entries.map((e) => e[1]));
}

// Pick up to `count` DISTINCT parts of a pool (deterministic shuffle), clamping to what's available.
function bindParts(rng: Rng, parts: DestinationPart[] | undefined, count: number): DestinationPart[] {
  if (!parts || parts.length === 0) return [];
  return rng.shuffle(parts).slice(0, Math.min(count, parts.length));
}

function buildObjective(rng: Rng, recipe: MissionObjectiveRecipe, idx: number, pools: MissionPools): MissionObjective {
  const id = `obj_${idx}`;
  const want = rng.range(recipe.countRange[0], recipe.countRange[1]);
  const bound = recipe.partKind ? bindParts(rng, pools.partsByKind[recipe.partKind], want) : [];
  const targetObjectIds = bound.map((p) => p.id);
  const count = recipe.partKind ? Math.max(1, targetObjectIds.length) : want;
  const labels = bound.map((p) => p.label).join(', ');

  const description = recipe.kind === 'carry' ? `Carry ${labels || 'the parcel'} to the dropoff`
    : recipe.kind === 'find' ? `Find ${labels || 'the lost item'}`
    : recipe.kind === 'activate' ? `Repair ${labels || 'the device'} (mini-game)`
    : recipe.kind === 'reach' ? `Reach ${labels || 'the marker'}`
    : recipe.kind === 'talk' ? 'Talk to the resident'
    : 'Clear the area';

  const obj: MissionObjective = { id, kind: recipe.kind, description, targetCount: count, optional: recipe.optional };
  if (targetObjectIds.length) obj.targetObjectIds = targetObjectIds;
  if (recipe.needsDropoff) {
    const drop = bindParts(rng, pools.partsByKind.dropoff_zone, 1)[0];
    if (drop) obj.dropoffZoneId = drop.id;
  }
  if (recipe.needsMiniGame) obj.miniGameId = pools.miniGameIds[0];
  return obj;
}

function buildMission(rng: Rng, template: MissionTemplate, pools: MissionPools, id: string): MissionDefinition {
  const location = rng.pick(pools.locations);
  const place = location?.name ?? 'the field';
  const route = pools.routes.filter((r) => r.toLocationId === location?.id);
  const routeId = (route.length ? rng.pick(route) : pools.routes[0])?.id;
  const npc = pools.npcs.length ? rng.pick(pools.npcs) : undefined;
  const difficulty = weightedKeys<FlightDifficulty>(rng, template.difficultyWeights, 'normal');
  const weather = weightedKeys<WeatherKind>(rng, template.weatherWeights, 'clear');

  const suited = pools.characters.filter((c) => c.missionSuitability.includes(template.type));
  const charPool = suited.length ? suited : pools.characters;
  const recommendedCharacterIds = rng.shuffle(charPool).slice(0, Math.min(2, charPool.length)).map((c) => c.id);

  const objectives = template.objectives.map((recipe, i) => buildObjective(rng, recipe, i, pools));

  const coins = Math.round(template.coinsBase * DIFFICULTY_COIN_MULT[difficulty] * (0.85 + rng.next() * 0.3));
  const rewards: MissionReward[] = [{ id: 'rw_coins', type: 'coins', amount: coins }];
  if (template.extraReward) {
    rewards.push({ id: 'rw_extra', type: template.extraReward.type, amount: template.extraReward.amount, characterId: template.extraReward.type === 'trust' ? npc?.id : undefined, targetId: template.extraReward.targetId });
  }

  return {
    id,
    name: fill(rng.pick(template.namePatterns), place),
    sourceConfidence: 'GameAdaptation',
    type: template.type,
    locationId: location?.id ?? '',
    npcId: npc?.id,
    routeId,
    difficulty,
    weather,
    recommendedCharacterIds,
    summary: fill(rng.pick(template.summaryPatterns), place),
    objectives,
    rewards,
  };
}

export function generateMissions(input: GenerateInput, templates: MissionTemplate[], pools: MissionPools): GenerateResult {
  const rng = mulberry32(input.seed);
  const pool = input.types?.length ? templates.filter((t) => input.types!.includes(t.type)) : templates;
  const missions: MissionDefinition[] = [];
  const rejected: { reason: string }[] = [];

  if (pool.length === 0 || pools.locations.length === 0) {
    return { missions, rejected: [{ reason: pool.length === 0 ? 'no templates for the selected types' : 'no destination locations available' }] };
  }

  for (let i = 0; i < Math.max(0, input.count); i += 1) {
    const template = rng.weighted(pool, pool.map((t) => t.weight));
    const id = `gen_${String(input.seed)}_${i}`;
    const mission = buildMission(rng, template, pools, id);
    const errs = validateMission(mission, pools);
    if (errs.length === 0) missions.push(mission);
    else rejected.push({ reason: `${mission.name}: ${errs[0]}` });
  }

  return { missions, rejected };
}
