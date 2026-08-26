"use client";

import { useEffect, useRef, useState } from "react";
import { useRoomSession } from "@/modules/room/context/use-room-session";
import { CanvasToolbar } from "@/modules/room/components/canvas-toolbar";
import { TurnProgressBar } from "@/modules/room/components/turn-progress-bar";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  STROKE_FLUSH_INTERVAL_MS,
  DEFAULT_STROKE_COLOR,
  DEFAULT_STROKE_WIDTH,
} from "@/modules/room/constants/canvas.constant";
import type { CanvasTool } from "@/modules/room/types/canvas-tool.type";
import type { DrawAction, StrokePoint } from "@/modules/room/types/game.type";

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Extract<DrawAction, { kind: "stroke" }>): void {
  if (stroke.points.length < 2) return;
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  const [first, ...rest] = stroke.points;
  if (!first) return;
  ctx.moveTo(first.x, first.y);
  for (const point of rest) ctx.lineTo(point.x, point.y);
  ctx.stroke();
}

function hexToRgba(hex: string): [number, number, number, number] {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean.length === 3 ? clean.replace(/./g, (c) => c + c) : clean, 16);
  if (Number.isNaN(value)) return [0, 0, 0, 255];
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255, 255];
}

function colorsMatch(a: Uint8ClampedArray | number[], ai: number, b: readonly number[]): boolean {
  return a[ai] === b[0] && a[ai + 1] === b[1] && a[ai + 2] === b[2] && a[ai + 3] === b[3];
}

/**
 * Classic stack-based 4-directional flood fill, run against whatever's
 * already painted on the canvas at this point in the replay — not
 * precomputed server-side, since only the *order* of actions is shared,
 * not their rendered pixels. Re-run on every redraw this turn (see the
 * effect below), so a turn with a fill plus lots of later strokes redoes
 * the fill's pixel scan every time — fine at this canvas size (800×500)
 * for an occasional click, not optimized further since strokes/fills are
 * naturally bounded by a 60s turn.
 */
function floodFill(ctx: CanvasRenderingContext2D, fill: Extract<DrawAction, { kind: "fill" }>): void {
  const { width, height } = ctx.canvas;
  const startX = Math.floor(fill.x);
  const startY = Math.floor(fill.y);
  if (startX < 0 || startY < 0 || startX >= width || startY >= height) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const startIdx = (startY * width + startX) * 4;
  const target = [data[startIdx] ?? 0, data[startIdx + 1] ?? 0, data[startIdx + 2] ?? 0, data[startIdx + 3] ?? 0] as const;
  const replacement = hexToRgba(fill.color);
  if (colorsMatch(replacement, 0, target)) return;

  const stack: number[] = [startX, startY];
  while (stack.length > 0) {
    const y = stack.pop() as number;
    const x = stack.pop() as number;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    const idx = (y * width + x) * 4;
    if (!colorsMatch(data, idx, target)) continue;
    data[idx] = replacement[0];
    data[idx + 1] = replacement[1];
    data[idx + 2] = replacement[2];
    data[idx + 3] = replacement[3];
    stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }

  ctx.putImageData(imageData, 0, 0);
}

interface CanvasBoardProps {
  isDrawer: boolean;
}

export function CanvasBoard({ isDrawer }: CanvasBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state, actions } = useRoomSession();
  const pendingPoints = useRef<StrokePoint[]>([]);
  const isPointerDown = useRef(false);
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [color, setColor] = useState(DEFAULT_STROKE_COLOR);
  const [width, setWidth] = useState(DEFAULT_STROKE_WIDTH);
  const [tool, setTool] = useState<CanvasTool>("pen");

  // Redraws from scratch whenever the action list changes — a new turn
  // clears it, a broadcast/replay/undo/redo appends to or replaces it. One
  // rendering path, no separate imperative "live preview" layer to keep in
  // sync. Strokes and fills are replayed in order so a fill always sees
  // exactly what was drawn before it, same as it did live.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const action of state.strokes) {
      if (action.kind === "stroke") drawStroke(ctx, action);
      else floodFill(ctx, action);
    }
  }, [state.strokes]);

  function getRelativePoint(e: React.PointerEvent<HTMLCanvasElement>): StrokePoint {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    // Maps CSS pixel coordinates to the canvas's fixed internal resolution
    // — this is what keeps a drawing correct across different screen sizes.
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function flushPendingPoints() {
    if (pendingPoints.current.length < 2) return;
    actions.submitStroke({ points: pendingPoints.current, color, width });
    // Keep the last point as the next segment's starting point, so
    // consecutive flushed segments still connect visually.
    const last = pendingPoints.current[pendingPoints.current.length - 1];
    pendingPoints.current = last ? [last] : [];
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer) return;

    if (tool === "fill") {
      const point = getRelativePoint(e);
      actions.submitFill({ x: point.x, y: point.y, color });
      return;
    }

    isPointerDown.current = true;
    pendingPoints.current = [getRelativePoint(e)];
    flushTimerRef.current = setInterval(flushPendingPoints, STROKE_FLUSH_INTERVAL_MS);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer || tool !== "pen" || !isPointerDown.current) return;
    pendingPoints.current.push(getRelativePoint(e));
  }

  function handlePointerUp() {
    if (!isDrawer || tool !== "pen") return;
    isPointerDown.current = false;
    if (flushTimerRef.current) {
      clearInterval(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    flushPendingPoints();
    pendingPoints.current = [];
  }

  useEffect(() => {
    return () => {
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
    };
  }, []);

  // A fresh turn starts with a clean undo/redo slate — switch back to the
  // pen tool too, rather than leaving fill selected for a turn that hasn't
  // drawn anything yet.
  useEffect(() => {
    setTool("pen");
  }, [state.currentTurn?.turnNumber]);

  return (
    <div className="flex w-full flex-col gap-2">
      {/* The draining countdown bar lives on top of the canvas now, not as
          a numeric badge in the room-metadata card. */}
      {state.currentTurn && <TurnProgressBar turn={state.currentTurn} />}

      <div className="flex gap-2">
        {/* Side toolbar, not a bar across the top — stretches to the
            canvas's full height via the row's default cross-axis stretch. */}
        {isDrawer && (
          <CanvasToolbar
            color={color}
            onColorChange={setColor}
            width={width}
            onWidthChange={setWidth}
            tool={tool}
            onToolChange={setTool}
            onClear={actions.clearCanvas}
            onUndo={actions.undo}
            onRedo={actions.redo}
            canUndo={state.strokes.length > 0}
          />
        )}
        {/* Width-driven, not height-capped — this is what makes the canvas
            extend to the same width as the chat/"text box" panel below it
            (both fill their column), with height simply following the
            fixed 800x500 aspect ratio. The pointer-coordinate scale math in
            getRelativePoint reads the actual rendered rect either way, so
            it stays correct regardless of how big this ends up. */}
        <div className="min-w-0 flex-1">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full touch-none rounded-2xl border-[3px] border-play-ink bg-white shadow-[5px_5px_0_var(--color-play-ink)]"
            style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`, cursor: isDrawer ? (tool === "fill" ? "copy" : "crosshair") : "default" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
        </div>
      </div>
    </div>
  );
}
