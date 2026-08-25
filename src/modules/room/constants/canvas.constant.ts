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

export const STROKE_COLOR_SWATCHES = ["#171717", "#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#f97316", "#ffffff"];
