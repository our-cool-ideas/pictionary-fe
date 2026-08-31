"use client";

import { useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { AVATAR_OPTIONS } from "@/modules/player/constants/avatar.constant";
import { AvatarIcon } from "@/modules/player/components/avatar-icon";
import { usePlayerIdentity } from "@/hooks/use-player-identity";
import { cn } from "@/lib/utils";

// Four big circles per page rather than shrinking all ten (or the old
// six) down to fit one row — the characters have real facial detail now
// (see AvatarIcon), which only reads at a decent size. Arrows page
// through instead of the row overflowing or wrapping inside the card.
const PAGE_SIZE = 4;
const PAGE_COUNT = Math.ceil(AVATAR_OPTIONS.length / PAGE_SIZE);

export function AvatarPicker() {
  const { avatarId, setAvatarId } = usePlayerIdentity();
  const [page, setPage] = useState(0);

  const pageItems = AVATAR_OPTIONS.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="flex flex-col gap-2">
      <label className="font-play-display text-xs font-semibold tracking-wide text-play-ink uppercase">Pick an avatar</label>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Previous avatars"
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
          className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-play-ink bg-white text-play-ink disabled:opacity-30"
        >
          <ChevronLeft className="size-4" strokeWidth={2.5} />
        </button>

        <div className="grid flex-1 grid-cols-4 gap-2">
          {pageItems.map((avatar) => {
            const selected = avatar.id === avatarId;
            return (
              <button
                key={avatar.id}
                type="button"
                aria-label={avatar.label}
                aria-pressed={selected}
                onClick={() => setAvatarId(avatar.id)}
                className="relative cursor-pointer justify-self-center"
              >
                <span
                  className={cn(
                    "flex size-16 items-center justify-center rounded-full transition-transform",
                    selected ? "-translate-y-0.5 border-[3px] border-play-ink shadow-[2px_2px_0_var(--color-play-ink)]" : "border-[3px] border-black/10",
                  )}
                  style={{ backgroundColor: avatar.color }}
                >
                  <AvatarIcon icon={avatar.icon} color={avatar.color} size={40} />
                </span>
                {selected && (
                  <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-white bg-play-ink">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          aria-label="Next avatars"
          disabled={page === PAGE_COUNT - 1}
          onClick={() => setPage((p) => p + 1)}
          className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-play-ink bg-white text-play-ink disabled:opacity-30"
        >
          <ChevronRight className="size-4" strokeWidth={2.5} />
        </button>
      </div>

      {PAGE_COUNT > 1 && (
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: PAGE_COUNT }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to avatar page ${i + 1}`}
              onClick={() => setPage(i)}
              className={cn("size-1.5 rounded-full transition-colors", i === page ? "bg-play-ink" : "bg-play-ink/20")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
