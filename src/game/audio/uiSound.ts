// UI sound seam. Real audio (Howler + asset files) is wired in Batch 12; this is the single interface
// every screen/button calls so that wiring is trivial later. No-op placeholder now — never throws.
export type UiSoundKind = 'select' | 'confirm' | 'back' | 'hover' | 'launch';

export function playUiSound(kind: UiSoundKind): void {
  void kind; // Batch 12 replaces this body with a Howler-backed player; call sites stay unchanged.
}
