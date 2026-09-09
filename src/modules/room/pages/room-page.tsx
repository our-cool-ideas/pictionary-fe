"use client";

import { useRoomSession } from "@/modules/room/context/use-room-session";
import { JoinRoomForm } from "@/modules/room/components/join-room-form";
import { GameBoard } from "@/modules/room/components/game-board";
import { RoomNoticeScreen } from "@/modules/room/components/room-notice-screen";

interface RoomPageProps {
  code: string;
}

export function RoomPage({ code }: RoomPageProps) {
  const { state } = useRoomSession();

  if (state.youWereKicked) return <RoomNoticeScreen variant="kicked" />;
  if (state.roomClosed) return <RoomNoticeScreen variant="closed" />;

  // No room in local state yet, or it belongs to a different code (e.g. a
  // stale session from a previous room) — RoomSessionState itself is
  // in-memory only, so a fresh load always re-prompts via the join form.
  // It's a one-click "resume" now rather than joining as a stranger,
  // though: the form comes pre-filled with the guest's saved name (see
  // usePlayerIdentity), and playerId itself is persisted too (see
  // socket-client.ts), so submitting it reattaches to their EXISTING
  // seat/score via joinRoom's reconnect-by-playerId branch instead of
  // minting a brand new player.
  if (!state.room || state.room.code.toLowerCase() !== code.toLowerCase()) {
    return <JoinRoomForm code={code} />;
  }

  // Joining lands straight on the drawing-room HUD now — no separate waiting
  // lobby screen. GameBoard itself shows a pre-game Start/Copy-link banner
  // in place of the turn HUD until a game is actually running.
  return <GameBoard />;
}
