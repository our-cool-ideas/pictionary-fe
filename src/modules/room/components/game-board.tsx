"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useSocket } from "@/hooks/use-socket";
import { useRoomSession } from "@/modules/room/context/use-room-session";
import { CanvasBoard } from "@/modules/room/components/canvas-board";
import { Scoreboard } from "@/modules/room/components/scoreboard";
import { ChatPanel } from "@/modules/room/components/chat-panel";
import { TurnStatusHeader } from "@/modules/room/components/turn-status-header";
import { IdleDisconnectGuard } from "@/modules/room/components/idle-disconnect-guard";
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
  const router = useRouter();
  const { playerId } = useSocket();
  const {
    state,
    actions: { kickPlayer, clearCanvas, undo, redo, leaveRoom },
  } = useRoomSession();

  // Toolbar state lives here, not in CanvasBoard — but the toolbar's own
  // UI renders inside CanvasBoard now, so these (plus the actions below)
  // just get passed straight through as props.
  const [color, setColor] = useState(DEFAULT_STROKE_COLOR);
  const [tool, setTool] = useState<CanvasTool>("pen");
  const [width, setWidth] = useState(DEFAULT_STROKE_WIDTH);

  // A fresh turn starts with a clean undo/redo slate — switch back to the
  // pen tool too, rather than leaving fill selected for a turn that hasn't
  // drawn anything yet. Compared during render (the React-recommended way
  // to "adjust state when a prop/derived value changes" — see
  // CanvasBoard's turnKey for the same idiom) rather than in a useEffect,
  // since calling setState synchronously in an effect body is exactly
  // what react-hooks/set-state-in-effect flags as unnecessary indirection
  // here.
  const turnNumber = state.currentTurn?.turnNumber ?? null;
  const [toolResetKey, setToolResetKey] = useState(turnNumber);
  if (turnNumber !== toolResetKey) {
    setToolResetKey(turnNumber);
    setTool("pen");
  }

  if (!state.room) return null;

  const isDrawer = state.currentTurn?.drawerId === playerId;
  const isHost = state.room.hostPlayerId === playerId;
  // liveScores (not currentTurn?.scores ?? lastTurnResult?.scores ?? {})
  // — that old fallback chain read as {} (every score 0) for the whole
  // word-choice window, since that phase clears both currentTurn AND
  // lastTurnResult. See liveScores's own doc comment in room-session.type.ts.
  const scores = state.liveScores;

  async function handleLeave() {
    await leaveRoom();
    router.push("/rooms");
  }

  return (
    <>
      {/* Fixed/full-screen, not scoped to any one card — active for the
          whole room lifecycle (lobby included), unlike CanvasBoard's own
          sole-survivor overlay which only ever shows once a game's
          running. Renders nothing until a real 60s of inactivity. */}
      <IdleDisconnectGuard />
      {/* `bg-play-sand`, not the app-wide `bg-play-cream` — this page's own
          bolder background (see globals.css) so the white cards on top of
          it actually read as white cards on a colored page, not two
          near-identical shades of off-white. */}
      <div className="flex h-screen flex-col justify-center overflow-hidden bg-play-sand px-6 py-5 lg:px-24 lg:py-8">
        {/* No forced height here (no `flex-1`/`h-full`) — this grid is
            exactly as tall as its content needs (see the file-level comment
            above for why), capped at `max-h-full` so it can never exceed
            the space `justify-center` above has to work with. */}
        <div className="grid max-h-full grid-cols-12 gap-4">
          <div className="col-span-3 flex h-full min-h-0 flex-col rounded-2xl border-[3px] border-play-ink bg-play-blue p-3 shadow-[5px_5px_0_var(--color-play-ink)]">
            <div className="mb-2 flex shrink-0 items-center justify-between gap-2 px-0.5">
              <p className="font-play-display text-xs font-bold tracking-wide text-white uppercase">
                Players ({state.room.players.length})
              </p>
              <button
                type="button"
                onClick={handleLeave}
                aria-label="Leave room"
                className="flex shrink-0 items-center gap-1 rounded-lg border-2 border-white/40 bg-white/10 px-2 py-1 font-play-display text-[10px] font-bold tracking-wide text-white uppercase transition-colors hover:bg-white/20"
              >
                <LogOut className="size-3" />
                Leave
              </button>
            </div>
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
            {/* Above the canvas now, not pinned inside ChatPanel's own card
                — see TurnStatusHeader's own doc comment for why. Renders
                nothing (null) whenever there's no turn/last-result to
                show, so it never leaves a stray gap here pre-game. */}
            <TurnStatusHeader />
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
      </div>
    </>
  );
}
