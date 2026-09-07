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
  // Which avatarId `page` was last computed for — used only to notice
  // when avatarId has moved out from under it (a stored avatar loading
  // in from localStorage after the initial unhydrated render, or just
  // picking a different avatar) and jump `page` to match, same
  // "adjust state during render" idiom as canvas-board.tsx's turnKey.
  // Without this, `page` stays hard-coded at its initial 0 forever: a
  // returning guest whose saved avatar lives on page 2 would refresh
  // into a picker showing page 0, with no visible checkmark anywhere
  // on screen even though an avatar genuinely is selected. Comparing
  // avatarId here (rather than syncing off `isHydrated`) also means a
  // manual Prev/Next click is never fought — the click changes `page`
  // directly without touching avatarId, so this check stays a no-op
  // until the selection itself actually changes.
  const [syncedAvatarId, setSyncedAvatarId] = useState<string | null>(null);
  if (avatarId !== syncedAvatarId) {
    const index = AVATAR_OPTIONS.findIndex((a) => a.id === avatarId);
    if (index >= 0) setPage(Math.floor(index / PAGE_SIZE));
    setSyncedAvatarId(avatarId);
  }

  // Grouped into whole pages up front (instead of slicing just the
  // current one) — the sliding track below needs every page mounted
  // side by side at all times so it has something to slide FROM and TO;
  // swapping a single slice's contents can only ever hard-cut, never
  // slide.
  const pages: typeof AVATAR_OPTIONS[] = [];
  for (let i = 0; i < PAGE_COUNT; i++) pages.push(AVATAR_OPTIONS.slice(i * PAGE_SIZE, i * PAGE_SIZE + PAGE_SIZE));

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

        {/* The viewport — clips everything outside the current page's
            width, exactly like a real carousel window, so the track
            below is free to always be PAGE_COUNT pages wide. Only
            `pt-1.5` lives here (clip clearance for the selected-badge's
            top overhang, same reasoning as below) — a matching `pr-1.5`
            used to sit here too, but padding widens this box's own clip
            region past the true page boundary along the SAME axis the
            track slides on, which let a sliver of the next page's
            leftmost avatar peek through next to the arrow button. The
            right-side clearance moved down onto each page's own grid
            below instead, which insets the avatars away from that exact
            boundary rather than pushing the boundary itself outward. */}
        <div className="flex-1 overflow-hidden pt-1.5">
          {/* The track — every page laid out side by side (`flex`, each
              child pinned to one PAGE_COUNT-th of the track's own
              width), then shoved left by `page` page-widths via
              `translateX`. A plain instant slice-swap (what this used to
              be) can only hard-cut between pages; sliding the whole
              strip is what actually reads as a carousel. The
              back-out-flavored cubic-bezier (small overshoot past 100%
              before settling) is the "gamify" bounce — a plain
              ease/ease-in-out here would slide smoothly but land dead
              flat, which is exactly the flatness this was meant to fix. */}
          <div
            className="flex transition-transform duration-[450ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{ width: `${PAGE_COUNT * 100}%`, transform: `translateX(-${(page * 100) / PAGE_COUNT}%)` }}
          >
            {pages.map((items, i) => (
              // Fluid `minmax(0,1fr)` columns (Tailwind's plain
              // `grid-cols-4`) — a FIXED avatar size here (whether the old
              // `size-16` or a later attempt at fixed-width columns) only
              // ever fits the one container width it was tuned for; any
              // narrower one (a phone, or a card sized for a shorter form
              // like JoinRoomForm) either overlaps the fixed circles into
              // each other or clips them outright. Sizing the circle
              // itself as a fraction of its own fluid cell instead (see
              // the aspect-square span below) means this always fits
              // exactly 4 across, at whatever size the container actually
              // has — capped at 4rem (`max-w-16`) so it doesn't grow past
              // the original design size on a roomy container either.
              <div key={i} className="grid shrink-0 grid-cols-4 gap-2 pr-1.5" style={{ width: `${100 / PAGE_COUNT}%` }}>
                {items.map((avatar) => {
                  const selected = avatar.id === avatarId;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      aria-label={avatar.label}
                      aria-pressed={selected}
                      // Only the current page's buttons are reachable by
                      // keyboard/AT — the ones sitting off-screen in an
                      // adjacent, clipped page would otherwise still be
                      // tabbable, which reads as invisible dead stops.
                      tabIndex={i === page ? 0 : -1}
                      onClick={() => setAvatarId(avatar.id)}
                      className="flex w-full cursor-pointer items-center justify-center"
                    >
                      {/* This wrapper (not the button) is what the
                          selected-checkmark badge below anchors to — it's
                          exactly the circle's own box (capped aspect-square
                          width) even when the button itself is wider than
                          that cap on a roomy grid cell, so the badge stays
                          glued to the circle's corner instead of drifting
                          off toward the button's own, wider corner. */}
                      <span className="relative aspect-square w-full max-w-16">
                        <span
                          className={cn(
                            "flex size-full items-center justify-center overflow-hidden rounded-full transition-transform",
                            selected ? "-translate-y-0.5 border-[3px] border-play-ink shadow-[2px_2px_0_var(--color-play-ink)]" : "border-[3px] border-black/10",
                          )}
                          style={{ backgroundColor: avatar.color }}
                        >
                          <AvatarIcon icon={avatar.icon} color={avatar.color} className="h-[85%] w-[85%]" />
                        </span>
                        {selected && (
                          <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full border-2 border-white bg-play-ink">
                            <Check className="size-3" strokeWidth={3} />
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
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
