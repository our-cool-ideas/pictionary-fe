"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Globe2,
  Loader2,
  Lock,
  Shapes,
  Sparkles,
} from "lucide-react";
import { usePublicCategories } from "@/modules/player/hooks/use-public-categories";
import { useRoomSession } from "@/modules/room/context/use-room-session";
import { usePlayerIdentity } from "@/hooks/use-player-identity";
import { CategoryIcon } from "@/modules/player/components/category-icon";
import { ROOM_VISIBILITY } from "@/lib/enums/room-visibility.enum";
import { PRESS_CLASS, cn, pressStyle } from "@/lib/utils";
import type { PublicCategory } from "@/modules/player/types/category.type";

// Sent as the room's targetScore (see room.validation.ts) — the game
// resets and starts a fresh round the instant someone reaches it.
const POINT_OPTIONS = [50, 100, 150, 200, 250] as const;
const DEFAULT_POINTS = 100;

// Four big boxes per page, same reasoning as AvatarPicker's carousel — the
// category list keeps growing, and a tiny icon-only button with a hover
// tooltip doesn't scale or read well once there are more than a handful.
const CATEGORY_PAGE_SIZE = 4;

// Shared selected/unselected treatment for every toggle-style pick in
// this strip (Public/Private, category cards) — orange+lift+shadow for
// the active choice (this app's usual "this is the one that's on" CTA
// color, see the Start/Create buttons elsewhere), solid yellow for
// everything not picked, rather than the old translucent-white-on-blue
// look, which read as more "disabled" than "an alternative you could
// pick instead."
function toggleButtonClass(selected: boolean): string {
  return selected
    ? "-translate-y-0.5 border-[2.5px] border-play-ink bg-play-orange text-white shadow-[2.5px_2.5px_0_var(--color-play-ink)]"
    : "border-[2.5px] border-play-ink bg-white text-play-ink";
}

/** The "start a room" bar at the top of the Rooms page. */
export function QuickCreateStrip() {
  const router = useRouter();
  const { playerName, avatarId } = usePlayerIdentity();
  const { data: categoriesData } = usePublicCategories();
  const {
    actions: { createRoom },
  } = useRoomSession();

  const categories = categoriesData?.categories ?? [];
  const categoryPageCount = Math.max(
    1,
    Math.ceil(categories.length / CATEGORY_PAGE_SIZE),
  );
  const [categoryPage, setCategoryPage] = useState(0);
  // Nullable, explicit-choice-only state — the actual selected category is
  // derived below, so there's no "sync state to the async categories
  // response" effect needed (the first category is used until the player
  // clicks a different one, and once they do, that choice sticks).
  const [chosenCategoryId, setChosenCategoryId] = useState<string | null>(null);
  const categoryId = chosenCategoryId ?? categories[0]?.id ?? null;
  // Grouped into whole pages up front (instead of slicing just the
  // current one), same reasoning as AvatarPicker's `pages` — the sliding
  // track below needs every page mounted side by side to have something
  // to slide FROM and TO; swapping a single slice's contents can only
  // ever hard-cut, never slide.
  const categoryPages: PublicCategory[][] = [];
  for (let i = 0; i < categoryPageCount; i++)
    categoryPages.push(
      categories.slice(
        i * CATEGORY_PAGE_SIZE,
        i * CATEGORY_PAGE_SIZE + CATEGORY_PAGE_SIZE,
      ),
    );

  const [visibility, setVisibility] = useState<ROOM_VISIBILITY>(
    ROOM_VISIBILITY.PUBLIC,
  );
  const [targetScore, setTargetScore] = useState<number>(DEFAULT_POINTS);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!categoryId) return;
    setError(null);
    setCreating(true);
    const result = await createRoom({
      name: playerName.trim(),
      categoryId,
      visibility,
      avatarId,
      targetScore,
    });
    setCreating(false);
    if (!result.ok || !result.code) {
      setError(result.message);
      return;
    }
    router.push(`/room/${result.code}`);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-3 rounded-[20px] border-[3px] border-play-ink bg-play-blue p-3.5 shadow-[5px_5px_0_var(--color-play-ink)]">
        {/* Both lines share this one grid instead of being two independent
            flex rows — a plain `auto` column takes the widest content
            placed in it across EVERY row of the grid, so "Choose a
            Category" (row 2's label, wider than "Start a Room") is what
            actually sets column 1's width, and row 1's shorter label just
            gets left-aligned within that same width. That's what lines
            the category carousel's controls up under the Public/Private
            buttons above, instead of guessing at a fixed px offset. */}
        <div className="grid grid-cols-[auto_auto_1fr] items-center gap-x-3 gap-y-3">
          {/* Row 1 — visibility (labeled, not icon-only) + how many points
              a round runs to. */}
          <div className="flex shrink-0 items-center gap-2">
            <Sparkles className="size-[18px] text-white" strokeWidth={2.2} />
            <span className="font-play-display text-[15px] font-bold whitespace-nowrap text-white">
              Start a Room
            </span>
          </div>

          <div className="hidden h-8 w-0.5 shrink-0 bg-white/30 sm:block" />

          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                aria-pressed={visibility === ROOM_VISIBILITY.PUBLIC}
                onClick={() => setVisibility(ROOM_VISIBILITY.PUBLIC)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-2 font-play-display text-xs font-bold transition-transform",
                  toggleButtonClass(visibility === ROOM_VISIBILITY.PUBLIC),
                )}
              >
                <Globe2 className="size-4" strokeWidth={2.2} />
                Public
              </button>
              <button
                type="button"
                aria-pressed={visibility === ROOM_VISIBILITY.PRIVATE}
                onClick={() => setVisibility(ROOM_VISIBILITY.PRIVATE)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-2 font-play-display text-xs font-bold transition-transform",
                  toggleButtonClass(visibility === ROOM_VISIBILITY.PRIVATE),
                )}
              >
                <Lock className="size-4" strokeWidth={2.2} />
                Private
              </button>
            </div>

            <div className="hidden h-8 w-0.5 shrink-0 bg-white/30 sm:block" />

            <label className="flex shrink-0 items-center gap-1.5">
              <span className="font-play-display text-[11px] font-bold tracking-wide text-white/70 uppercase">
                Round ends at
              </span>
              <select
                value={targetScore}
                onChange={(e) => setTargetScore(Number(e.target.value))}
                className="rounded-xl border-[2.5px] border-play-ink bg-play-orange px-2.5 py-2 font-play-display text-xs font-bold text-white outline-none"
              >
                {POINT_OPTIONS.map((points) => (
                  <option key={points} value={points}>
                    {points} pts
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Row 2 — category carousel: big labeled boxes instead of a row
              of tiny icon buttons, sliding a page at a time instead of
              hard-cutting (same track/viewport technique as AvatarPicker —
              see its own comments for why a plain slice-swap can't slide). */}
          <div className="flex shrink-0 items-center gap-2">
            <Shapes className="size-[18px] text-white" strokeWidth={2.2} />
            <span className="font-play-display text-[15px] font-bold whitespace-nowrap text-white">
              Choose a Category
            </span>
          </div>

          <div className="hidden h-8 w-0.5 shrink-0 bg-white/30 sm:block" />

          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              aria-label="Previous categories"
              disabled={categoryPage === 0}
              onClick={() => setCategoryPage((p) => p - 1)}
              className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-white/50 bg-white/20 text-white disabled:opacity-30"
            >
              <ChevronLeft className="size-4" strokeWidth={2.5} />
            </button>

            {/* The viewport — clips everything outside the current page's
                width, exactly like AvatarPicker's own carousel window. A
                small top pad gives the selected card's `-translate-y-0.5`
                lift room to clear this box's edge without being clipped
                (see AvatarPicker's identical note on its checkmark badge)
                — left off the right/bottom, since nothing overhangs
                there and padding on the sliding axis would let the next
                page's edge peek through instead (also see AvatarPicker). */}
            <div className="min-w-0 flex-1 overflow-hidden pt-1">
              <div
                className="flex transition-transform duration-[450ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                style={{
                  width: `${categoryPageCount * 100}%`,
                  transform: `translateX(-${(categoryPage * 100) / categoryPageCount}%)`,
                }}
              >
                {categoryPages.map((items, i) => (
                  <div
                    key={i}
                    className="grid shrink-0 grid-cols-4 gap-2"
                    style={{ width: `${100 / categoryPageCount}%` }}
                  >
                    {items.map((category) => {
                      const selected = category.id === categoryId;
                      return (
                        <button
                          key={category.id}
                          type="button"
                          aria-pressed={selected}
                          tabIndex={i === categoryPage ? 0 : -1}
                          onClick={() => setChosenCategoryId(category.id)}
                          className={cn(
                            "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 transition-transform",
                            toggleButtonClass(selected),
                          )}
                        >
                          <CategoryIcon
                            name={category.name}
                            className={cn(
                              "size-6",
                              selected ? "text-white" : "text-play-ink",
                            )}
                          />
                          <span
                            className={cn(
                              "max-w-full truncate font-play-display text-[11px] font-bold",
                              selected ? "text-white" : "text-play-ink",
                            )}
                          >
                            {category.name}
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
              aria-label="Next categories"
              disabled={categoryPage >= categoryPageCount - 1}
              onClick={() => setCategoryPage((p) => p + 1)}
              className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-white/50 bg-white/20 text-white disabled:opacity-30"
            >
              <ChevronRight className="size-4" strokeWidth={2.5} />
            </button>

            <button
              type="button"
              disabled={!categoryId || creating}
              onClick={handleCreate}
              style={pressStyle(3)}
              className={cn(
                "ml-1 flex shrink-0 items-center gap-1.5 rounded-2xl border-[2.5px] border-play-ink bg-play-orange px-5 py-2.5 font-play-display text-sm font-bold text-white shadow-[3px_3px_0_var(--color-play-ink)] disabled:cursor-not-allowed disabled:opacity-60",
                PRESS_CLASS,
              )}
            >
              {creating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Create"
              )}
            </button>
          </div>
        </div>

        {categoryPageCount > 1 && (
          <div className="-mt-1 flex justify-center gap-1.5">
            {Array.from({ length: categoryPageCount }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to category page ${i + 1}`}
                onClick={() => setCategoryPage(i)}
                className={cn(
                  "size-1.5 rounded-full transition-colors",
                  i === categoryPage ? "bg-white" : "bg-white/30",
                )}
              />
            ))}
          </div>
        )}
      </div>
      {error && (
        <p className="font-play-body text-xs font-bold text-red-600">{error}</p>
      )}
    </div>
  );
}
