import type PhaserNS from 'phaser';
import type { PhaserMissionEvent } from './phaserBridge';

// The repair-wiring mini-game (first embedded Phaser scene). PURE Phaser — no React, no zustand: results
// leave ONLY through the injected onResult callback (bound to the bridge by the overlay). Click a left
// terminal, then the matching-colour right terminal; wrong pairs flash and reset; all three connected →
// success. A Cancel button emits cancelled.
const COLORS = [0xef4444, 0xfacc15, 0x3b82f6];
const COLOR_NAMES = ['red', 'yellow', 'blue'];

export function createRepairWiringScene(
  Phaser: typeof PhaserNS,
  miniGameId: string,
  onResult: (evt: Exclude<PhaserMissionEvent, { type: 'mini-game-started' }>) => void,
): PhaserNS.Scene {
  class RepairWiringScene extends Phaser.Scene {
    private selectedLeft: number | null = null;
    private solved: boolean[] = [false, false, false];
    private rightOrder: number[] = [];
    private wires!: PhaserNS.GameObjects.Graphics;
    private status!: PhaserNS.GameObjects.Text;
    private leftDots: PhaserNS.GameObjects.Arc[] = [];

    constructor() {
      super('repair-wiring');
    }

    create(): void {
      const W = this.scale.width;
      const H = this.scale.height;
      this.cameras.main.setBackgroundColor('#0b1220');
      this.add.text(W / 2, 36, 'REPAIR THE WIRING', { fontSize: '24px', color: '#e2e8f0', fontStyle: 'bold' }).setOrigin(0.5);
      this.add.text(W / 2, 64, 'Connect each wire to the terminal of the SAME colour', { fontSize: '13px', color: '#94a3b8' }).setOrigin(0.5);
      this.status = this.add.text(W / 2, H - 88, '', { fontSize: '14px', color: '#fbbf24' }).setOrigin(0.5);
      this.wires = this.add.graphics();

      // shuffled right side
      this.rightOrder = [0, 1, 2].sort(() => Math.random() - 0.5);
      const ys = [H * 0.32, H * 0.5, H * 0.68];
      const lx = W * 0.25;
      const rx = W * 0.75;

      for (let i = 0; i < 3; i++) {
        const dot = this.add.circle(lx, ys[i], 18, COLORS[i]).setStrokeStyle(3, 0xffffff, 0.5);
        dot.setInteractive({ useHandCursor: true });
        dot.on('pointerdown', () => this.pickLeft(i));
        this.leftDots.push(dot);
        const r = this.rightOrder[i];
        const rdot = this.add.circle(rx, ys[i], 18, COLORS[r]).setStrokeStyle(3, 0xffffff, 0.5);
        rdot.setInteractive({ useHandCursor: true });
        rdot.on('pointerdown', () => this.pickRight(r, rx, ys[i]));
      }

      // cancel button
      const cancel = this.add.text(W / 2, H - 44, '✕ Cancel (Esc)', { fontSize: '14px', color: '#fca5a5', backgroundColor: '#1e293b', padding: { x: 12, y: 6 } }).setOrigin(0.5);
      cancel.setInteractive({ useHandCursor: true });
      cancel.on('pointerdown', () => onResult({ type: 'mini-game-cancelled', miniGameId }));
      this.input.keyboard?.on('keydown-ESC', () => onResult({ type: 'mini-game-cancelled', miniGameId }));
    }

    private pickLeft(i: number): void {
      if (this.solved[i]) return;
      this.selectedLeft = i;
      this.status.setText(`Selected the ${COLOR_NAMES[i]} wire — now click its terminal.`);
      for (let k = 0; k < 3; k++) this.leftDots[k].setScale(k === i ? 1.25 : 1);
    }

    private pickRight(colorIdx: number, rx: number, ry: number): void {
      if (this.selectedLeft === null) {
        this.status.setText('Pick a wire on the LEFT first.');
        return;
      }
      const i = this.selectedLeft;
      if (colorIdx === i) {
        this.solved[i] = true;
        this.selectedLeft = null;
        this.leftDots[i].setScale(1).setAlpha(0.6);
        const ly = this.leftDots[i].y;
        const lx = this.leftDots[i].x;
        this.wires.lineStyle(5, COLORS[i], 1);
        this.wires.lineBetween(lx, ly, rx, ry);
        this.status.setText(`${COLOR_NAMES[i]} connected!`);
        if (this.solved.every(Boolean)) {
          this.status.setText('All wires connected — beacon online!');
          this.time.delayedCall(650, () => onResult({ type: 'mini-game-success', miniGameId, score: 100 }));
        }
      } else {
        this.status.setText('Wrong terminal — sparks! Try again.');
        this.cameras.main.shake(120, 0.01);
        this.selectedLeft = null;
        for (const d of this.leftDots) d.setScale(1);
      }
    }
  }
  return new RepairWiringScene();
}
