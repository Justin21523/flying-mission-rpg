import { getAudioManager } from './AudioManager';

// Batch 12.1 — one delegated listener that gives EVERY button a click + hover sound without editing each
// component. Capture-phase so it fires before handlers; opt-out via [data-no-sound]. The AudioManager's
// same-cue debounce collapses this with any explicit playUiSound on the same interaction.

function soundableButton(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const btn = target.closest('button, [role="button"]');
  if (!btn) return false;
  if (btn.closest('[data-no-sound]')) return false;
  if (btn instanceof HTMLButtonElement && btn.disabled) return false;
  return true;
}

export function installUiSoundDelegate(): () => void {
  if (typeof document === 'undefined') return () => {};
  let lastHover = 0;
  const onClick = (e: MouseEvent): void => {
    if (soundableButton(e.target)) getAudioManager().play('ui.click');
  };
  const onOver = (e: Event): void => {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - lastHover < 60) return;
    if (soundableButton(e.target)) { lastHover = now; getAudioManager().play('ui.hover'); }
  };
  document.addEventListener('click', onClick, true);
  document.addEventListener('pointerover', onOver, true);
  return () => {
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('pointerover', onOver, true);
  };
}
