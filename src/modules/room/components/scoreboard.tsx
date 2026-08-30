"use client";

import { useState } from "react";
import { Crown, Pencil, WifiOff } from "lucide-react";
import { getAvatarOption } from "@/modules/player/constants/avatar.constant";
import { AvatarIcon } from "@/modules/player/components/avatar-icon";
import { PlayerDetailModal } from "@/modules/room/components/player-detail-modal";
import type { RoomPlayer } from "@/modules/room/types/room.type";
import { cn } from "@/lib/utils";

interface ScoreboardProps {
  players: RoomPlayer[];
  scores: Record<string, number>;
  currentDrawerId: string | null;
  correctGuesserIds: string[];
  currentPlayerId: string | null;
  /** Present only when the viewer is the host — also gates whether the detail modal offers a kick option at all. */
  onKick?: (playerId: string) => void;
}

/** The one "who's in this room" list for the whole room lifecycle — pre-game (host crown, reconnecting) and mid-game (drawing/correct-guess, score) alike. Clicking a card opens PlayerDetailModal — that's the kick action's new home, not a button sitting on the row itself. */
export function Scoreboard({
  players,
  scores,
  currentDrawerId,
  correctGuesserIds,
  currentPlayerId,
  onKick,
}: ScoreboardProps) {
  const sorted = [...players].sort(
    (a, b) => (scores[b.playerId] ?? 0) - (scores[a.playerId] ?? 0),
  );
  const [selectedPlayer, setSelectedPlayer] = useState<RoomPlayer | null>(null);

  return (
    <>
      <ul className="flex flex-col gap-2 font-play-body">
        {sorted.map((player) => {
          const isSelf = player.playerId === currentPlayerId;
          const avatar = getAvatarOption(player.avatarId);
          const isDrawingNow = player.playerId === currentDrawerId;
          // The green border IS the "you guessed it" indicator now — a
          // separate checkmark badge on top of that would just be saying
          // the same thing twice.
          const hasGuessed = correctGuesserIds.includes(player.playerId);
          return (
            <li key={player.playerId}>
              <button
                type="button"
                onClick={() => setSelectedPlayer(player)}
                className={cn(
                  // `appearance-none` — without it, a native <button>'s own
                  // platform chrome can bleed through underneath a custom
                  // border/radius instead of cleanly replacing it. Border
                  // and shadow are back at the original 2px/2px weight — a
                  // 3px border with a 3px *hard, unblurred* offset shadow
                  // (shadow-[3px_3px_0_...]) doesn't leave enough of this
                  // card's own rounded corner (rounded-xl) to fully contain
                  // the shadow's own copy of that corner, so the two show
                  // through each other at the bottom-right as a sharp black
                  // wedge instead of a clean curve. 2px/2px on a card this
                  // small doesn't hit that mismatch.
                  "flex w-full appearance-none items-center gap-2 rounded-xl border-2 bg-white px-2.5 py-2 text-left shadow-[.5px_2px_0_var(--color-play-ink)] transition-colors",
                  hasGuessed ? "border-play-green" : "border-play-ink",
                  !player.connected && "opacity-50",
                )}
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-play-ink text-white"
                  style={{ backgroundColor: avatar.color }}
                >
                  <AvatarIcon icon={avatar.icon} size={16} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-play-display text-sm font-bold text-play-ink">
                    {player.name}
                    {isSelf && <span className="text-play-ink/45"> (you)</span>}
                  </span>
                  {!player.connected && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-play-ink/50">
                      <WifiOff className="size-3" /> Reconnecting…
                    </span>
                  )}
                </div>
                {player.isHost && (
                  <Crown
                    className="size-4 shrink-0 text-play-orange"
                    aria-label="Host"
                  />
                )}
                {isDrawingNow && (
                  <Pencil
                    className="size-4 shrink-0 text-play-blue"
                    aria-label="Currently drawing"
                  />
                )}
                <span className="shrink-0 font-play-display text-sm font-bold tabular-nums text-play-ink">
                  {scores[player.playerId] ?? 0}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          onKick={
            onKick && selectedPlayer.playerId !== currentPlayerId
              ? () => {
                  onKick(selectedPlayer.playerId);
                  setSelectedPlayer(null);
                }
              : undefined
          }
        />
      )}
    </>
  );
}
