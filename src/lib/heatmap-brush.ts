import { CAM_CELLS, CAM_GRID } from "@/lib/inference/attention";

/** A round brush on the 14x14 heatmap grid. Size is a diameter in cells; strength and hardness are 0-1. */
export type Brush = { size: number; strength: number; hardness: number; erase: boolean };
/** A position on the grid in cell units: (0, 0) is the top-left corner, (14, 14) the bottom-right. */
export type GridPoint = { x: number; y: number };

export const BRUSH_SIZE = { min: 1, max: 8 } as const;
export const DEFAULT_BRUSH: Brush = { size: 2, strength: 1, hardness: 0.5, erase: false };
export const emptyMask = () => Array<number>(CAM_CELLS).fill(0);

/** The brush's effect on a cell at distance `d` (cells) from the dab: full inside the hard core, fading to 0 at the edge. */
function falloff(d: number, brush: Brush) {
  const radius = brush.size / 2;
  const core = radius * brush.hardness;
  // The edge itself is outside, so a cell that only touches the brush's rim stays untouched.
  if (d >= radius) return 0;
  if (d <= core) return 1;
  return (radius - d) / (radius - core);
}

/**
 * One dab: raises each cell of the stroke mask to at least the dab's effect there. Distance is measured to the
 * nearest point of the cell, so even a size-1 brush always covers the cell under the pointer.
 */
export function dab(mask: readonly number[], point: GridPoint, brush: Brush): number[] {
  const next = [...mask];
  const reach = Math.ceil(brush.size / 2) + 1;
  const col = Math.floor(point.x), row = Math.floor(point.y);
  for (let y = Math.max(0, row - reach); y <= Math.min(CAM_GRID - 1, row + reach); y++) {
    for (let x = Math.max(0, col - reach); x <= Math.min(CAM_GRID - 1, col + reach); x++) {
      const dx = Math.max(x - point.x, 0, point.x - (x + 1));
      const dy = Math.max(y - point.y, 0, point.y - (y + 1));
      const effect = brush.strength * falloff(Math.hypot(dx, dy), brush);
      const cell = y * CAM_GRID + x;
      if (effect > next[cell]) next[cell] = effect;
    }
  }
  return next;
}

/** Dabs along the segment from `from` to `to` closely enough that a fast drag leaves no gaps. */
export function strokeTo(mask: readonly number[], from: GridPoint, to: GridPoint, brush: Brush): number[] {
  const step = Math.max(brush.size / 4, 0.25);
  const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / step));
  let next = [...mask];
  for (let i = 1; i <= steps; i++) {
    next = dab(next, { x: from.x + ((to.x - from.x) * i) / steps, y: from.y + ((to.y - from.y) * i) / steps }, brush);
  }
  return next;
}

/**
 * Applies one stroke to the values it started from, like Photoshop's brush opacity: a single stroke never goes past
 * its strength, and a new stroke over the same area builds on it. Specks below 0.01 are dropped so they don't count
 * as a marked finding.
 */
export function applyStroke(start: readonly number[], mask: readonly number[], erase: boolean): number[] {
  return start.map((value, cell) => {
    const next = erase ? value * (1 - mask[cell]) : value + (1 - value) * mask[cell];
    const rounded = Math.round(next * 1000) / 1000;
    return rounded < 0.01 ? 0 : Math.min(1, rounded);
  });
}
