"use client";

import { Eraser, Paintbrush, PaintBucket, Redo2, Undo2 } from "lucide-react";
import { STROKE_COLOR_SWATCHES } from "@/modules/room/constants/canvas.constant";
import type { CanvasTool } from "@/modules/room/types/canvas-tool.type";
import { cn } from "@/lib/utils";

interface CanvasToolbarProps {
  color: string;
  onColorChange: (color: string) => void;
  width: number;
  onWidthChange: (width: number) => void;
  tool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
}

function toolButtonClass(active: boolean) {
  return cn(
    "flex size-9 items-center justify-center rounded-xl border-2 border-play-ink transition-transform",
    active ? "translate-x-0.5 bg-play-blue text-white shadow-[2px_2px_0_var(--color-play-ink)]" : "bg-white text-play-ink",
  );
}

function actionButtonClass(disabled: boolean) {
  return cn(
    "flex size-9 items-center justify-center rounded-xl border-2 border-play-ink bg-white text-play-ink shadow-[2px_2px_0_var(--color-play-ink)] transition-opacity",
    disabled && "cursor-not-allowed opacity-40",
  );
}

/** A vertical strip beside the canvas (not a bar on top of it) — stretches to the canvas's full height via the flex row in CanvasBoard, so tools/colors sit up top and undo/redo/clear settle at the bottom via `justify-between`. */
export function CanvasToolbar({
  color,
  onColorChange,
  width,
  onWidthChange,
  tool,
  onToolChange,
  onClear,
  onUndo,
  onRedo,
  canUndo,
}: CanvasToolbarProps) {
  return (
    <div className="flex w-14 shrink-0 flex-col items-center justify-between gap-3 rounded-2xl border-[3px] border-play-ink bg-white p-2 font-play-body shadow-[4px_4px_0_var(--color-play-ink)]">
      <div className="flex flex-col items-center gap-3">
        <div className="flex flex-col items-center gap-1.5">
          <button type="button" aria-label="Pen tool" aria-pressed={tool === "pen"} onClick={() => onToolChange("pen")} className={toolButtonClass(tool === "pen")}>
            <Paintbrush className="size-4" />
          </button>
          <button type="button" aria-label="Fill tool" aria-pressed={tool === "fill"} onClick={() => onToolChange("fill")} className={toolButtonClass(tool === "fill")}>
            <PaintBucket className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {STROKE_COLOR_SWATCHES.map((swatch) => (
            <button
              key={swatch}
              type="button"
              aria-label={`Color ${swatch}`}
              onClick={() => onColorChange(swatch)}
              className="size-5 rounded-full border-2 border-play-ink transition-transform"
              style={{
                backgroundColor: swatch,
                transform: color === swatch ? "scale(1.25)" : undefined,
                boxShadow: color === swatch ? "1.5px 1.5px 0 var(--color-play-ink)" : undefined,
              }}
            />
          ))}
        </div>

        {tool === "pen" && (
          <div className="flex h-16 w-9 items-center justify-center">
            <input
              type="range"
              min={2}
              max={16}
              value={width}
              onChange={(e) => onWidthChange(Number(e.target.value))}
              className="w-14 -rotate-90 accent-play-orange"
              aria-label="Brush size"
            />
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <button type="button" aria-label="Undo" onClick={onUndo} disabled={!canUndo} className={actionButtonClass(!canUndo)}>
          <Undo2 className="size-4" />
        </button>
        <button type="button" aria-label="Redo" onClick={onRedo} className={actionButtonClass(false)}>
          <Redo2 className="size-4" />
        </button>
        <button type="button" aria-label="Clear canvas" onClick={onClear} className={actionButtonClass(false)}>
          <Eraser className="size-4" />
        </button>
      </div>
    </div>
  );
}
