import type { Difficulty } from '../../types/game/settings';

// Wave 5 — pure campaign score: kills + bosses build the base, time is a (capped) penalty, then a difficulty
// multiplier. Tunable constants. Used on campaign completion to record a leaderboard run.
const KILL_POINTS = 50;
const BOSS_POINTS = 500;
const BASE = 2000;
const TIME_PENALTY_PER_SEC = 2; // points lost per second
const MAX_TIME_PENALTY = 1500; // never wipe the whole base
const DIFFICULTY_MULT: Record<Difficulty, number> = { easy: 0.5, normal: 1, hard: 1.5, 'ng-plus': 2 };

export interface CampaignScoreInput {
  elapsedSeconds: number;
  kills: number;
  bossesDefeated: number;
  difficulty: Difficulty;
}

export function computeCampaignScore(i: CampaignScoreInput): number {
  const base = BASE + i.kills * KILL_POINTS + i.bossesDefeated * BOSS_POINTS;
  const timePenalty = Math.min(MAX_TIME_PENALTY, Math.max(0, i.elapsedSeconds) * TIME_PENALTY_PER_SEC);
  const raw = Math.max(0, base - timePenalty);
  return Math.floor(raw * (DIFFICULTY_MULT[i.difficulty] ?? 1));
}

export interface CampaignRunRecord {
  score: number;
  difficulty: Difficulty;
  elapsedSeconds: number;
  kills: number;
  completedAtIso: string;
}
