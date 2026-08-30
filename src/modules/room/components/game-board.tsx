"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/use-socket";
import { useRoomSession } from "@/modules/room/context/use-room-session";
import { CanvasBoard } from "@/modules/room/components/canvas-board";
import { Scoreboard } from "@/modules/room/components/scoreboard";
import { ChatPanel } from "@/modules/room/components/chat-panel";
import { CorrectGuessCelebration } from "@/modules/room/components/correct-guess-celebration";
import {
  DEFAULT_STROKE_COLOR,
  DEFAULT_STROKE_WIDTH,
} from "@/modules/room/constants/canvas.constant";
import type { CanvasTool } from "@/modules/room/types/canvas-tool.type";

/**
 * A fixed 16-column CSS grid: players always 5 columns (`col-span-5`,
 * regardless of drawer/guesser state — the tool picker lives inside the
 * canvas now, a popover off a single FAB rather than a permanent sibling
 * column, so nothing needs to shrink to make room for it anymore — see
 * CanvasBoard), canvas + chat always 9 (`col-span-9`), reserved ad space
 * 2 (`col-span-2`). This row's height is content-driven, not forced to
 * the viewport: exactly as tall as its tallest column (almost always
 * canvas+chat, since the canvas is full-bleed width-driven — see
 * CanvasBoard), and every OTHER column stretches to match via CSS
 * Grid's own default `align-items: stretch`. When that's shorter than
 * the viewport, the root below is `justify-center`, so the leftover
 * splits evenly above/below instead of collecting as dead space
 * underneath.
 */
export function GameBoard() {
  const { playerId } = useSocket();
  const {
    state,
    actions: { kickPlayer, clearCanvas, undo, redo },
  } = useRoomSession();

  // Toolbar state lives here, not in CanvasBoard — but the toolbar's own
  // UI renders inside CanvasBoard now, so these (plus the actions below)
  // just get passed straight through as props.
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
  const scores =
    state.currentTurn?.scores ?? state.lastTurnResult?.scores ?? {};

  return (
    <div className="flex h-screen flex-col justify-center overflow-hidden bg-play-cream px-6 py-5 lg:px-24 lg:py-8">
      {/* No forced height here (no `flex-1`/`h-full`) — this grid is
          exactly as tall as its content needs (see the file-level comment
          above for why), capped at `max-h-full` so it can never exceed
          the space `justify-center` above has to work with. */}
      <div className="grid max-h-full grid-cols-12 gap-4">
        <div className="col-span-3 flex h-full min-h-0 flex-col rounded-2xl border-[3px] border-play-ink bg-white p-3 shadow-[5px_5px_0_var(--color-play-ink)]">
          <p className="mb-2 shrink-0 px-0.5 font-play-display text-xs font-bold tracking-wide text-play-ink/50 uppercase">
            Players ({state.room.players.length})
          </p>
          {/* This card is an actual flex column (`flex h-full flex-col`
              above), which is what makes `min-h-0 flex-1` here do
              anything — a long player list scrolls inside this card
              instead of stretching the card (and the whole page) taller. */}
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

        <div className="col-span-7 flex min-h-0 flex-col justify-center gap-4">
          <div className="shrink-0">
            <CanvasBoard
              isDrawer={isDrawer}
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
          <div className="min-h-0 max-h-[560px] flex-1">
            <ChatPanel isDrawer={isDrawer} />
          </div>
        </div>

        <div className="col-span-2 border-[3px]"></div>
      </div>

      <CorrectGuessCelebration />
    </div>
  );
}
