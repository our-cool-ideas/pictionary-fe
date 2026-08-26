"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users } from "lucide-react";
import { useOpenRooms } from "@/modules/player/hooks/use-open-rooms";
import { useRoomSession } from "@/modules/room/context/use-room-session";
import { usePlayerIdentity } from "@/hooks/use-player-identity";

export function OpenRoomsList() {
  const router = useRouter();
  const { playerName, avatarId } = usePlayerIdentity();
  const { data, isLoading, error } = useOpenRooms();
  const {
    actions: { joinRoom },
  } = useRoomSession();
  const [joiningCode, setJoiningCode] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const rooms = data?.rooms ?? [];

  async function handleJoin(code: string) {
    setJoinError(null);
    setJoiningCode(code);
    const result = await joinRoom({ roomCode: code, name: playerName.trim(), avatarId });
    setJoiningCode(null);
    if (!result.ok) {
      setJoinError(result.message);
      return;
    }
    router.push(`/room/${code}`);
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="size-6 text-play-ink" strokeWidth={2.2} />
          <span className="font-play-display text-2xl font-bold text-play-ink">Open Rooms</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-play-ink px-3.5 py-1.5 font-play-display text-xs font-bold text-play-yellow">
          <span className="inline-block size-1.5 rounded-full bg-play-yellow" />
          {rooms.length} OPEN
        </div>
      </div>

      {joinError && <p className="font-play-body text-sm font-bold text-red-600">{joinError}</p>}

      {isLoading && (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className="h-[76px] animate-pulse rounded-[18px] border-[3px] border-play-ink/20 bg-white" />
          <div className="h-[76px] animate-pulse rounded-[18px] border-[3px] border-play-ink/20 bg-white" />
        </div>
      )}

      {!isLoading && error && (
        <p className="font-play-body text-sm font-bold text-play-ink/60">Couldn&apos;t load open rooms — try refreshing.</p>
      )}

      {!isLoading && !error && rooms.length === 0 && (
        <p className="font-play-body text-sm font-bold text-play-ink/60">No open rooms right now — start one above to get things going.</p>
      )}

      {!isLoading && !error && rooms.length > 0 && (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {rooms.map((room) => (
            <div
              key={room.code}
              className="flex items-center gap-3 rounded-[18px] border-[3px] border-play-ink bg-play-yellow p-3.5 shadow-[4px_4px_0_var(--color-play-ink)]"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border-[2.5px] border-play-ink bg-white text-[22px]">
                {room.category?.icon ?? "🎨"}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-play-display text-[15px] font-bold text-play-ink">
                  {room.category?.name ?? "Unknown"} · {room.code}
                </span>
                <span className="flex items-center gap-1.5 font-play-body text-xs font-bold text-play-ink/65">
                  <Users className="size-3" strokeWidth={2.5} />
                  {room.playerCount}/{room.maxPlayers}
                  {room.hostName ? ` · Hosted by ${room.hostName}` : ""}
                </span>
              </div>
              <button
                type="button"
                disabled={joiningCode !== null}
                onClick={() => handleJoin(room.code)}
                className="shrink-0 rounded-xl border-[2.5px] border-play-ink bg-play-blue px-4.5 py-2.5 font-play-display text-[13.5px] font-bold text-white shadow-[2.5px_2.5px_0_var(--color-play-ink)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {joiningCode === room.code ? <Loader2 className="size-4 animate-spin" /> : "Join"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
