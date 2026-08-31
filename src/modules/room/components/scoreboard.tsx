"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { KeyRound, Pencil, WifiOff } from "lucide-react";
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

/** The one "who's in this room" list for the whole room lifecycle — pre-game (host badge, reconnecting) and mid-game (drawing/correct-guess, score) alike. Clicking a card opens PlayerDetailModal — that's the kick action's new home, not a button sitting on the row itself. */
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
          // The whole card turns orange for "you guessed it this round" —
          // a border color alone was too easy to miss at a glance, this
          // reads immediately across the whole row.
          const hasGuessed = correctGuesserIds.includes(player.playerId);
          return (
            // `layout` is what animates the row sliding to its new spot
            // when someone's score overtakes another's re-sorts `sorted`
            // — a plain re-render would otherwise just snap rows into
            // their new DOM position with no visible motion at all.
            <motion.li key={player.playerId} layout transition={{ type: "spring", stiffness: 380, damping: 32 }}>
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
                  "flex w-full appearance-none items-center gap-2 rounded-xl border-2 border-play-ink px-2.5 py-2 text-left shadow-[.5px_2px_0_var(--color-play-ink)] transition-colors",
                  hasGuessed ? "bg-play-orange" : "bg-white",
                  !player.connected && "opacity-50",
                )}
              >
                {/* Bigger now specifically so the host/drawer badges have
                    room to sit ON the avatar itself (corner overlays)
                    instead of floating as separate row icons — a crown
                    read as "winner" to players, not "room host", so host
                    gets its own distinct badge (a key, not a crown) and
                    drawer keeps its pencil, just restyled to match. */}
                <span className="relative flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-play-ink" style={{ backgroundColor: avatar.color }}>
                  <AvatarIcon icon={avatar.icon} color={avatar.color} size={28} />
                  {player.isHost && (
                    <span
                      className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full border-2 border-white bg-play-orange"
                      aria-label="Host"
                    >
                      <KeyRound className="size-2.5 text-white" strokeWidth={3} />
                    </span>
                  )}
                  {isDrawingNow && (
                    <span
                      className="absolute -right-1.5 -bottom-1.5 flex size-5 items-center justify-center rounded-full border-2 border-white bg-play-blue"
                      aria-label="Currently drawing"
                    >
                      <Pencil className="size-2.5 text-white" strokeWidth={3} />
                    </span>
                  )}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span
                    className={cn(
                      "truncate font-play-display text-sm font-bold",
                      hasGuessed ? "text-white" : "text-play-ink",
                    )}
                  >
                    {player.name}
                    {isSelf && <span className={hasGuessed ? "text-white/70" : "text-play-ink/45"}> (Me)</span>}
                  </span>
                  {!player.connected && (
                    <span
                      className={cn(
                        "flex items-center gap-1 text-[11px] font-bold",
                        hasGuessed ? "text-white/80" : "text-play-ink/50",
                      )}
                    >
                      <WifiOff className="size-3" /> Reconnecting…
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "shrink-0 font-play-display text-sm font-bold tabular-nums",
                    hasGuessed ? "text-white" : "text-play-ink",
                  )}
                >
                  {scores[player.playerId] ?? 0}
                </span>
              </button>
            </motion.li>
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
