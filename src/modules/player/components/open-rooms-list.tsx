"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOpenRooms } from "@/modules/player/hooks/use-open-rooms";
import { useRoomSession } from "@/modules/room/context/use-room-session";
import { usePlayerName } from "@/hooks/use-player-name";

export function OpenRoomsList() {
  const router = useRouter();
  const { playerName } = usePlayerName();
  const { data, isLoading, error } = useOpenRooms();
  const {
    actions: { joinRoom },
  } = useRoomSession();
  const [joiningCode, setJoiningCode] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const rooms = data?.rooms ?? [];
  const hasName = playerName.trim().length > 0;

  async function handleJoin(code: string) {
    setJoinError(null);
    setJoiningCode(code);
    const result = await joinRoom({ roomCode: code, name: playerName.trim() });
    setJoiningCode(null);
    if (!result.ok) {
      setJoinError(result.message);
      return;
    }
    router.push(`/room/${code}`);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-muted-foreground">Couldn't load open rooms — try refreshing.</p>;
  }

  if (rooms.length === 0) {
    return <p className="text-sm text-muted-foreground">No open rooms right now — create one to get started.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {!hasName && <p className="text-sm text-muted-foreground">Enter your name above first.</p>}
      {joinError && <p className="text-sm text-destructive">{joinError}</p>}
      <ul className="flex flex-col gap-2">
        {rooms.map((room) => (
          <li key={room.code} className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">
                {room.category ? `${room.category.icon ?? ""} ${room.category.name}`.trim() : "Unknown category"} · {room.code}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="size-3" />
                {room.playerCount}/{room.maxPlayers} players
                {room.hostName ? ` · hosted by ${room.hostName}` : ""}
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!hasName || joiningCode !== null}
              onClick={() => handleJoin(room.code)}
            >
              {joiningCode === room.code ? <Loader2 className="size-4 animate-spin" /> : "Join"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
