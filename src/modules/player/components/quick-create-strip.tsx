"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Globe2, Loader2, Lock, Sparkles } from "lucide-react";
import { usePublicCategories } from "@/modules/player/hooks/use-public-categories";
import { useRoomSession } from "@/modules/room/context/use-room-session";
import { usePlayerIdentity } from "@/hooks/use-player-identity";
import { ROOM_VISIBILITY } from "@/lib/enums/room-visibility.enum";
import { cn } from "@/lib/utils";

// Sent as the room's targetScore (see room.validation.ts) — the game
// resets and starts a fresh round the instant someone reaches it.
const POINT_OPTIONS = [50, 100, 150, 200, 250] as const;
const DEFAULT_POINTS = 100;

// Four big boxes per page, same reasoning as AvatarPicker's carousel — the
// category list keeps growing, and a tiny icon-only button with a hover
// tooltip doesn't scale or read well once there are more than a handful.
const CATEGORY_PAGE_SIZE = 4;

/** The "start a room" bar at the top of the Rooms page. */
export function QuickCreateStrip() {
  const router = useRouter();
  const { playerName, avatarId } = usePlayerIdentity();
  const { data: categoriesData } = usePublicCategories();
  const {
    actions: { createRoom },
  } = useRoomSession();

  const categories = categoriesData?.categories ?? [];
  const categoryPageCount = Math.max(1, Math.ceil(categories.length / CATEGORY_PAGE_SIZE));
  const [categoryPage, setCategoryPage] = useState(0);
  // Nullable, explicit-choice-only state — the actual selected category is
  // derived below, so there's no "sync state to the async categories
  // response" effect needed (the first category is used until the player
  // clicks a different one, and once they do, that choice sticks).
  const [chosenCategoryId, setChosenCategoryId] = useState<string | null>(null);
  const categoryId = chosenCategoryId ?? categories[0]?.id ?? null;
  const categoryPageItems = categories.slice(categoryPage * CATEGORY_PAGE_SIZE, categoryPage * CATEGORY_PAGE_SIZE + CATEGORY_PAGE_SIZE);

  const [visibility, setVisibility] = useState<ROOM_VISIBILITY>(ROOM_VISIBILITY.PUBLIC);
  const [targetScore, setTargetScore] = useState<number>(DEFAULT_POINTS);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!categoryId) return;
    setError(null);
    setCreating(true);
    const result = await createRoom({ name: playerName.trim(), categoryId, visibility, avatarId, targetScore });
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
        {/* Line 1 — visibility (labeled, not icon-only) + how many points
            a round runs to. */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex shrink-0 items-center gap-2">
            <Sparkles className="size-[18px] text-white" strokeWidth={2.2} />
            <span className="font-play-display text-[15px] font-bold whitespace-nowrap text-white">Start a Room</span>
          </div>

          <div className="hidden h-8 w-0.5 shrink-0 bg-white/30 sm:block" />

          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              aria-pressed={visibility === ROOM_VISIBILITY.PUBLIC}
              onClick={() => setVisibility(ROOM_VISIBILITY.PUBLIC)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-2 font-play-display text-xs font-bold transition-transform",
                visibility === ROOM_VISIBILITY.PUBLIC
                  ? "-translate-y-0.5 border-[2.5px] border-play-ink bg-white text-play-ink shadow-[2.5px_2.5px_0_var(--color-play-ink)]"
                  : "border-[2.5px] border-white/50 bg-white/20 text-white",
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
                visibility === ROOM_VISIBILITY.PRIVATE
                  ? "-translate-y-0.5 border-[2.5px] border-play-ink bg-white text-play-ink shadow-[2.5px_2.5px_0_var(--color-play-ink)]"
                  : "border-[2.5px] border-white/50 bg-white/20 text-white",
              )}
            >
              <Lock className="size-4" strokeWidth={2.2} />
              Private
            </button>
          </div>

          <div className="hidden h-8 w-0.5 shrink-0 bg-white/30 sm:block" />

          <label className="flex shrink-0 items-center gap-1.5">
            <span className="font-play-display text-[11px] font-bold tracking-wide text-white/70 uppercase">Round ends at</span>
            <select
              value={targetScore}
              onChange={(e) => setTargetScore(Number(e.target.value))}
              className="rounded-xl border-[2.5px] border-play-ink bg-white px-2.5 py-2 font-play-display text-xs font-bold text-play-ink outline-none"
            >
              {POINT_OPTIONS.map((points) => (
                <option key={points} value={points}>
                  {points} pts
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Line 2 — category carousel: big labeled boxes instead of a row
            of tiny icon buttons, with arrows to page through as the
            category list grows rather than everything shrinking to fit. */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous categories"
            disabled={categoryPage === 0}
            onClick={() => setCategoryPage((p) => p - 1)}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-white/50 bg-white/20 text-white disabled:opacity-30"
          >
            <ChevronLeft className="size-4" strokeWidth={2.5} />
          </button>

          <div className="grid flex-1 grid-cols-4 gap-2">
            {categoryPageItems.map((category) => {
              const selected = category.id === categoryId;
              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setChosenCategoryId(category.id)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 transition-transform",
                    selected
                      ? "-translate-y-0.5 border-[2.5px] border-play-ink bg-white shadow-[3px_3px_0_var(--color-play-ink)]"
                      : "border-[2.5px] border-white/50 bg-white/20",
                  )}
                >
                  <span className="text-2xl">{category.icon || "🎨"}</span>
                  <span className={cn("max-w-full truncate font-play-display text-[11px] font-bold", selected ? "text-play-ink" : "text-white")}>{category.name}</span>
                </button>
              );
            })}
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
            className="ml-1 flex shrink-0 items-center gap-1.5 rounded-2xl border-[2.5px] border-play-ink bg-play-orange px-5 py-2.5 font-play-display text-sm font-bold text-white shadow-[3px_3px_0_var(--color-play-ink)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? <Loader2 className="size-4 animate-spin" /> : "Create"}
          </button>
        </div>

        {categoryPageCount > 1 && (
          <div className="-mt-1 flex justify-center gap-1.5">
            {Array.from({ length: categoryPageCount }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to category page ${i + 1}`}
                onClick={() => setCategoryPage(i)}
                className={cn("size-1.5 rounded-full transition-colors", i === categoryPage ? "bg-white" : "bg-white/30")}
              />
            ))}
          </div>
        )}
      </div>
      {error && <p className="font-play-body text-xs font-bold text-red-600">{error}</p>}
    </div>
  );
}
