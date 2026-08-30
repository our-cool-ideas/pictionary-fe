"use client";

import { LogOut, X } from "lucide-react";
import { getAvatarOption } from "@/modules/player/constants/avatar.constant";
import { AvatarIcon } from "@/modules/player/components/avatar-icon";
import type { RoomPlayer } from "@/modules/room/types/room.type";

interface PlayerDetailModalProps {
  player: RoomPlayer;
  onClose: () => void;
  /** Present only when the viewer is the host looking at someone else's
   * card — Scoreboard is what decides that, not this component. */
  onKick?: () => void;
}

/**
 * Replaces the old always-visible per-row kick (✕) button — clicking a
 * player's card now opens this instead, showing just what there actually
 * is to show about another player (name, avatar) plus the one action
 * (kick) that used to sit right on the row. Same overlay treatment as
 * the turn-start word reveal used to have (`play-modal-pop`), since this
 * is the same kind of "a plain custom overlay, not shadcn's Dialog"
 * gamified popup as the rest of the player-app screens.
 */
export function PlayerDetailModal({ player, onClose, onKick }: PlayerDetailModalProps) {
  const avatar = getAvatarOption(player.avatarId);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-play-ink/60 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "play-modal-pop 0.3s ease-out" }}
        className="relative flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl border-[3px] border-play-ink bg-white p-7 text-center shadow-[8px_8px_0_var(--color-play-ink)]"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-full border-2 border-play-ink bg-white text-play-ink"
        >
          <X className="size-3.5" />
        </button>

        <span
          className="flex size-16 items-center justify-center rounded-full border-[3px] border-play-ink text-white"
          style={{ backgroundColor: avatar.color }}
        >
          <AvatarIcon icon={avatar.icon} size={30} />
        </span>
        <p className="font-play-display text-lg font-bold text-play-ink">{player.name}</p>

        {onKick && (
          <button
            type="button"
            onClick={onKick}
            className="mt-1 flex items-center gap-1.5 rounded-xl border-2 border-play-ink bg-red-500 px-5 py-2 font-play-display text-sm font-bold text-white shadow-[2px_2px_0_var(--color-play-ink)]"
          >
            <LogOut className="size-4" />
            Kick {player.name}
          </button>
        )}
      </div>
    </div>
  );
}
