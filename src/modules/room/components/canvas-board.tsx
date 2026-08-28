"use client";

import { useEffect, useRef, useState } from "react";
import { useRoomSession } from "@/modules/room/context/use-room-session";
import { TurnProgressBar } from "@/modules/room/components/turn-progress-bar";
import { PreGameCanvasCard } from "@/modules/room/components/pre-game-canvas-card";
import { CANVAS_WIDTH, CANVAS_HEIGHT, STROKE_FLUSH_INTERVAL_MS } from "@/modules/room/constants/canvas.constant";
import type { CanvasTool } from "@/modules/room/types/canvas-tool.type";
import type { DrawAction, StrokePoint } from "@/modules/room/types/game.type";

/** Takes just the fields actually needed to paint a stroke — a committed
 * StrokeAction has more (kind, drawerId) than this cares about, and the
 * local-only shape preview (never sent over the wire) doesn't have those
 * at all. */
function drawStroke(ctx: CanvasRenderingContext2D, stroke: { points: StrokePoint[]; color: string; width: number }): void {
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

/** The line/shape tools never get their own DrawAction kind on the wire —
 * a line is just a 2-point stroke and an outline is a closed poly-line
 * stroke, so both the live preview and the final submitted action reuse
 * the exact same point list. */
function isShapeTool(tool: CanvasTool): tool is "line" | "square" | "square-filled" | "circle" | "circle-filled" {
  return tool === "line" || tool === "square" || tool === "square-filled" || tool === "circle" || tool === "circle-filled";
}

function isFilledShapeTool(tool: CanvasTool): boolean {
  return tool === "square-filled" || tool === "circle-filled";
}

/** Rectangle traced corner-to-corner between two dragged points, closed
 * back to the start so it renders (and flood-fills, for the filled
 * variant) as one unbroken loop. */
function squareOutlinePoints(start: StrokePoint, end: StrokePoint): StrokePoint[] {
  return [
    { x: start.x, y: start.y },
    { x: end.x, y: start.y },
    { x: end.x, y: end.y },
    { x: start.x, y: end.y },
    { x: start.x, y: start.y },
  ];
}

/** Circle traced as a many-sided polygon around `start` (the center),
 * with `end` setting the radius — a click-and-drag-out-the-radius circle
 * tool, the same convention most drawing apps use. */
function circleOutlinePoints(start: StrokePoint, end: StrokePoint, segments = 48): StrokePoint[] {
  const radius = Math.hypot(end.x - start.x, end.y - start.y);
  const points: StrokePoint[] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push({ x: start.x + radius * Math.cos(angle), y: start.y + radius * Math.sin(angle) });
  }
  return points;
}

function shapeOutlinePoints(tool: CanvasTool, start: StrokePoint, end: StrokePoint): StrokePoint[] {
  if (tool === "line") return [start, end];
  return tool === "circle" || tool === "circle-filled" ? circleOutlinePoints(start, end) : squareOutlinePoints(start, end);
}

/** Where to click a bucket-fill for the "filled" shape variants — the
 * square's own midpoint, or the circle's center (which is just `start`,
 * since circles are dragged out from their center). */
function shapeFillPoint(tool: CanvasTool, start: StrokePoint, end: StrokePoint): StrokePoint {
  if (tool === "circle-filled") return start;
  return { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
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
  /** Owned by GameBoard — the toolbar renders as its own column there
      now (between the players column and this one, matching gartic.io's
      layout), so both need the same color/tool/width state. This
      component only reads them to know what to draw with. */
  color: string;
  tool: CanvasTool;
  width: number;
}

/**
 * The canvas card: the drawable canvas with the countdown bar built into
 * its bottom — gartic.io's canvas box, minus the toolbar (that's
 * GameBoard's own column now, beside this one, not nested inside it —
 * gartic.io's toolbar sits directly on the page background, not inside
 * the white canvas box) and minus the word/status pill (that's pinned to
 * the top of the chat panel now instead — see TurnStatusHeader — rather
 * than floating over the canvas).
 */
export function CanvasBoard({ isDrawer, color, tool, width }: CanvasBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state, actions } = useRoomSession();
  const pendingPoints = useRef<StrokePoint[]>([]);
  const isPointerDown = useRef(false);
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // The anchor point (top-left for square, center for circle) recorded on
  // pointerdown for a shape tool — only a ref since it doesn't need to
  // trigger a render on its own, unlike shapePreview below.
  const shapeStart = useRef<StrokePoint | null>(null);
  // The shape's live in-progress outline while dragging — local-only,
  // never sent over the wire until pointerup commits it. Drawn as an
  // extra layer in the redraw effect below, on top of the real committed
  // strokes, so it never pollutes state.strokes and disappears cleanly
  // the instant the drag ends or is cancelled.
  const [shapePreview, setShapePreview] = useState<StrokePoint[] | null>(null);

  // Redraws from scratch whenever the action list (or the in-progress
  // shape preview) changes — a new turn clears it, a broadcast/replay/
  // undo/redo appends to or replaces it. One rendering path, no separate
  // imperative layer to keep in sync beyond the shape preview itself.
  // Strokes and fills are replayed in order so a fill always sees exactly
  // what was drawn before it, same as it did live.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const action of state.strokes) {
      if (action.kind === "stroke") drawStroke(ctx, action);
      else floodFill(ctx, action);
    }
    if (shapePreview) drawStroke(ctx, { points: shapePreview, color, width });
  }, [state.strokes, shapePreview, color, width]);

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

    if (isShapeTool(tool)) {
      const point = getRelativePoint(e);
      shapeStart.current = point;
      setShapePreview(shapeOutlinePoints(tool, point, point));
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Fine — dragging still works, just without capture.
      }
      isPointerDown.current = true;
      return;
    }

    // Without this, a fast or wide stroke that carries the pointer outside
    // the canvas's own (contain-fit, not always full-bleed) bounds fires a
    // native pointerleave and cuts the stroke short — the user has to
    // release and start a new stroke to keep going. Capturing the pointer
    // keeps every subsequent move/up event routed to this canvas
    // regardless of where the cursor physically is, and — per spec —
    // suppresses pointerleave/pointerout for the captured pointer, so the
    // stroke tracks smoothly all the way to release. Guarded: some
    // browsers/input types can reject capture (e.g. no active pointer
    // with that id) — that must never block drawing itself, just lose the
    // extra protection for that one stroke.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Fine — the stroke still works, just without capture.
    }

    isPointerDown.current = true;
    pendingPoints.current = [getRelativePoint(e)];
    flushTimerRef.current = setInterval(flushPendingPoints, STROKE_FLUSH_INTERVAL_MS);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer || !isPointerDown.current) return;

    if (isShapeTool(tool)) {
      if (!shapeStart.current) return;
      setShapePreview(shapeOutlinePoints(tool, shapeStart.current, getRelativePoint(e)));
      return;
    }

    if (tool !== "pen") return;
    pendingPoints.current.push(getRelativePoint(e));
  }

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer) return;

    if (isShapeTool(tool)) {
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Fine — capture was never established, or already released.
      }
      isPointerDown.current = false;
      const start = shapeStart.current;
      shapeStart.current = null;
      setShapePreview(null);
      if (!start) return;
      const end = getRelativePoint(e);
      // A plain click with no real drag would submit a degenerate,
      // invisible zero-size shape — skip it rather than waste a stroke.
      if (Math.hypot(end.x - start.x, end.y - start.y) < 2) return;
      actions.submitStroke({ points: shapeOutlinePoints(tool, start, end), color, width });
      if (isFilledShapeTool(tool)) {
        const fillPoint = shapeFillPoint(tool, start, end);
        actions.submitFill({ x: fillPoint.x, y: fillPoint.y, color });
      }
      return;
    }

    if (tool !== "pen") return;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Fine — capture was never established, or already released.
    }
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

  // Nothing's happened yet — the canvas's own footprint hosts the
  // invite/start placeholder instead of a blank drawable surface (see
  // PreGameCanvasCard). Once a turn actually starts this flips to the real
  // canvas card and never flips back (a finished game shows GameOverScreen
  // instead of GameBoard at all — see room-page.tsx).
  const gameStarted = state.currentTurn !== null || state.lastTurnResult !== null;

  if (!gameStarted) return <PreGameCanvasCard />;

  return (
    // No wrapping "card" around the canvas, and no contain-fit centering
    // either — GameBoard now gives this component a FIXED-width column
    // (an explicit fraction of the page, not an organic flex-1 share), so
    // the canvas can just be width-driven: fill 100% of that column,
    // height following automatically via the fixed 800x500 aspect ratio.
    // That's what guarantees the canvas is always exactly as wide as the
    // chat panel below it — both are plain `w-full` of the same
    // fixed-width column, no shrink-to-fit math that could ever make one
    // narrower than the other. The canvas's own border+shadow is the only
    // visible boundary here, not a second "card" layer around it.
    <div className="flex w-full flex-col gap-2">
      {/* The pointer-coordinate scale math in getRelativePoint reads the
          canvas's actual rendered rect, so it stays correct regardless of
          exactly how wide this column ends up being. */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full touch-none rounded-2xl border-[3px] border-play-ink bg-white shadow-[5px_5px_0_var(--color-play-ink)]"
        style={{
          aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
          cursor: isDrawer ? (tool === "fill" ? "copy" : "crosshair") : "default",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />

      {/* The draining countdown bar, right under the canvas — gartic.io
          sits its progress bar at the canvas's bottom edge, not off in a
          separate row elsewhere on the page. */}
      {state.currentTurn && (
        <div className="shrink-0 px-1">
          <TurnProgressBar turn={state.currentTurn} />
        </div>
      )}
    </div>
  );
}
