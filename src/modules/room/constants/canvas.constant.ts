// A fixed internal resolution, not one scaled per-viewport — every client
// agrees on the same coordinate space regardless of screen size, and the
// canvas is displayed at whatever CSS size fits (scaled via aspect-ratio).
// Pointer coordinates are remapped from CSS pixels to this internal
// resolution (see canvas-board.tsx), so a drawing still looks correct on a
// phone vs a desktop — this is what actually solves the "different screen
// sizes" problem, not just a fixed-size sidestep of it.
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 500;

export const STROKE_FLUSH_INTERVAL_MS = 60;
export const DEFAULT_STROKE_COLOR = "#171717";
export const DEFAULT_STROKE_WIDTH = 4;

export const STROKE_COLOR_SWATCHES = [
  "#171717",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#78350f",
];

/** Brush-size presets shown as buttons in the toolbar (thin, default,
 * thick, extra-thick) — not a continuous slider, so every option stays
 * the same size/shape as the rest of the toolbar's buttons instead of
 * introducing a differently-shaped control. */
export const STROKE_WIDTH_PRESETS = [2, 4, 8, 14];
