import { CANVAS_HEIGHT, CANVAS_WIDTH } from './constants';

/** Fit logical canvas into screen with horizontal padding; preserves aspect ratio. Coordinates saved on server stay 300×200. */
export function getPlotCanvasLayout(screenWidth: number, horizontalPadding: number) {
  const maxW = Math.min(CANVAS_WIDTH, Math.max(180, screenWidth - horizontalPadding));
  const scale = maxW / CANVAS_WIDTH;
  const displayW = CANVAS_WIDTH * scale;
  const displayH = CANVAS_HEIGHT * scale;
  /** Multiply flat touch deltas from the displayed canvas by this to map into logical 300×200 space. */
  const touchToLogical = CANVAS_WIDTH / displayW;
  return { displayW, displayH, scale, touchToLogical };
}
