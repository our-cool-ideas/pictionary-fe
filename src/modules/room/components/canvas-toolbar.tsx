"use client";

import { Eraser, Paintbrush, PaintBucket, Redo2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STROKE_COLOR_SWATCHES } from "@/modules/room/constants/canvas.constant";
import type { CanvasTool } from "@/modules/room/types/canvas-tool.type";

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
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-2">
      <div className="flex items-center gap-1 rounded-md border p-0.5">
        <Button
          type="button"
          variant={tool === "pen" ? "secondary" : "ghost"}
          size="icon"
          aria-label="Pen tool"
          aria-pressed={tool === "pen"}
          onClick={() => onToolChange("pen")}
        >
          <Paintbrush className="size-4" />
        </Button>
        <Button
          type="button"
          variant={tool === "fill" ? "secondary" : "ghost"}
          size="icon"
          aria-label="Fill tool"
          aria-pressed={tool === "fill"}
          onClick={() => onToolChange("fill")}
        >
          <PaintBucket className="size-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1.5">
        {STROKE_COLOR_SWATCHES.map((swatch) => (
          <button
            key={swatch}
            type="button"
            aria-label={`Color ${swatch}`}
            onClick={() => onColorChange(swatch)}
            className="size-6 rounded-full border transition-transform"
            style={{
              backgroundColor: swatch,
              borderColor: swatch === "#ffffff" ? "var(--border)" : swatch,
              transform: color === swatch ? "scale(1.2)" : undefined,
              outline: color === swatch ? "2px solid var(--ring)" : undefined,
              outlineOffset: 2,
            }}
          />
        ))}
      </div>

      {tool === "pen" && (
        <input
          type="range"
          min={2}
          max={16}
          value={width}
          onChange={(e) => onWidthChange(Number(e.target.value))}
          className="w-24"
          aria-label="Brush size"
        />
      )}

      <div className="ml-auto flex items-center gap-1.5">
        <Button type="button" variant="outline" size="sm" onClick={onUndo} disabled={!canUndo}>
          <Undo2 className="size-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onRedo}>
          <Redo2 className="size-4" />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onClear}>
          <Eraser className="size-4" />
          Clear
        </Button>
      </div>
    </div>
  );
}
