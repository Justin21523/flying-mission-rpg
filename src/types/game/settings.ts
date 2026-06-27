import type { TransformationMode } from './transformation';

export type FlightAssist = 'simple' | 'advanced';
export const FLIGHT_ASSISTS: readonly FlightAssist[] = ['simple', 'advanced'];

export type QualityLevel = 'low' | 'medium' | 'high';
export const QUALITY_LEVELS: readonly QualityLevel[] = ['low', 'medium', 'high'];

// Batch P — difficulty. 'easy' = invincible + auto-complete segments (dev/showcase); 'normal' = real combat;
// 'hard' = real combat + tougher enemy damage. Wave 4 — 'ng-plus' = New Game+ (unlocked after the campaign is
// cleared): tougher enemy HP + richer affixes + higher incoming damage. easy/normal/hard behaviour is unchanged.
export type Difficulty = 'easy' | 'normal' | 'hard' | 'ng-plus';
export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'normal', 'hard']; // base tiers (always selectable)
export const NG_PLUS: Difficulty = 'ng-plus';

// The single authored game-settings document (the "1份遊戲設定" seed). Editable + persisted.
export interface GameSettings {
  flightAssist: FlightAssist;
  transformMode: TransformationMode;
  masterVolume: number; // 0..1
  sfxVolume: number;
  musicVolume: number;
  quality: QualityLevel;
  reduceMotion: boolean;
  difficulty: Difficulty;
}
