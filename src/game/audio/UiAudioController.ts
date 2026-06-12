import { getAudioManager } from './AudioManager';
import { onAudioEvent } from './AudioEventBus';
import type { UiSoundKind } from './uiSound';

// Batch 12 — translates UI intents into AudioManager cues. `uiSound.ts` calls playUiCue directly; this
// controller additionally listens on the AudioEventBus for game-level UI moments (mission complete,
// support arrived) so those systems stay decoupled from the audio layer.

const UI_CUE: Record<UiSoundKind, string> = {
  select: 'ui.select',
  confirm: 'ui.confirm',
  back: 'ui.back',
  hover: 'ui.hover',
  launch: 'ui.launch',
};

export function playUiCue(kind: UiSoundKind): void {
  getAudioManager().play(UI_CUE[kind] ?? 'ui.click');
}

/** Subscribe to game-level UI audio events. Returns an unsubscribe cleanup. */
export function installUiAudio(): () => void {
  return onAudioEvent((e) => {
    const mgr = getAudioManager();
    if (e.type === 'ui') mgr.play(`ui.${e.cue === 'click' ? 'select' : e.cue}`);
    else if (e.type === 'mission-complete') mgr.play('ui.missionComplete');
    else if (e.type === 'support-arrived') mgr.play('ui.supportArrived');
  });
}
