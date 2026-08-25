"use client";

import { useSocket } from "@/hooks/use-socket";
import { useRoomSession } from "@/modules/room/context/use-room-session";
import { JoinRoomForm } from "@/modules/room/components/join-room-form";
import { RoomLobby } from "@/modules/room/components/room-lobby";
import { GameBoard } from "@/modules/room/components/game-board";
import { GameOverScreen } from "@/modules/room/components/game-over-screen";
import { RoomNoticeScreen } from "@/modules/room/components/room-notice-screen";

interface RoomPageProps {
  code: string;
}

export function RoomPage({ code }: RoomPageProps) {
  const { playerId } = useSocket();
  const { state } = useRoomSession();

  if (state.youWereKicked) return <RoomNoticeScreen variant="kicked" />;
  if (state.roomClosed) return <RoomNoticeScreen variant="closed" />;

  // No room in local state yet, or it belongs to a different code (e.g. a stale
  // session from a previous room) — the guest identity is never persisted, so a
  // fresh load always re-prompts for a name via the join form.
  if (!state.room || state.room.code.toLowerCase() !== code.toLowerCase()) {
    return <JoinRoomForm code={code} />;
  }

  if (state.gameOver) return <GameOverScreen gameOver={state.gameOver} players={state.room.players} />;

  const gameInProgress = state.currentTurn !== null || state.lastTurnResult !== null;
  if (gameInProgress) return <GameBoard />;

  return <RoomLobby room={state.room} currentPlayerId={playerId} />;
}
