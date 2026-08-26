"use client";

import { useSocket } from "@/hooks/use-socket";
import { useRoomSession } from "@/modules/room/context/use-room-session";
import { RoomHud } from "@/modules/room/components/room-hud";
import { CanvasBoard } from "@/modules/room/components/canvas-board";
import { Scoreboard } from "@/modules/room/components/scoreboard";
import { ChatPanel } from "@/modules/room/components/chat-panel";
import { TurnWordModal } from "@/modules/room/components/turn-word-modal";
import { CorrectGuessCelebration } from "@/modules/room/components/correct-guess-celebration";

export function GameBoard() {
  const { playerId } = useSocket();
  const {
    state,
    actions: { kickPlayer },
  } = useRoomSession();

  if (!state.room) return null;

  const isDrawer = state.currentTurn?.drawerId === playerId;
  const isHost = state.room.hostPlayerId === playerId;
  const scores = state.currentTurn?.scores ?? state.lastTurnResult?.scores ?? {};

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-play-cream p-3 lg:p-4">
      <div className="mx-auto flex w-full min-h-0 max-w-6xl flex-1 flex-col gap-3 lg:flex-row">
        {/* Left column — toolbar+canvas, then chat, top to bottom. The
            canvas is width-driven (see CanvasBoard) so it renders exactly
            as wide as this column, same as the chat/"text box" below it —
            it never shrinks (`shrink-0`), so instead the chat is the
            flexible element that absorbs whatever height is left and
            scrolls its own messages internally, which is what keeps the
            whole page fit to the viewport instead of needing a scroll. */}
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="shrink-0">
            <CanvasBoard isDrawer={isDrawer} />
          </div>
          <div className="min-h-0 flex-1">
            <ChatPanel isDrawer={isDrawer} />
          </div>
        </div>

        {/* Right column — compact room metadata on top, the scrollable
            member list filling the rest of this column's height. */}
        <div className="flex w-full min-h-0 shrink-0 flex-col gap-3 lg:w-[300px]">
          <RoomHud />
          <div className="flex min-h-0 flex-1 flex-col rounded-2xl border-[3px] border-play-ink bg-white p-3 shadow-[5px_5px_0_var(--color-play-ink)]">
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
        </div>
      </div>

      {/* Overlays — the turn's word reveal (modal, not inline in the
          metadata card) and the local player's own correct-guess
          celebration. Neither participates in the column layout above. */}
      <TurnWordModal />
      <CorrectGuessCelebration />
    </div>
  );
}
