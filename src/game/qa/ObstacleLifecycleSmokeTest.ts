import type { QACheck } from './ReleaseCandidateChecklist';
import { makeSmokeCheck } from './SmokeTestRunner';
import { liveObstacles, useObstacleStore } from '../../stores/game/obstacleStore';
import { cleanup, debugClear, loadForSegment } from '../obstacles/ObstacleDirector';

export function runObstacleLifecycleSmokeTest(): QACheck[] {
  cleanup();
  loadForSegment('seg_cargo_street');
  const obstacle = liveObstacles[0];
  if (obstacle) debugClear(obstacle.id);
  const cleared = !!obstacle && ['destroyed', 'repaired', 'cleared'].includes(obstacle.state);
  cleanup();
  const noResidual = liveObstacles.length === 0 && useObstacleStore.getState().version >= 0;
  return [
    makeSmokeCheck('obstacle_loads', 'Obstacle loads for segment', 'obstacle', !!obstacle, 'No obstacle loaded for Stage 1 segment.'),
    makeSmokeCheck('obstacle_debug_clear', 'Obstacle can be cleared', 'obstacle', cleared, 'Obstacle debug clear did not reach cleared state.'),
    makeSmokeCheck('obstacle_cleanup', 'Obstacle cleanup removes live obstacles', 'obstacle', noResidual, 'Obstacle cleanup left live obstacles.'),
  ];
}
