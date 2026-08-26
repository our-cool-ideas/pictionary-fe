"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe2, Loader2, Lock, Sparkles } from "lucide-react";
import { usePublicCategories } from "@/modules/player/hooks/use-public-categories";
import { useRoomSession } from "@/modules/room/context/use-room-session";
import { usePlayerIdentity } from "@/hooks/use-player-identity";
import { ROOM_VISIBILITY } from "@/lib/enums/room-visibility.enum";
import { cn } from "@/lib/utils";

/** The compact "start a room" bar at the top of the Rooms page — the full category/visibility/name ceremony now lives one screen back on the sign-in page, so this is deliberately a single row, not a panel. */
export function QuickCreateStrip() {
  const router = useRouter();
  const { playerName, avatarId } = usePlayerIdentity();
  const { data: categoriesData } = usePublicCategories();
  const {
    actions: { createRoom },
  } = useRoomSession();

  const categories = categoriesData?.categories ?? [];
  // Nullable, explicit-choice-only state — the actual selected category is
  // derived below, so there's no "sync state to the async categories
  // response" effect needed (the first category is used until the player
  // clicks a different one, and once they do, that choice sticks).
  const [chosenCategoryId, setChosenCategoryId] = useState<string | null>(null);
  const categoryId = chosenCategoryId ?? categories[0]?.id ?? null;
  const [visibility, setVisibility] = useState<ROOM_VISIBILITY>(ROOM_VISIBILITY.PUBLIC);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!categoryId) return;
    setError(null);
    setCreating(true);
    const result = await createRoom({ name: playerName.trim(), categoryId, visibility, avatarId });
    setCreating(false);
    if (!result.ok || !result.code) {
      setError(result.message);
      return;
    }
    router.push(`/room/${result.code}`);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-4 rounded-[20px] border-[3px] border-play-ink bg-play-blue p-3.5 shadow-[5px_5px_0_var(--color-play-ink)]">
        <div className="flex shrink-0 items-center gap-2">
          <Sparkles className="size-[18px] text-white" strokeWidth={2.2} />
          <span className="font-play-display text-[15px] font-bold whitespace-nowrap text-white">Start a Room</span>
        </div>

        <div className="hidden h-8 w-0.5 shrink-0 bg-white/30 sm:block" />

        <div className="flex shrink-0 gap-2">
          {categories.map((category) => {
            const selected = category.id === categoryId;
            return (
              <button
                key={category.id}
                type="button"
                title={category.name}
                aria-pressed={selected}
                onClick={() => setChosenCategoryId(category.id)}
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl text-xl transition-transform",
                  selected
                    ? "-translate-y-0.5 border-[2.5px] border-play-ink bg-white shadow-[2.5px_2.5px_0_var(--color-play-ink)]"
                    : "border-[2.5px] border-white/50 bg-white/20",
                )}
              >
                {category.icon || "🎨"}
              </button>
            );
          })}
        </div>

        <div className="hidden h-8 w-0.5 shrink-0 bg-white/30 sm:block" />

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            title="Public"
            aria-pressed={visibility === ROOM_VISIBILITY.PUBLIC}
            onClick={() => setVisibility(ROOM_VISIBILITY.PUBLIC)}
            className={cn(
              "flex size-10 items-center justify-center rounded-xl transition-transform",
              visibility === ROOM_VISIBILITY.PUBLIC
                ? "-translate-y-0.5 border-[2.5px] border-play-ink bg-white text-play-ink shadow-[2.5px_2.5px_0_var(--color-play-ink)]"
                : "border-[2.5px] border-white/50 bg-white/20 text-white",
            )}
          >
            <Globe2 className="size-4" strokeWidth={2.2} />
          </button>
          <button
            type="button"
            title="Private"
            aria-pressed={visibility === ROOM_VISIBILITY.PRIVATE}
            onClick={() => setVisibility(ROOM_VISIBILITY.PRIVATE)}
            className={cn(
              "flex size-10 items-center justify-center rounded-xl transition-transform",
              visibility === ROOM_VISIBILITY.PRIVATE
                ? "-translate-y-0.5 border-[2.5px] border-play-ink bg-white text-play-ink shadow-[2.5px_2.5px_0_var(--color-play-ink)]"
                : "border-[2.5px] border-white/50 bg-white/20 text-white",
            )}
          >
            <Lock className="size-4" strokeWidth={2.2} />
          </button>
        </div>

        <button
          type="button"
          disabled={!categoryId || creating}
          onClick={handleCreate}
          className="ml-auto flex shrink-0 items-center gap-1.5 rounded-2xl border-[2.5px] border-play-ink bg-play-orange px-5 py-2.5 font-play-display text-sm font-bold text-white shadow-[3px_3px_0_var(--color-play-ink)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {creating ? <Loader2 className="size-4 animate-spin" /> : "Create"}
        </button>
      </div>
      {error && <p className="font-play-body text-xs font-bold text-red-600">{error}</p>}
    </div>
  );
}
