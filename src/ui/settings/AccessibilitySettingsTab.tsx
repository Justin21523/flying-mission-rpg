import { useAudioStore } from '../../stores/audioStore';
import { Toggle, Slider } from './settingsShared';

// Batch 12 — Accessibility settings. Reduce-motion is honoured across flight (speed lines / shake) and
// transformation (camera shake / white-flash dimming) — never a no-op. Larger UI text + high contrast reuse
// the existing accessibility fields.
export const AccessibilitySettingsTab = () => {
  const s = useAudioStore();
  return (
    <div className="space-y-1 text-xs">
      <Toggle label="Reduce motion (also dims flashing)" checked={s.reduceMotion} onChange={() => s.toggleReduceMotion()} />
      <Toggle label="Reduce loud effects" checked={s.reduceLoud} onChange={() => s.toggleReduceLoud()} />
      <Toggle label="High-contrast UI" checked={s.highContrast} onChange={() => s.toggleHighContrast()} />
      <Slider label="UI text size" value={s.textScale} min={0.85} max={1.5} step={0.05} onChange={s.setTextScale} />
      <div className="pt-1 text-[10px] text-slate-500">Reduce motion disables speed lines, camera shake & strong flashes in flight and transformation.</div>
    </div>
  );
};
