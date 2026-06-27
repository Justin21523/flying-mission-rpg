import type { BossAttackPatternType } from './game/boss';

export type BossDemoPhaseHint = {
  phaseId: string;
  objective: string;
  counterplay: string[];
  recordingBeat: string;
};

export type BossDemoAttackHint = {
  patternType: BossAttackPatternType;
  label: string;
  counterplay: string;
};

export type BossDemoProfile = {
  id: string;
  bossId: string;
  stageId: string;
  title: string;
  recommendedCharacterIds: string[];
  recommendedSupportIds: string[];
  phaseOrder: string[];
  phaseHints: BossDemoPhaseHint[];
  attackHints: BossDemoAttackHint[];
  acceptanceText: string;
};
