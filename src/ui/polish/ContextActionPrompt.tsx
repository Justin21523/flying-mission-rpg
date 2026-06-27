import { useStageProgressionStore } from '../../stores/game/useStageProgressionStore';
import { liveObstacles } from '../../stores/game/obstacleStore';
import { getObstacleDef } from '../../stores/game/editorObstacleStore';

export const ContextActionPrompt = () => {
  const status = useStageProgressionStore((state) => state.status);
  const activeSegmentId = useStageProgressionStore((state) => state.activeSegmentId);
  if (status !== 'playing') return null;
  const obstacle = liveObstacles.find((item) => item.segmentId === activeSegmentId && item.state !== 'destroyed' && item.state !== 'repaired' && item.state !== 'cleared');
  const obstacleType = obstacle ? getObstacleDef(obstacle.defId)?.obstacleType : undefined;
  const text = obstacleType === 'corrupted-device'
    ? 'Press F to Repair Device'
    : obstacleType === 'cracked-wall'
      ? 'Press F or use Heavy Break to clear wall'
      : obstacleType === 'energy-barrier'
        ? 'Use Shield Break or support to clear barrier'
        : 'Follow marker and press F near objectives';
  return (
    <div className="pointer-events-none fixed bottom-14 left-1/2 z-[54] -translate-x-1/2 rounded-full border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm font-bold text-slate-100 shadow-lg backdrop-blur">
      {text}
    </div>
  );
};
