"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/use-socket";
import { useRoomSession } from "@/modules/room/context/use-room-session";
import { CanvasBoard } from "@/modules/room/components/canvas-board";
import { CanvasToolbar } from "@/modules/room/components/canvas-toolbar";
import { Scoreboard } from "@/modules/room/components/scoreboard";
import { ChatPanel } from "@/modules/room/components/chat-panel";
import { TurnWordModal } from "@/modules/room/components/turn-word-modal";
import { CorrectGuessCelebration } from "@/modules/room/components/correct-guess-celebration";
import {
  DEFAULT_STROKE_COLOR,
  DEFAULT_STROKE_WIDTH,
} from "@/modules/room/constants/canvas.constant";
import type { CanvasTool } from "@/modules/room/types/canvas-tool.type";
import clsx from "clsx";

/**
 * A fixed 12-column layout, left to right — not an organic flex-1 split:
 *   - Players (+ toolbar when drawing): 3.5 columns (29.1667%, since
 *     Tailwind's built-in fractions only go to twelfths and this isn't
 *     one — `w-[29.1667%]`). Normally the players list alone fills all
 *     3.5; the instant you're the drawer, a toolbar strip joins it — but
 *     the toolbar's width is sized to its own button grid, not a
 *     proportional flex share of these 3.5 columns, and its HEIGHT
 *     stretches to match the players card beside it (plain flex default
 *     stretch — no `self-start`), and the controls inside size themselves
 *     to fill that height (see CanvasToolbar's container-query sizing)
 *     rather than leaving a fixed-size toolbar floating in a taller box.
 *     The players list (`flex-1`) takes whatever's left in the group,
 *     same as always.
 *   - Canvas + chat: always exactly 6.5 columns (`w-[54.1667%]`), full
 *     stop. This never changes size depending on drawer/guesser state or
 *     on the canvas's own aspect ratio — the canvas is width-driven to
 *     fill these 6.5 columns exactly (see CanvasBoard), and the chat
 *     panel below it is a plain `w-full` child of the same column, so the
 *     two are ALWAYS identically wide. No shrink-to-fit, no contain-fit
 *     centering — both of those let the canvas and chat drift to
 *     different widths depending on viewport height, which is exactly
 *     what this avoids.
 *   - Reserved ad space: 2 columns (`w-1/6`).
 * (3.5 + 6.5 + 2 = 12.) Each group is its own div below, on purpose, so
 * the page reads the same way this structure does at a glance instead of
 * needing the JSX decoded.
 */
export function GameBoard() {
  const { playerId } = useSocket();
  const {
    state,
    actions: { kickPlayer, clearCanvas, undo, redo },
  } = useRoomSession();

  // Toolbar state lives here, not in CanvasBoard — the toolbar itself
  // renders as part of the players column here (see below), so both it
  // and the canvas need the same color/tool/width values.
  const [color, setColor] = useState(DEFAULT_STROKE_COLOR);
  const [tool, setTool] = useState<CanvasTool>("pen");
  const [width, setWidth] = useState(DEFAULT_STROKE_WIDTH);

  // A fresh turn starts with a clean undo/redo slate — switch back to the
  // pen tool too, rather than leaving fill selected for a turn that hasn't
  // drawn anything yet.
  useEffect(() => {
    setTool("pen");
  }, [state.currentTurn?.turnNumber]);

  if (!state.room) return null;

  const isDrawer = state.currentTurn?.drawerId === playerId;
  const isHost = state.room.hostPlayerId === playerId;
  const gameStarted =
    state.currentTurn !== null || state.lastTurnResult !== null;
  const scores =
    state.currentTurn?.scores ?? state.lastTurnResult?.scores ?? {};

  const showCanvasToolbar = isDrawer && gameStarted;

  return (
    <div className="flex h-screen flex-col bg-play-cream px-6 py-5 lg:px-14 lg:py-8">
      <div className="grid grid-cols-16 gap-4">
        <div
          className={clsx(
            "rounded-2xl border-[3px] border-play-ink bg-white p-3 shadow-[5px_5px_0_var(--color-play-ink)]",
            showCanvasToolbar ? "col-span-3" : "col-span-5",
          )}
        >
          <p className="mb-2 shrink-0 px-0.5 font-play-display text-xs font-bold tracking-wide text-play-ink/50 uppercase">
            Players ({state.room.players.length})
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Scoreboard
              players={state.room.players}
              scores={scores}
              currentDrawerId={state.currentTurn?.drawerId ?? null}
              correctGuesserIds={state.correctGuesserIds}
              currentPlayerId={playerId}
              onKick={isHost ? kickPlayer : undefined}
            />
          </div>
        </div>

        {showCanvasToolbar && (
          <div className="col-span-2">
            <CanvasToolbar
              color={color}
              onColorChange={setColor}
              tool={tool}
              onToolChange={setTool}
              width={width}
              onWidthChange={setWidth}
              onClear={clearCanvas}
              onUndo={undo}
              onRedo={redo}
              canUndo={state.strokes.length > 0}
            />
          </div>
        )}

        <div className="col-span-9">
          <div className="shrink-0">
            <CanvasBoard
              isDrawer={isDrawer}
              color={color}
              tool={tool}
              width={width}
            />
          </div>
          <div className="min-h-0 max-h-[560px] flex-1">
            <ChatPanel isDrawer={isDrawer} />
          </div>
        </div>

        <div className="col-span-2 border-[3px]"></div>
      </div>

      <TurnWordModal />
      <CorrectGuessCelebration />
    </div>
  );
}
