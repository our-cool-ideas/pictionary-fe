"use client";

import { Crown, WifiOff, X } from "lucide-react";
import { getAvatarOption } from "@/modules/player/constants/avatar.constant";
import { AvatarIcon } from "@/modules/player/components/avatar-icon";
import type { RoomPlayer } from "@/modules/room/types/room.type";
import { cn } from "@/lib/utils";

interface ScoreboardProps {
  players: RoomPlayer[];
  scores: Record<string, number>;
  currentDrawerId: string | null;
  correctGuesserIds: string[];
  currentPlayerId: string | null;
  /** Present only when the viewer is the host — also gates whether kick buttons render at all. */
  onKick?: (playerId: string) => void;
}

/** The one "who's in this room" list for the whole room lifecycle — pre-game (host crown, kick, reconnecting) and mid-game (drawing/correct-guess badges, score) alike. */
export function Scoreboard({ players, scores, currentDrawerId, correctGuesserIds, currentPlayerId, onKick }: ScoreboardProps) {
  const sorted = [...players].sort((a, b) => (scores[b.playerId] ?? 0) - (scores[a.playerId] ?? 0));

  return (
    <ul className="flex flex-col gap-2 font-play-body">
      {sorted.map((player) => {
        const isSelf = player.playerId === currentPlayerId;
        const avatar = getAvatarOption(player.avatarId);
        const isDrawingNow = player.playerId === currentDrawerId;
        return (
          <li
            key={player.playerId}
            className={cn(
              "flex items-center gap-2 rounded-xl border-2 border-play-ink bg-white px-2.5 py-2 shadow-[2px_2px_0_var(--color-play-ink)]",
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
            {player.isHost && <Crown className="size-4 shrink-0 text-play-orange" aria-label="Host" />}
            {isDrawingNow && (
              <span className="shrink-0 rounded-full border-2 border-play-ink bg-play-blue px-2 py-0.5 font-play-display text-[10px] font-bold text-white">
                Drawing
              </span>
            )}
            {correctGuesserIds.includes(player.playerId) && (
              <span className="shrink-0 rounded-full border-2 border-play-ink bg-play-green px-1.5 py-0.5 font-play-display text-[10px] font-bold text-white">
                ✓
              </span>
            )}
            <span className="shrink-0 font-play-display text-sm font-bold tabular-nums text-play-ink">{scores[player.playerId] ?? 0}</span>
            {onKick && !isSelf && (
              <button
                type="button"
                aria-label={`Kick ${player.name}`}
                onClick={() => onKick(player.playerId)}
                className="flex size-6 shrink-0 items-center justify-center rounded-full text-play-ink/40 hover:text-red-500"
              >
                <X className="size-3.5" />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
