import { usePortfolioRecordingStore } from '../../stores/usePortfolioRecordingStore';

export const RecordingSafeFrameOverlay = () => {
  const show = usePortfolioRecordingStore((state) => state.enabled && state.showSafeFrame);
  if (!show) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[40]">
      <div className="absolute inset-[5%] rounded-lg border border-white/18" />
      <div className="absolute left-1/2 top-[5%] -translate-x-1/2 rounded-b bg-black/35 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/60">recording safe frame</div>
    </div>
  );
};
