import type { QACheck } from './ReleaseCandidateChecklist';
import { makeSmokeCheck } from './SmokeTestRunner';
import { getBoss } from '../../stores/game/useBossEditorStore';
import { startBoss, defeatBoss } from '../bosses/BossDirector';
import { useBossStore } from '../../stores/game/useBossStore';
import { useCombatTargetStore } from '../../stores/game/combatTargetStore';

export function runBossLifecycleSmokeTest(): QACheck[] {
  useCombatTargetStore.getState().reset();
  const bossId = 'harbor_core_sentinel';
  const boss = getBoss(bossId);
  if (boss) startBoss(boss.id);
  const active = useBossStore.getState().runtime?.status === 'active';
  if (active) defeatBoss();
  const defeated = useBossStore.getState().runtime?.status === 'defeated';
  useCombatTargetStore.getState().reset();
  return [
    makeSmokeCheck('boss_definition_exists', 'Boss definition exists', 'boss', !!boss, `${bossId} is missing.`),
    makeSmokeCheck('boss_starts', 'Boss can start', 'boss', active, 'Boss did not enter active runtime.'),
    makeSmokeCheck('boss_defeats', 'Boss can be defeated', 'boss', defeated, 'Boss did not enter defeated runtime.'),
  ];
}
