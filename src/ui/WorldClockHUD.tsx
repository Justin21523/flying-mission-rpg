import { useWorldClockStore, formatClock } from '../stores/worldClockStore';
import { useAudioStore } from '../stores/audioStore';
import type { TimeOfDay } from '../types/randomEvent';
import type { Weather } from '../stores/worldClockStore';
import { usePlayerStore } from '../stores/playerStore';
import { getKitArea } from '../data/areas';
import { usePoll } from './usePoll';
import { useT } from '../i18n/useT';

const TIME_ICON: Record<TimeOfDay, string> = { dawn: '🌅', day: '☀️', evening: '🌆', night: '🌙' };
const WEATHER_ICON: Record<Weather, string> = { clear: '☀️', rain: '🌧️', fog: '🌫️', storm: '⛈️' };

// Kit — top-right HUD: current area + clock + time-of-day + weather + the FX toggle state.
// timeMinutes ticks every frame, so we poll the clock ~4×/s via getState rather than subscribing to
// it (a 60 Hz React re-render here janks the editor panels). timeOfDay/weather change rarely → keep reactive.
export const WorldClockHUD = () => {
  usePoll(250);
  const t = useT();
  const { timeMinutes, timeOfDay, weather } = useWorldClockStore.getState();
  const particlesEnabled = useAudioStore((s) => s.particlesEnabled);
  const areaId = usePlayerStore((s) => s.currentAreaId);
  const areaName = getKitArea(areaId)?.name ?? areaId;

  return (
    <div className="pointer-events-none absolute right-4 top-4 z-10 flex flex-col items-end gap-1">
      <div className="flex items-center gap-3 rounded-lg border border-slate-500/70 bg-slate-900/80 px-3 py-1.5 text-sm font-semibold text-white shadow-xl backdrop-blur-md">
        <span className="text-cyan-200">📍 {areaName}</span>
        <span className="text-slate-500">·</span>
        <span className="flex items-center gap-1 tabular-nums">{TIME_ICON[timeOfDay]} {formatClock(timeMinutes)}</span>
        <span className="text-slate-500">·</span>
        <span>{t('tod_' + timeOfDay)}</span>
        <span className="text-slate-500">·</span>
        <span className="flex items-center gap-1">{WEATHER_ICON[weather]} {t('wx_' + weather)}</span>
      </div>
      <div className="rounded-md border border-slate-500/60 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-100 shadow-xl backdrop-blur-md">
        {particlesEnabled ? `✨ ${t('fxOn')}` : `◦ ${t('fxOff')}`}
      </div>
    </div>
  );
};
