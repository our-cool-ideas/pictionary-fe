"use client";

import {
  Circle,
  Eraser,
  Minus,
  Paintbrush,
  PaintBucket,
  Redo2,
  Square,
  Undo2,
} from "lucide-react";
import {
  STROKE_COLOR_SWATCHES,
  STROKE_WIDTH_PRESETS,
} from "@/modules/room/constants/canvas.constant";
import type { CanvasTool } from "@/modules/room/types/canvas-tool.type";
import { cn } from "@/lib/utils";

interface CanvasToolbarProps {
  color: string;
  onColorChange: (color: string) => void;
  tool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
  width: number;
  onWidthChange: (width: number) => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
}

// A fixed 12-"row" split of the toolbar's total height, same idea as
// GameBoard's 12-column page layout: Tools 3 + Size 2 + Color 4 +
// Actions 3 = 12. Each section is a `flex-[N]` share of the toolbar's
// full height (which itself already equals the players card's height —
// see the root below and GameBoard, unchanged from before). This ratio
// is fixed and NOT derived from how many icons happen to be in a
// section — that's the point: the icons are sized to fit whatever
// share their section got (see buildGridClass below), not the other
// way around, so nothing can ever overflow regardless of resolution.
const SECTION_FLEX = {
  tools: "flex-[3]",
  size: "flex-[2]",
  color: "flex-[4]",
  actions: "flex-[3]",
};

// Every button in a section is exactly `w-full h-full` of its own grid
// cell — never a fixed px/rem/clamp size. The grid divides the section's
// box into (2 columns) x (rows) where rows = ceil(count / 2): count the
// icons, round up to an even number, lay them out 2-per-row, and split
// the section's actual height evenly across that many rows. Since every
// size here is a plain fraction of a box that itself came from a plain
// fraction of the toolbar's real height, there is no scenario at any
// resolution where content can be larger than its container — it always
// fits exactly, no clamping/measuring/container-query tricks required.
function rowsFor(count: number) {
  return Math.ceil(count / 2);
}

// Tailwind's grid-rows-<n> utilities cover 1–6 by default, which is all
// four sections ever need (max is Color's 6 rows for 12 swatches).
const GRID_ROWS_CLASS: Record<number, string> = {
  1: "grid-rows-1",
  2: "grid-rows-2",
  3: "grid-rows-3",
  4: "grid-rows-4",
  5: "grid-rows-5",
  6: "grid-rows-6",
};

function gridClass(count: number) {
  return cn(
    "grid min-h-0 w-full flex-1 grid-cols-2 gap-1",
    GRID_ROWS_CLASS[rowsFor(count)],
  );
}

function toolButtonClass(active: boolean) {
  return cn(
    "flex h-full w-full items-center justify-center rounded-xl border-2 border-play-ink transition-transform",
    active
      ? "translate-x-0.5 bg-play-blue text-white shadow-[2px_2px_0_var(--color-play-ink)]"
      : "bg-white text-play-ink",
  );
}

function actionButtonClass(disabled: boolean) {
  return cn(
    "flex h-full w-full items-center justify-center rounded-xl border-2 border-play-ink bg-white text-play-ink shadow-[2px_2px_0_var(--color-play-ink)] transition-opacity",
    disabled && "cursor-not-allowed opacity-40",
  );
}

/** The tiny uppercase caption above each section — same treatment as the
 * "PLAYERS (n)" label above the roster, just a size down since this
 * toolbar is much narrower. Fixed height (`shrink-0`), so it doesn't eat
 * into the grid's own flex-1 share of the section. */
function SectionLabel({ children }: { children: string }) {
  return (
    <p className="shrink-0 px-0.5 font-play-display text-[9px] font-bold tracking-wide text-play-ink/45 uppercase">
      {children}
    </p>
  );
}

/** A thin rule between sections — the "some lines" grouping the tools,
 * size, color, and action buttons into distinct blocks instead of one
 * undifferentiated grid. */
function SectionDivider() {
  return <div className="h-px w-full shrink-0 bg-play-ink/15" />;
}

const TOOL_BUTTONS: {
  tool: CanvasTool;
  label: string;
  icon: typeof Paintbrush;
  filled?: boolean;
}[] = [
  { tool: "pen", label: "Pen tool", icon: Paintbrush },
  { tool: "fill", label: "Fill tool", icon: PaintBucket },
  { tool: "line", label: "Line tool", icon: Minus },
  { tool: "square", label: "Square tool", icon: Square },
  {
    tool: "square-filled",
    label: "Filled square tool",
    icon: Square,
    filled: true,
  },
  { tool: "circle", label: "Circle tool", icon: Circle },
  {
    tool: "circle-filled",
    label: "Filled circle tool",
    icon: Circle,
    filled: true,
  },
];

// 3 actions (undo/redo/clear) — odd, so it rounds up to a 2x2 grid same
// as everything else, with the last cell simply empty.
const ACTION_COUNT = 3;

// The size-preview dot inside each brush-size button is a percentage of
// that button's own box (not a fixed px), so it scales the same way the
// buttons themselves do.
const MAX_WIDTH_PREVIEW_PERCENT = 55;
const MAX_STROKE_WIDTH_PRESET = Math.max(...STROKE_WIDTH_PRESETS);

/**
 * A vertical strip immediately beside the canvas — matching gartic.io's
 * composition, where the toolbar sits right next to the drawing surface
 * it controls, not detached elsewhere in the page. Tools: pen, bucket
 * fill, straight line, and outline/filled square/circle — gartic.io's own
 * set plus a line tool, drawn in our own gamified sticker style rather
 * than copying its icons directly.
 *
 * Full height, matching the players card beside it (plain flex stretch —
 * see GameBoard, unchanged) — that column layout was already right and
 * isn't touched here. What lives entirely in this file is how that
 * height gets split up: a fixed 12-unit ratio across four labeled,
 * divider-separated sections (see SECTION_FLEX), and inside each
 * section, a grid sized purely in fractions of that section's own box
 * (see gridClass/rowsFor) — never a fixed or clamped pixel size. That's
 * what guarantees every icon always fits, at any resolution, without
 * ever overlapping or spilling past its section.
 */
export function CanvasToolbar({
  color,
  onColorChange,
  tool,
  onToolChange,
  width,
  onWidthChange,
  onClear,
  onUndo,
  onRedo,
  canUndo,
}: CanvasToolbarProps) {
  return (
    <div className="flex h-full  flex-col items-stretch gap-1 rounded-2xl border-[3px] border-play-ink bg-white p-2 font-play-body shadow-[4px_4px_0_var(--color-play-ink)]">
      <div className={cn("flex min-h-0 flex-col gap-1", SECTION_FLEX.tools)}>
        <SectionLabel>Tools</SectionLabel>
        <div className={gridClass(TOOL_BUTTONS.length)}>
          {TOOL_BUTTONS.map(({ tool: t, label, icon: Icon, filled }) => (
            <button
              key={t}
              type="button"
              aria-label={label}
              aria-pressed={tool === t}
              onClick={() => onToolChange(t)}
              className={toolButtonClass(tool === t)}
            >
              <Icon
                className="size-1/2"
                fill={filled ? "currentColor" : "none"}
              />
            </button>
          ))}
        </div>
      </div>

      <SectionDivider />

      <div className={cn("flex min-h-0 flex-col gap-1", SECTION_FLEX.size)}>
        <SectionLabel>Size</SectionLabel>
        <div className={gridClass(STROKE_WIDTH_PRESETS.length)}>
          {STROKE_WIDTH_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-label={`Brush size ${preset}`}
              aria-pressed={width === preset}
              onClick={() => onWidthChange(preset)}
              className={toolButtonClass(width === preset)}
            >
              <span
                className="rounded-full bg-current"
                style={{
                  width: `${(preset / MAX_STROKE_WIDTH_PRESET) * MAX_WIDTH_PREVIEW_PERCENT}%`,
                  height: `${(preset / MAX_STROKE_WIDTH_PRESET) * MAX_WIDTH_PREVIEW_PERCENT}%`,
                }}
              />
            </button>
          ))}
        </div>
      </div>

      <SectionDivider />

      <div className={cn("flex min-h-0 flex-col gap-1", SECTION_FLEX.color)}>
        <SectionLabel>Color</SectionLabel>
        <div className={gridClass(STROKE_COLOR_SWATCHES.length)}>
          {STROKE_COLOR_SWATCHES.map((swatch) => (
            <button
              key={swatch}
              type="button"
              aria-label={`Color ${swatch}`}
              aria-pressed={color === swatch}
              onClick={() => onColorChange(swatch)}
              className={cn(
                "h-full w-full rounded-full border-2 border-play-ink transition-transform",
                color === swatch &&
                  "scale-90 shadow-[2px_2px_0_var(--color-play-ink)]",
              )}
              style={{ backgroundColor: swatch }}
            />
          ))}
        </div>
      </div>

      <SectionDivider />

      <div className={cn("flex min-h-0 flex-col gap-1", SECTION_FLEX.actions)}>
        <SectionLabel>Actions</SectionLabel>
        <div className={gridClass(ACTION_COUNT)}>
          <button
            type="button"
            aria-label="Undo"
            onClick={onUndo}
            disabled={!canUndo}
            className={actionButtonClass(!canUndo)}
          >
            <Undo2 className="size-1/2" />
          </button>
          <button
            type="button"
            aria-label="Redo"
            onClick={onRedo}
            className={actionButtonClass(false)}
          >
            <Redo2 className="size-1/2" />
          </button>
          <button
            type="button"
            aria-label="Clear canvas"
            onClick={onClear}
            className={actionButtonClass(false)}
          >
            <Eraser className="size-1/2" />
          </button>
        </div>
      </div>
    </div>
  );
}
