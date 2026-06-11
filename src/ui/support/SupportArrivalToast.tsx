import { useSupportRuntimeStore } from '../../stores/game/supportRuntimeStore';

export const SupportArrivalToast = () => {
  const toasts = useSupportRuntimeStore((s) => s.toasts);
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-[70] flex flex-col items-center gap-2">
      {toasts.map((toast) => (
        <div key={toast.id} className="rounded-full border border-emerald-600/50 bg-emerald-950/90 px-4 py-2 text-sm font-bold text-emerald-100 shadow-xl backdrop-blur">
          {toast.text}
        </div>
      ))}
    </div>
  );
};
