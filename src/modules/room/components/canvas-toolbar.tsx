"use client";

import { Check, Circle, Eraser, PaintBucket, Pencil, Redo2, Slash, Square, Trash2, Undo2 } from "lucide-react";
import { STROKE_COLOR_SWATCHES, STROKE_WIDTH_PRESETS } from "@/modules/room/constants/canvas.constant";
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

// Every pickable control — tools, colors, brush-size presets — is this
// same size, scaled with the viewport (`vh`) between a floor and a
// ceiling, rather than a single fixed size. A 36px button is comfortable
// on a tall, roomy canvas, but on a short one (still the same 36px, since
// a fixed size doesn't know any better) it reads as oversized relative to
// everything else on screen. This isn't load-bearing for overflow the
// way it once was, though — the strip scrolls internally regardless (see
// `overflow-y-auto` below) — it's purely so the controls' size actually
// tracks the screen instead of looking randomly too big or too small on
// any given one.
const CONTROL_SIZE = "w-[clamp(1.5rem,3.2vh,2.25rem)] h-[clamp(1.5rem,3.2vh,2.25rem)]";
const ICON_SIZE = "w-[clamp(0.8rem,1.6vh,1rem)] h-[clamp(0.8rem,1.6vh,1rem)]";

// The offset "sticker" shadow every other button/card in this app has —
// applied unconditionally here (not just on the active state) so every
// control looks consistent, tool buttons and color swatches alike,
// selected or not, rather than some having it and some not.
const CONTROL_SHADOW = "shadow-[2px_2px_0_var(--color-play-ink)]";

// Selected state is a plain color swap — same border width, same
// position, nothing scales or shifts. An earlier version nudged the
// active button sideways (`translate-x-0.5`) to fake a "pressed" look,
// but next to its neighbors in a tight 2-column grid that read as
// crooked/misaligned rather than pressed — a button that's visibly out
// of line with the row it's sitting in. A solid fill is unambiguous
// without moving anything, and the shadow is the same either way, so it
// doesn't reintroduce that asymmetry.
function toolButtonClass(active: boolean) {
  return cn(
    `flex ${CONTROL_SIZE} items-center justify-center rounded-xl border-2 transition-colors ${CONTROL_SHADOW}`,
    active ? "border-play-blue bg-play-blue text-white" : "border-play-ink bg-white text-play-ink",
  );
}

function actionButtonClass(disabled: boolean) {
  return cn(
    `flex ${CONTROL_SIZE} items-center justify-center rounded-xl border-2 border-play-ink bg-white text-play-ink transition-opacity ${CONTROL_SHADOW}`,
    disabled && "cursor-not-allowed opacity-40",
  );
}

/** The tiny uppercase caption above each section — same treatment as the
 * "PLAYERS (n)" label above the roster, just a size down since this
 * toolbar is much narrower. */
function SectionLabel({ children }: { children: string }) {
  return <p className="px-0.5 font-play-display text-[9px] font-bold tracking-wide text-play-ink/45 uppercase">{children}</p>;
}

/** A thin rule between sections — the "some lines" grouping the tools,
 * size, color, and action buttons into distinct blocks instead of one
 * undifferentiated grid. */
function SectionDivider() {
  return <div className="h-px w-full bg-play-ink/15" />;
}

// Icons picked for what they actually look like, not just what's roughly
// on-theme — a plain dash (`Minus`) read as "subtract," not "draw a
// straight line," so that's a diagonal `Slash` now instead. `Pencil`
// reads as "draw" more immediately than a paintbrush glyph does at these
// sizes. Square/circle outline vs filled still share one icon each,
// toggling `fill` — a solid vs hollow shape is its own universally
// understood pair, the same convention a star/heart "favorited" toggle
// uses, so it doesn't need a second distinct glyph. The eraser TOOL gets
// the `Eraser` glyph — it's exactly what it looks like now, since
// "clear canvas" (down in Actions) moved to `Trash2` instead, freeing
// this icon up rather than the two competing for the same one.
export const TOOL_BUTTONS: { tool: CanvasTool; label: string; icon: typeof Pencil; filled?: boolean }[] = [
  { tool: "pen", label: "Pen tool", icon: Pencil },
  { tool: "eraser", label: "Eraser tool", icon: Eraser },
  { tool: "fill", label: "Fill tool", icon: PaintBucket },
  { tool: "line", label: "Line tool", icon: Slash },
  { tool: "square", label: "Square tool", icon: Square },
  { tool: "square-filled", label: "Filled square tool", icon: Square, filled: true },
  { tool: "circle", label: "Circle tool", icon: Circle },
  { tool: "circle-filled", label: "Filled circle tool", icon: Circle, filled: true },
];

// The size-preview dot inside each brush-size button is a percentage of
// that button's own box (not a fixed px), so it scales the same way the
// buttons themselves do.
const MAX_WIDTH_PREVIEW_PERCENT = 55;
const MAX_STROKE_WIDTH_PRESET = Math.max(...STROKE_WIDTH_PRESETS);

/**
 * The drawer's tool picker — now a scrollable strip along the canvas's
 * right edge (see CanvasBoard), not a permanent sibling column beside
 * the players list. That's what freed the players column up to always
 * be the same width whether or not it's your turn to draw (see
 * GameBoard). `h-full` + `overflow-y-auto` below is what makes this a
 * strip rather than a floating card: CanvasBoard gives it a real,
 * bounded height (the canvas's own, edge to edge), and this scrolls
 * internally within that instead of ever being able to run past it — a
 * guarantee a fixed-height container gives for free, unlike trying to
 * shrink content to guess at how much room is actually left. Edge to
 * edge means flush against the canvas's own top/right/bottom, on
 * purpose (`rounded-r-2xl`, no independent shadow) — this reads as part
 * of the canvas's own frame, not a card floating over it, with only a
 * left border marking where the drawing area ends and the strip begins.
 *
 * Section order is Tools / Actions / Color / Size, on purpose — Actions
 * (undo/redo/clear) sits right under Tools, ahead of Color and Size,
 * since it's reached for about as often as the tools themselves; Size
 * is the one you'd change least, so it's last.
 */
// A themed scrollbar for the strip, instead of the browser's bare
// default — a small rounded thumb with the same ink border + offset
// shadow every other control here has, on a soft track, so scrolling
// this doesn't look like it belongs to a different, unstyled app.
// WebKit (Chrome/Safari/Edge) gets the full treatment via the
// `::-webkit-scrollbar*` pseudo-elements; Firefox only exposes a much
// simpler `scrollbar-color`/`scrollbar-width` pair (no shadow, no
// border), so it gets a plain thin blue-on-cream fallback instead.
const THEMED_SCROLLBAR = cn(
  "[&::-webkit-scrollbar]:w-2.5",
  "[&::-webkit-scrollbar-track]:my-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-play-cream",
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border [&::-webkit-scrollbar-thumb]:border-play-ink [&::-webkit-scrollbar-thumb]:bg-play-blue [&::-webkit-scrollbar-thumb]:shadow-[1px_1px_0_var(--color-play-ink)]",
  "[scrollbar-width:thin] [scrollbar-color:var(--color-play-blue)_var(--color-play-cream)]",
);

export function CanvasToolbar({ color, onColorChange, tool, onToolChange, width, onWidthChange, onClear, onUndo, onRedo, canUndo }: CanvasToolbarProps) {
  return (
    <div className={cn("flex h-full w-fit flex-col gap-2.5 overflow-y-auto rounded-r-2xl border-[3px] border-play-ink bg-white p-2.5 font-play-body", THEMED_SCROLLBAR)}>
      <div className="flex flex-col gap-1.5">
        <SectionLabel>Tools</SectionLabel>
        <div className="grid grid-cols-2 gap-1.5">
          {TOOL_BUTTONS.map(({ tool: t, label, icon: Icon, filled }) => (
            <button key={t} type="button" aria-label={label} aria-pressed={tool === t} onClick={() => onToolChange(t)} className={toolButtonClass(tool === t)}>
              <Icon className={ICON_SIZE} fill={filled ? "currentColor" : "none"} />
            </button>
          ))}
        </div>
      </div>

      <SectionDivider />

      <div className="flex flex-col gap-1.5">
        <SectionLabel>Actions</SectionLabel>
        <div className="grid grid-cols-2 gap-1.5">
          <button type="button" aria-label="Undo" onClick={onUndo} disabled={!canUndo} className={actionButtonClass(!canUndo)}>
            <Undo2 className={ICON_SIZE} />
          </button>
          <button type="button" aria-label="Redo" onClick={onRedo} className={actionButtonClass(false)}>
            <Redo2 className={ICON_SIZE} />
          </button>
          <button type="button" aria-label="Clear canvas" onClick={onClear} className={cn(actionButtonClass(false), "col-span-2")}>
            <Trash2 className={ICON_SIZE} />
          </button>
        </div>
      </div>

      <SectionDivider />

      {/* Selected swatch gets a blue ring (same language as the tool
          buttons' active border) plus a checkmark — a color swap alone
          isn't always visible against the swatch's own color the way it
          is on a white tool button, so this doesn't rely on the ring by
          itself. Border width never changes (always border-2), so the
          swatch never shifts size/position either. */}
      <div className="flex flex-col gap-1.5">
        <SectionLabel>Color</SectionLabel>
        <div className="grid grid-cols-2 gap-1.5">
          {STROKE_COLOR_SWATCHES.map((swatch) => (
            <button
              key={swatch}
              type="button"
              aria-label={`Color ${swatch}`}
              aria-pressed={color === swatch}
              onClick={() => onColorChange(swatch)}
              className={cn(
                `relative flex ${CONTROL_SIZE} items-center justify-center rounded-full border-2 transition-colors ${CONTROL_SHADOW}`,
                color === swatch ? "border-play-blue" : "border-play-ink",
              )}
              style={{ backgroundColor: swatch }}
            >
              {color === swatch && <Check className={cn(ICON_SIZE, "text-white drop-shadow-[0_0_1.5px_rgba(0,0,0,0.9)]")} />}
            </button>
          ))}
        </div>
      </div>

      <SectionDivider />

      {/* Brush size — discrete presets as same-shape buttons (each showing
          a scaled dot), not a slider, so this control matches the tool
          grid's layout instead of introducing a differently-shaped
          widget. */}
      <div className="flex flex-col gap-1.5">
        <SectionLabel>Size</SectionLabel>
        <div className="grid grid-cols-2 gap-1.5">
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
    </div>
  );
}
