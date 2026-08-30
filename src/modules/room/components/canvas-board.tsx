"use client";

import { useEffect, useRef, useState } from "react";
import { Paintbrush } from "lucide-react";
import { useSocket } from "@/hooks/use-socket";
import { useRoomSession } from "@/modules/room/context/use-room-session";
import { TurnProgressBar } from "@/modules/room/components/turn-progress-bar";
import { PreGameCanvasCard } from "@/modules/room/components/pre-game-canvas-card";
import { CanvasToolbar, TOOL_BUTTONS } from "@/modules/room/components/canvas-toolbar";
import { CANVAS_WIDTH, CANVAS_HEIGHT, STROKE_FLUSH_INTERVAL_MS } from "@/modules/room/constants/canvas.constant";
import type { CanvasTool } from "@/modules/room/types/canvas-tool.type";
import type { DrawAction, StrokePoint } from "@/modules/room/types/game.type";

// The canvas element's own background (`bg-white`, below) — see
// canvas-tool.type.ts's note on the eraser not being a real wire
// primitive: it's just a stroke painted in this color.
const ERASER_COLOR = "#ffffff";

// How long a fresh turn's reveal stays on the canvas before the drawer
// can actually start drawing — this is now where the word reveal lives
// (see the drawer-specific branch below), not a one-time modal, so this
// duration is a real gate on drawing itself, not just a cosmetic fade
// timer: it's the same 5 seconds every player sees "it's your/their
// turn," it's just the word underneath it for the drawer specifically.
const REVEAL_DURATION_MS = 5000;

/** Traces `points` as a smoothed path — quadratic curves through each
 * point's own midpoint with the next, rather than straight `lineTo`
 * segments corner to corner. Freehand pointer samples always carry a bit
 * of sub-pixel jitter (an unsteady hand, a mouse's own sensor noise), and
 * connecting every single sample with a hard corner faithfully renders
 * every one of those tiny direction changes — which is exactly what
 * reads as a "wavy"/curvy line even when you dragged dead straight. This
 * is the standard fix real drawing apps use: it doesn't discard any
 * points, it just interpolates between them instead of kinking at each
 * one, which damps that jitter out. Shared by both the committed stroke
 * renderer and the live shape-preview outline below, so they always look
 * the same. */
function tracePath(ctx: CanvasRenderingContext2D, points: StrokePoint[], smooth: boolean): void {
  if (points.length < 2) return;
  const first = points[0];
  if (!first) return;
  ctx.moveTo(first.x, first.y);

  if (!smooth || points.length === 2) {
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      if (point) ctx.lineTo(point.x, point.y);
    }
    return;
  }

  // Each point (other than the first/last) becomes a quadratic control
  // point, curving toward the midpoint between it and the next one —
  // the actual sampled point is never a hard corner the line passes
  // through, which is what smooths the jitter out.
  for (let i = 1; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    if (!current || !next) continue;
    const midpoint = { x: (current.x + next.x) / 2, y: (current.y + next.y) / 2 };
    ctx.quadraticCurveTo(current.x, current.y, midpoint.x, midpoint.y);
  }
  const last = points[points.length - 1];
  if (last) ctx.lineTo(last.x, last.y);
}

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
  // A committed StrokeAction never records which tool produced it (by
  // design — see canvas-tool.type.ts), so there's no direct "was this
  // freehand?" flag to read here. squareOutlinePoints/circleOutlinePoints
  // always produce exactly SQUARE_OUTLINE_POINT_COUNT/
  // CIRCLE_OUTLINE_POINT_COUNT points respectively, though, and that's
  // specific enough to our own shape generators that it's a safe,
  // deterministic way to skip smoothing for both — a freehand segment
  // coincidentally landing on one of those exact counts is harmless even
  // if it happens, just one slightly-less-smoothed sliver of a much
  // longer stroke. Circles specifically NEED this too, not just squares:
  // smoothing pulls each of the polygon's 48 vertices slightly inward
  // toward its neighbors, which shrinks the rendered circle just enough
  // to visibly mismatch the un-smoothed radius the fill point was
  // computed from — exactly the kind of gap this is trying to avoid, and
  // worse than the square's case since it's uneven all the way around
  // rather than four flat edges.
  const isKnownShapeOutline = stroke.points.length === SQUARE_OUTLINE_POINT_COUNT || stroke.points.length === CIRCLE_OUTLINE_POINT_COUNT;
  tracePath(ctx, stroke.points, !isKnownShapeOutline);
  ctx.stroke();
}

function hexToRgba(hex: string): [number, number, number, number] {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean.length === 3 ? clean.replace(/./g, (c) => c + c) : clean, 16);
  if (Number.isNaN(value)) return [0, 0, 0, 255];
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255, 255];
}

// How far (per RGBA channel, out of 255) a pixel can differ from the
// flood fill's target color and still count as "the same" — an anti-
// aliased stroke edge is a gradient of partially-blended pixels, not a
// hard line, and an exact-match fill stops the instant it hits the first
// one of those that isn't precisely the background color anymore. That
// leaves a thin ring of untouched, half-blended pixels between the fill
// and the stroke sitting on top of it — the "white padding inside a
// filled shape" look. A tolerance lets the fill push through that blend
// instead of stopping at its first pixel.
const FLOOD_FILL_TOLERANCE = 48;

function colorsMatch(a: Uint8ClampedArray | number[], ai: number, b: readonly number[], tolerance = 0): boolean {
  return (
    Math.abs((a[ai] ?? 0) - b[0]) <= tolerance &&
    Math.abs((a[ai + 1] ?? 0) - b[1]) <= tolerance &&
    Math.abs((a[ai + 2] ?? 0) - b[2]) <= tolerance &&
    Math.abs((a[ai + 3] ?? 0) - b[3]) <= tolerance
  );
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

// The exact point counts squareOutlinePoints/circleOutlinePoints always
// produce — shared constants (rather than magic numbers scattered at
// each call site) since drawStroke's smoothing exclusion below has to
// stay in lockstep with these or it silently breaks again.
const SQUARE_OUTLINE_POINT_COUNT = 5;
const CIRCLE_OUTLINE_SEGMENTS = 48;
const CIRCLE_OUTLINE_POINT_COUNT = CIRCLE_OUTLINE_SEGMENTS + 1;

/** Rectangle traced corner-to-corner between two dragged points, closed
 * back to the start so it renders (and flood-fills, for the filled
 * variant) as one unbroken loop. Always exactly SQUARE_OUTLINE_POINT_COUNT
 * points. */
function squareOutlinePoints(start: StrokePoint, end: StrokePoint): StrokePoint[] {
  return [
    { x: start.x, y: start.y },
    { x: end.x, y: start.y },
    { x: end.x, y: end.y },
    { x: start.x, y: end.y },
    { x: start.x, y: start.y },
  ];
}

/** Circle traced as a many-sided polygon inscribed in the bounding box
 * between `start` and `end` — the same drag-a-bounding-box convention as
 * squareOutlinePoints, `start`/`end` treated as opposite ends of a
 * diameter rather than center-and-radius. Centering on `start` itself
 * (an earlier version) grows the circle in BOTH directions from the drag
 * origin, so half of it always extends backward, opposite the direction
 * actually dragged — surprising next to the square tool, which only ever
 * grows toward wherever the cursor moved. Always exactly
 * CIRCLE_OUTLINE_POINT_COUNT points. */
function circleOutlinePoints(start: StrokePoint, end: StrokePoint, segments = CIRCLE_OUTLINE_SEGMENTS): StrokePoint[] {
  const center = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  const radius = Math.hypot(end.x - start.x, end.y - start.y) / 2;
  const points: StrokePoint[] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push({ x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) });
  }
  return points;
}

function shapeOutlinePoints(tool: CanvasTool, start: StrokePoint, end: StrokePoint): StrokePoint[] {
  if (tool === "line") return [start, end];
  return tool === "circle" || tool === "circle-filled" ? circleOutlinePoints(start, end) : squareOutlinePoints(start, end);
}

/** Where to click a bucket-fill for the "filled" shape variants — the
 * midpoint between `start` and `end`, which is both the square's own
 * center and (now that circleOutlinePoints treats them as ends of a
 * diameter too, not center-and-radius) the circle's center as well. */
function shapeFillPoint(start: StrokePoint, end: StrokePoint): StrokePoint {
  return { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
}

function isKnownShapeOutlinePointCount(count: number): boolean {
  return count === SQUARE_OUTLINE_POINT_COUNT || count === CIRCLE_OUTLINE_POINT_COUNT;
}

/** The centroid of an outline's own points, both corners generators
 * close their loop by repeating the first point as the last one, so that
 * duplicate is dropped first — otherwise it'd be double-weighted and the
 * average would land slightly off the true center. For an evenly-spaced
 * point set around a shape's own middle (both squareOutlinePoints' 4
 * corners and circleOutlinePoints' 48 samples qualify), this centroid is
 * mathematically the same point shapeFillPoint computes from the
 * original start/end — see fillMatchesOutline below, which leans on
 * that equivalence. */
function polygonCentroid(points: StrokePoint[]): StrokePoint {
  const unique = points.length > 1 ? points.slice(0, -1) : points;
  const sum = unique.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / unique.length, y: sum.y / unique.length };
}

// How close (in canvas-internal pixels) a fill action's click point has
// to land to a preceding stroke's own centroid to be treated as "this
// fill belongs to that shape" rather than an unrelated bucket-fill click
// — see fillMatchesOutline. Both shapeFillPoint (at submit time) and
// polygonCentroid (at replay time) compute the same point via slightly
// different arithmetic (halving a sum vs averaging corners/samples), so
// this only needs to be just past ordinary floating-point noise, not a
// real "closeness" tolerance.
const SHAPE_FILL_MATCH_EPSILON = 0.5;

/** True when `fill` is specifically the fill this file itself generated
 * for a filled square/circle tool's `precedingStroke` — not a real
 * generic bucket-fill click that merely happens to follow some other
 * stroke in the array. Requires BOTH the preceding stroke's point count
 * to match one of our own shape generators exactly AND its centroid to
 * land within SHAPE_FILL_MATCH_EPSILON of the fill's own click point —
 * either alone could coincidentally match an unrelated freehand
 * stroke/fill pair; both together effectively can't. */
function fillMatchesOutline(fill: Extract<DrawAction, { kind: "fill" }>, precedingStroke: Extract<DrawAction, { kind: "stroke" }> | undefined): boolean {
  if (!precedingStroke || !isKnownShapeOutlinePointCount(precedingStroke.points.length)) return false;
  const centroid = polygonCentroid(precedingStroke.points);
  return Math.hypot(fill.x - centroid.x, fill.y - centroid.y) < SHAPE_FILL_MATCH_EPSILON;
}

/** Fills a shape outline's own exact path — not a pixel-by-pixel flood
 * fill, a proper vector fill of the same points the outline stroke was
 * traced from. This (not floodFill) is what makes a filled square/circle
 * actually clean: floodFill and stroke() are fundamentally two different
 * rendering models glued together — floodFill is pixel-exact with no
 * concept of partial coverage at all (a pixel either gets fully replaced
 * or left completely alone), while stroke() is vector-rasterized with
 * proper anti-aliased partial coverage at its edge. Gluing those two
 * together always leaves SOME seam where a hard edge meets a soft one,
 * no matter how the flood fill's own matching tolerance is tuned —
 * tuning that only ever narrows the seam, never actually closes it.
 * Filling the identical path the outline itself uses puts both
 * operations through the exact same rasterizer, so their edges
 * coincide pixel-for-pixel instead of two different algorithms
 * independently guessing where "the edge" is. */
function fillPolygonPath(ctx: CanvasRenderingContext2D, points: StrokePoint[], color: string): void {
  if (points.length < 3) return;
  ctx.fillStyle = color;
  ctx.beginPath();
  tracePath(ctx, points, false);
  ctx.closePath();
  ctx.fill();
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
function floodFill(ctx: CanvasRenderingContext2D, fill: Extract<DrawAction, { kind: "fill" }>, dpr: number): void {
  const { width, height } = ctx.canvas;
  // `fill.x`/`fill.y` are in the LOGICAL 800×500 coordinate space every
  // client agrees on (see CANVAS_WIDTH/CANVAS_HEIGHT) — but this reads
  // and writes raw pixels via get/putImageData, which always operate in
  // the canvas's actual PHYSICAL backing-store pixels regardless of any
  // ctx.setTransform scaling (that's a vector-drawing concept; it has no
  // effect on pixel-level APIs). At a device pixel ratio above 1 (see the
  // component's own canvas-resolution effect) the physical buffer is
  // dpr× larger than the logical space, so the click point has to be
  // scaled up to match before it's used as a raw pixel index.
  const startX = Math.floor(fill.x * dpr);
  const startY = Math.floor(fill.y * dpr);
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
    if (!colorsMatch(data, idx, target, FLOOD_FILL_TOLERANCE)) continue;
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
  /** Owned by GameBoard — the toolbar renders inside this component now
      (a floating popover over the canvas, see below), so both need the
      same color/tool/width state and the toolbar's own callbacks. */
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

/**
 * The canvas card: the drawable canvas with the countdown bar built into
 * its bottom, plus (for the drawer) the tool picker itself — a single
 * round toggle button in the canvas's corner that expands into the full
 * CanvasToolbar popover, and collapses again the moment a tool/size/color
 * is picked. Not a permanent sibling column anymore (gartic.io's own
 * toolbar sits on the page background beside the canvas, but a
 * click-to-expand picker keeps the canvas itself as the one thing that
 * has to stay a constant, predictable size regardless of drawer/guesser
 * state — see GameBoard, whose players column no longer has to shrink to
 * make room for a toolbar column). The word/status pill is still pinned
 * to the top of the chat panel, not floating over the canvas either —
 * see TurnStatusHeader.
 */
export function CanvasBoard({ isDrawer, color, onColorChange, tool, onToolChange, width, onWidthChange, onClear, onUndo, onRedo, canUndo }: CanvasBoardProps) {
  const { playerId } = useSocket();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state, actions } = useRoomSession();
  const pendingPoints = useRef<StrokePoint[]>([]);
  const isPointerDown = useRef(false);
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Which turn (by number, or "ended" for the post-turn gap, or null for
  // no turn at all) the announcement below was LAST computed for — used
  // only to notice when that's changed, so the fade timer can reset for
  // the new one. Comparing this during render (below) rather than
  // resetting it from inside a useEffect is the React-recommended way to
  // "adjust state when a prop/derived value changes": a plain setState
  // call during render is idempotent here (the comparison it's guarded
  // by becomes false the instant it runs), so it costs one extra render
  // pass, not a loop — an effect doing the same reset would be run a
  // whole frame later, and calling setState synchronously in an effect's
  // body (rather than in a callback responding to something external,
  // like the timer below) is exactly the pattern React's own lint rule
  // for this flags as unnecessary indirection.
  const turnKey = state.currentTurn?.turnNumber ?? (state.lastTurnResult ? "ended" : null);
  const [lastTurnKey, setLastTurnKey] = useState(turnKey);
  const [newTurnMessageFaded, setNewTurnMessageFaded] = useState(false);
  if (turnKey !== lastTurnKey) {
    setLastTurnKey(turnKey);
    setNewTurnMessageFaded(false);
  }

  // The timer itself IS a genuine side effect (subscribing to something
  // external — real elapsed time — and reacting when it fires), unlike
  // the reset above, so this is exactly what a useEffect is for.
  useEffect(() => {
    if (!state.currentTurn) return;
    const timer = setTimeout(() => setNewTurnMessageFaded(true), REVEAL_DURATION_MS);
    return () => clearTimeout(timer);
  }, [state.currentTurn]);

  // Whether the reveal window (the first REVEAL_DURATION_MS of a turn)
  // is still active — the drawer can't actually draw yet during this,
  // see canDraw below. There's nothing to gate for guessers (they were
  // never able to draw), so this doubles as "is there a reveal to show"
  // regardless of who's looking at it.
  const revealActive = state.currentTurn !== null && !newTurnMessageFaded;
  const canDraw = isDrawer && !revealActive;

  // A message announced directly on the canvas itself — not just in the
  // chat header (TurnStatusHeader), and not a one-time modal anymore
  // either (that used to be where the drawer's own word was revealed —
  // now it's right here instead, for the same REVEAL_DURATION_MS the
  // drawer is blocked from drawing) — for the two moments the canvas
  // otherwise just sits there frozen with zero context: the instant
  // your turn ends (persists until the next turn actually starts —
  // there's no "who's next" to show yet, so it just says the turn's
  // over), and the reveal at the start of a new one.
  let transitionMessage: string | null = null;
  let isWordReveal = false;
  if (revealActive && state.currentTurn) {
    if (isDrawer) {
      isWordReveal = true;
      // Briefly null the instant TURN_STARTED arrives, before the
      // separate YOUR_WORD event catches up (see room-session.type.ts) —
      // rather than flash a blank card for that one frame, this just
      // shows nothing until the word's actually in hand.
      transitionMessage = state.yourWord;
    } else {
      transitionMessage = `${state.currentTurn.drawerName}'s turn! (${state.currentTurn.wordLength} letters)`;
    }
  } else if (!state.currentTurn && state.lastTurnResult) {
    transitionMessage = state.lastTurnResult.drawerId === playerId ? "Your turn is over!" : "Turn over!";
  }

  // Whether the tool-picker popover is open — closed by default, and
  // closed again automatically the moment a tool/size/color is actually
  // picked (see the handle*Select wrappers below), so it never lingers
  // over the drawing after its job is done. Undo/redo/clear deliberately
  // do NOT close it — those are one-off actions you might repeat (undo a
  // few strokes back), not a "pick and get out of the way" choice.
  const [toolbarOpen, setToolbarOpen] = useState(false);
  // The anchor point (one corner of the bounding box, for both square
  // and circle now — see circleOutlinePoints) recorded on pointerdown
  // for a shape tool — only a ref since it doesn't need to trigger a
  // render on its own, unlike shapePreview below.
  const shapeStart = useRef<StrokePoint | null>(null);
  // The shape's live in-progress outline while dragging — local-only,
  // never sent over the wire until pointerup commits it. Drawn as an
  // extra layer in the redraw effect below, on top of the real committed
  // strokes, so it never pollutes state.strokes and disappears cleanly
  // the instant the drag ends or is cancelled.
  const [shapePreview, setShapePreview] = useState<StrokePoint[] | null>(null);
  // The canvas's own pixel buffer is CANVAS_WIDTH×CANVAS_HEIGHT physical
  // pixels by default — fine on an ordinary 1x display, but stretched
  // across a much larger CSS box (this canvas is always `w-full` of its
  // column) or a hi-DPI/zoomed display, that's a low-res bitmap blown up,
  // which reads as blurry. `devicePixelRatio` also change on the user
  // browser-zooming (not just switching monitors), so this is tracked as
  // real state via the matchMedia listener below, not read once — a
  // zoom mid-game should sharpen the canvas without needing a reload.
  const [dpr, setDpr] = useState(() => (typeof window === "undefined" ? 1 : window.devicePixelRatio || 1));

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Re-subscribes to a media query matching the CURRENT dpr each time
    // it changes — the moment the real dpr drifts from whatever this
    // query still asserts, it fails to match and fires once, which is
    // the standard way to observe devicePixelRatio changes (there's no
    // direct "dpr changed" event).
    const mql = window.matchMedia(`(resolution: ${dpr}dppx)`);
    const handleChange = () => setDpr(window.devicePixelRatio || 1);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, [dpr]);

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
    // Provisions the canvas's PHYSICAL pixel buffer at dpr× the logical
    // 800×500 resolution, then scales the drawing context so every
    // existing draw call — still written in plain 0–800/0–500 logical
    // coordinates, same as the wire protocol — automatically lands at
    // full device resolution without changing a single coordinate
    // anywhere else in this file. Setting `canvas.width`/`height` (even
    // to the same value) always wipes the canvas and resets its
    // transform, which is exactly why this happens once per dpr change
    // rather than every redraw — this effect already reruns on every
    // redraw regardless (state.strokes et al are still in its deps), so
    // skipping the resize when nothing's actually changed avoids
    // pointlessly discarding a transform that was already correct.
    const targetWidth = Math.round(CANVAS_WIDTH * dpr);
    const targetHeight = Math.round(CANVAS_HEIGHT * dpr);
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const strokes = state.strokes;
    for (let i = 0; i < strokes.length; i++) {
      const action = strokes[i];
      if (!action) continue;
      if (action.kind === "stroke") {
        drawStroke(ctx, action);
        continue;
      }
      // A real bucket-fill click needs the actual pixel flood fill — it
      // has no shape of its own, just whatever hand-drawn strokes happen
      // to enclose it. But when this fill is the one WE generated for a
      // filled square/circle tool (see fillMatchesOutline), the exact
      // polygon it should fill is right there in the previous action —
      // filling that path directly is what actually gets a clean edge,
      // not a pixel algorithm trying to approximate it from outside.
      const precedingStroke = strokes[i - 1];
      if (precedingStroke?.kind === "stroke" && fillMatchesOutline(action, precedingStroke)) {
        fillPolygonPath(ctx, precedingStroke.points, action.color);
      } else {
        floodFill(ctx, action, dpr);
      }
    }
    if (shapePreview) {
      // A filled square/circle used to only show its empty outline while
      // dragging — the actual fill only appeared once the bucket-fill
      // action landed after release, so it looked hollow the whole drag
      // and only "popped" solid at the very end. Filling this preview
      // path too (before stroking its outline on top, same as the
      // eventual committed look) gives instant, accurate feedback
      // instead of a surprise at release.
      if (isFilledShapeTool(tool)) {
        ctx.fillStyle = color;
        ctx.beginPath();
        tracePath(ctx, shapePreview, false);
        ctx.closePath();
        ctx.fill();
      }
      drawStroke(ctx, { points: shapePreview, color, width });
    }
  }, [state.strokes, shapePreview, color, width, tool, dpr]);

  function getRelativePoint(e: React.PointerEvent<HTMLCanvasElement>): StrokePoint {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    // Maps CSS pixel coordinates to the canvas's fixed LOGICAL resolution
    // — this is what keeps a drawing correct across different screen
    // sizes. Deliberately CANVAS_WIDTH/CANVAS_HEIGHT here, not
    // `canvas.width`/`canvas.height` — those are the PHYSICAL, dpr-scaled
    // pixel buffer dimensions (see the canvas-resolution effect above),
    // and every point this function returns needs to stay in the same
    // logical 800×500 space the wire protocol and every shape-generator
    // in this file already assume, regardless of dpr. Safe to do this
    // naively (no letterbox/contain-fit math needed) since the canvas is
    // always full-bleed `w-full` with its height following from that same
    // width via the CSS `aspectRatio` below — the rendered box IS the
    // 800:500 content, edge to edge, never letterboxed.
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  // Pick-and-close wrappers for the popover — see the `toolbarOpen` comment
  // above for why undo/redo/clear don't get the same treatment.
  function handleToolSelect(t: CanvasTool) {
    onToolChange(t);
    setToolbarOpen(false);
  }
  function handleColorSelect(c: string) {
    onColorChange(c);
    setToolbarOpen(false);
  }
  function handleWidthSelect(w: number) {
    onWidthChange(w);
    setToolbarOpen(false);
  }

  // A filled shape is two separate wire actions (an outline stroke, then
  // a fill — see fillMatchesOutline) even though it's one thing to draw
  // and, from the drawer's perspective, one thing to undo. The server's
  // own undo/redo only ever removes/restores one action at a time, so
  // without this an undo on a filled shape strips just the fill and
  // leaves its bare outline sitting there for a moment — undo "reveals"
  // the two-step implementation instead of just removing the shape.
  // Popping/pushing group sizes here (only ever 1 or 2 in practice) is
  // what keeps a later redo restoring that same shape whole too, rather
  // than putting the outline back first and needing a second redo for
  // the fill — this can only ever desync from reality if some OTHER
  // client's actions interleave with ours, which never happens here:
  // only the current drawer ever submits actions during their own turn.
  const undoGroupStack = useRef<number[]>([]);

  // A fresh turn's strokes are unrelated to whatever this stack was
  // tracking for the PREVIOUS turn (state.strokes itself already resets
  // to `[]` on TURN_STARTED — see the reducer) — without this reset, a
  // stale group size left over from someone else's earlier turn could
  // make this turn's first undo/redo grab the wrong number of actions.
  useEffect(() => {
    undoGroupStack.current = [];
  }, [state.currentTurn?.turnNumber]);

  async function handleUndo() {
    const strokes = state.strokes;
    const last = strokes[strokes.length - 1];
    const secondLast = strokes[strokes.length - 2];
    const groupSize = last?.kind === "fill" && secondLast?.kind === "stroke" && fillMatchesOutline(last, secondLast) ? 2 : 1;
    for (let i = 0; i < groupSize; i++) await onUndo();
    undoGroupStack.current.push(groupSize);
  }

  async function handleRedo() {
    const groupSize = undoGroupStack.current.pop() ?? 1;
    for (let i = 0; i < groupSize; i++) await onRedo();
  }

  function flushPendingPoints() {
    if (pendingPoints.current.length < 2) return;
    // The eraser isn't a real wire primitive (see canvas-tool.type.ts) —
    // it's a normal stroke painted in the canvas's own background color,
    // so "erasing" is just drawing over whatever was there in white.
    actions.submitStroke({ points: pendingPoints.current, color: tool === "eraser" ? ERASER_COLOR : color, width });
    // Keep the last point as the next segment's starting point, so
    // consecutive flushed segments still connect visually.
    const last = pendingPoints.current[pendingPoints.current.length - 1];
    pendingPoints.current = last ? [last] : [];
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    // Not just isDrawer — canDraw also blocks the drawer themselves for
    // the first REVEAL_DURATION_MS of their own turn, while their word
    // is up on the canvas (see the revealActive/canDraw derivation
    // above). Guessers were never able to draw either way.
    if (!canDraw) return;

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
    // the canvas's own rendered bounds fires a native pointerleave and
    // cuts the stroke short — the user has to
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
    if (!canDraw || !isPointerDown.current) return;

    if (isShapeTool(tool)) {
      if (!shapeStart.current) return;
      setShapePreview(shapeOutlinePoints(tool, shapeStart.current, getRelativePoint(e)));
      return;
    }

    if (tool !== "pen" && tool !== "eraser") return;
    pendingPoints.current.push(getRelativePoint(e));
  }

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!canDraw) return;

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
      const outline = shapeOutlinePoints(tool, start, end);
      actions.submitStroke({ points: outline, color, width });
      if (isFilledShapeTool(tool)) {
        // Still submitted as a plain wire "fill" — see fillMatchesOutline
        // in the redraw effect for how replay turns this specific
        // outline+fill pair back into a clean vector fill of `outline`
        // itself, rather than the pixel flood fill a real bucket-fill
        // click needs.
        const fillPoint = shapeFillPoint(start, end);
        actions.submitFill({ x: fillPoint.x, y: fillPoint.y, color });
      }
      return;
    }

    if (tool !== "pen" && tool !== "eraser") return;
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

  // What the closed FAB shows — the currently selected tool's own icon,
  // so it stays informative even collapsed instead of a generic
  // "toolbox" glyph. Falls back to the pen icon defensively; every real
  // CanvasTool value has a matching entry in TOOL_BUTTONS.
  const CurrentToolIcon = TOOL_BUTTONS.find((t) => t.tool === tool)?.icon ?? Paintbrush;

  return (
    // Full-bleed and width-driven, on purpose — GameBoard's canvas+chat
    // column doesn't force this into an arbitrary fixed-height box
    // anymore (that meant letterboxing/shrinking whenever the box's shape
    // didn't happen to match 800:500 — which was most of the time).
    // Instead the canvas fills 100% of its column's WIDTH, and its height
    // simply follows from the fixed aspect ratio below — the column
    // itself is sized to match afterward (see GameBoard). No wrapping
    // "card" either — the canvas's own border+shadow is the only visible
    // boundary here.
    <div className="flex w-full flex-col gap-2">
      {/* `relative` here (not on the outer flex-col) so the FAB/popover
          below anchor to the canvas's own corner specifically, not to the
          canvas+progress-bar pair as a whole. */}
      <div className="relative">
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
            cursor: canDraw ? (tool === "fill" ? "copy" : "crosshair") : "default",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />

        {/* The canvas's own announcement — see the revealActive/
            transitionMessage derivation above for exactly when this
            shows and for how long. `pointer-events-none` isn't what's
            actually stopping the drawer from drawing during the reveal
            (canDraw does that, at the pointer-handler level, regardless
            of what's visually on top) — it's here so a click during the
            "Turn over!"/"X's turn!" states, where drawing is correctly
            blocked anyway, doesn't feel like it's hitting a wall. */}
        {transitionMessage && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-play-ink/50">
            {isWordReveal ? (
              <div className="flex flex-col items-center gap-1 rounded-2xl border-[3px] border-play-ink bg-white px-8 py-5 text-center shadow-[4px_4px_0_var(--color-play-ink)]">
                <p className="font-play-display text-xs font-bold tracking-wide text-play-ink/50 uppercase">Your word</p>
                <p className="font-play-display text-3xl font-bold break-all text-play-ink">{transitionMessage}</p>
              </div>
            ) : (
              <p className="rounded-2xl border-[3px] border-play-ink bg-white px-6 py-3 text-center font-play-display text-lg font-bold text-play-ink shadow-[4px_4px_0_var(--color-play-ink)]">
                {transitionMessage}
              </p>
            )}
          </div>
        )}

        {canDraw && (
          <>
            {/* A click anywhere else on the canvas while the strip's open
                dismisses it instead of drawing — sits above the canvas
                but below the strip (z-10 vs z-20). Only mounted while
                open, so it never intercepts normal drawing clicks. This
                is the ONLY way to close the strip now — no close button
                — which is exactly why it has to cover the rest of the
                canvas: closing has to stay reachable no matter how wide
                the edge-to-edge strip itself ends up being. */}
            {toolbarOpen && (
              <button
                type="button"
                aria-label="Close tool picker"
                onClick={() => setToolbarOpen(false)}
                className="absolute inset-0 z-10 cursor-default rounded-2xl bg-play-ink/10"
              />
            )}

            {/* The strip itself — flush against the canvas's own right,
                top, and bottom edges (no margin/inset, unlike the FAB),
                so it reads as part of the canvas's own frame rather than
                a card floating over it (see CanvasToolbar's rounding/
                border, matched to the canvas's for exactly that reason).
                Full height of the canvas either way — CanvasToolbar
                handles its own internal scrolling once it has this real,
                bounded height to work with (see its own comment for why).
                Only mounted while open — closing is instant, not
                animated, to keep this simple. */}
            {toolbarOpen && (
              <div className="absolute inset-y-0 right-0 z-20">
                <CanvasToolbar
                  color={color}
                  onColorChange={handleColorSelect}
                  tool={tool}
                  onToolChange={handleToolSelect}
                  width={width}
                  onWidthChange={handleWidthSelect}
                  onClear={onClear}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  canUndo={canUndo}
                />
              </div>
            )}

            {/* The toggle — shows the currently selected tool's own icon
                (so it's informative at a glance) plus a small swatch
                badge for the current color. Hidden entirely while the
                strip is open (there's no close button — see above —
                so nothing else needs to make room for it either). */}
            {!toolbarOpen && (
              <button
                type="button"
                aria-label="Open tool picker"
                aria-expanded={false}
                onClick={() => setToolbarOpen(true)}
                className="absolute top-3 right-3 z-20 flex size-12 items-center justify-center rounded-full border-[3px] border-play-ink bg-white text-play-ink shadow-[3px_3px_0_var(--color-play-ink)]"
              >
                <CurrentToolIcon className="size-5" />
                <span
                  className="absolute -bottom-1 -left-1 size-4 rounded-full border-2 border-play-ink"
                  style={{ backgroundColor: color }}
                />
              </button>
            )}
          </>
        )}
      </div>

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
