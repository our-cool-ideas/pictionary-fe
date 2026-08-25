"use client";

import { useSocket } from "@/hooks/use-socket";
import { useRoomSession } from "@/modules/room/context/use-room-session";
import { TurnHud } from "@/modules/room/components/turn-hud";
import { CanvasBoard } from "@/modules/room/components/canvas-board";
import { Scoreboard } from "@/modules/room/components/scoreboard";
import { ChatPanel } from "@/modules/room/components/chat-panel";

export function GameBoard() {
  const { playerId } = useSocket();
  const { state } = useRoomSession();

  if (!state.room) return null;

  const isDrawer = state.currentTurn?.drawerId === playerId;
  const scores = state.currentTurn?.scores ?? state.lastTurnResult?.scores ?? {};

  return (
    <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_280px]">
      <div className="flex flex-col gap-4">
        {state.currentTurn ? (
          <TurnHud turn={state.currentTurn} isDrawer={isDrawer} yourWord={state.yourWord} />
        ) : (
          <div className="rounded-lg border bg-card px-4 py-3 text-center text-sm text-muted-foreground">
            {state.lastTurnResult ? `The word was "${state.lastTurnResult.word}" — next turn starting soon…` : "Get ready…"}
          </div>
        )}
        <CanvasBoard isDrawer={isDrawer} />
      </div>

      <div className="flex flex-col gap-4">
        <Scoreboard
          players={state.room.players}
          scores={scores}
          currentDrawerId={state.currentTurn?.drawerId ?? null}
          correctGuesserIds={state.correctGuesserIds}
        />
        <div className="h-80 lg:h-full lg:flex-1">
          <ChatPanel isDrawer={isDrawer} />
        </div>
      </div>
    </div>
  );
}
