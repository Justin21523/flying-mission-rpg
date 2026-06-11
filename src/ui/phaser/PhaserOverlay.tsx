import { useEffect, useRef } from 'react';
import { usePhaserOverlayStore, phaserBridge } from '../../game/phaser/phaserBridge';
import { createRepairWiringScene } from '../../game/phaser/RepairWiringScene';
import type PhaserNS from 'phaser';

// React overlay hosting the Phaser canvas. Phaser is LAZY-loaded (dynamic import) the first time a
// mini-game opens; the Phaser.Game instance is destroyed on close/unmount, so repeated open/close never
// leaks instances. The 3D scene stays mounted behind the dimmed overlay (its inputs naturally stop because
// the overlay captures the pointer and the director ignores input while a mini-game is open).
export const PhaserOverlay = () => {
  const openId = usePhaserOverlayStore((s) => s.openId);
  const host = useRef<HTMLDivElement>(null);
  const game = useRef<PhaserNS.Game | null>(null);

  useEffect(() => {
    if (!openId || !host.current) return;
    let cancelled = false;
    const el = host.current;

    void import('phaser').then((mod) => {
      if (cancelled || !el) return;
      const Phaser = mod.default;
      const scene = createRepairWiringScene(Phaser, openId, (evt) => phaserBridge.emitResult(evt));
      game.current = new Phaser.Game({
        type: Phaser.CANVAS,
        parent: el,
        width: 640,
        height: 480,
        backgroundColor: '#0b1220',
        scene,
      });
    });

    return () => {
      cancelled = true;
      game.current?.destroy(true);
      game.current = null;
    };
  }, [openId]);

  if (!openId) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
      <div className="rounded-2xl border border-sky-700/50 bg-slate-950 p-3 shadow-2xl">
        <div ref={host} style={{ width: 640, height: 480 }} />
      </div>
    </div>
  );
};
