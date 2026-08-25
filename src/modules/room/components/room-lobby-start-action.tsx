"use client";

import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRoomSession } from "@/modules/room/context/use-room-session";

interface RoomLobbyStartActionProps {
  isHost: boolean;
  canStart: boolean;
  starting: boolean;
  startError: string | null;
  onStart: (start: () => Promise<{ ok: boolean; message: string }>) => void;
}

export function RoomLobbyStartAction({ isHost, canStart, starting, startError, onStart }: RoomLobbyStartActionProps) {
  const {
    actions: { startGame },
  } = useRoomSession();

  if (!isHost) {
    return <p className="text-center text-sm text-muted-foreground">Waiting for the host to start the game…</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" disabled={!canStart || starting} onClick={() => onStart(startGame)}>
        {starting ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
        {canStart ? "Start game" : "Need at least 2 players"}
      </Button>
      {startError && <p className="text-center text-sm text-destructive">{startError}</p>}
    </div>
  );
}
