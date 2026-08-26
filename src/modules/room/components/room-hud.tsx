"use client";

import { useState } from "react";
import { Check, Copy, Globe2, Loader2, Lock, Play } from "lucide-react";
import { usePublicCategories } from "@/modules/player/hooks/use-public-categories";
import { useRoomSession } from "@/modules/room/context/use-room-session";
import { useSocket } from "@/hooks/use-socket";
import { ROOM_VISIBILITY } from "@/lib/enums/room-visibility.enum";
import { cn } from "@/lib/utils";

/**
 * The compact "room metadata" card — sits atop the scrollable members list
 * in the right column (see GameBoard). Room code/category/visibility stay
 * constant; the copy-link control is always available; the bit under it
 * swaps between pre-game controls (host-only Start), a plain "who's
 * drawing" label while a turn is active, and the between-turns reveal.
 * Neither the active word nor the countdown live here anymore — the word
 * is TurnWordModal's job, the countdown is TurnProgressBar's, drawn over
 * the canvas instead.
 */
export function RoomHud() {
  const { playerId } = useSocket();
  const {
    state,
    actions: { startGame },
  } = useRoomSession();
  const { data: categoriesData } = usePublicCategories();
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const room = state.room;
  if (!room) return null;

  const isHost = room.hostPlayerId === playerId;
  const category = categoriesData?.categories.find((c) => c.id === room.settings.categoryId);
  const isPrivate = room.settings.visibility === ROOM_VISIBILITY.PRIVATE;
  const canStart = room.players.filter((p) => p.connected).length >= 2;
  const gameStarted = state.currentTurn !== null || state.lastTurnResult !== null;
  const isDrawer = state.currentTurn?.drawerId === playerId;
  // Captured as a primitive rather than referencing `room` inside the
  // closure below — TS can't carry the `state.room` null-check's narrowing
  // into a nested function, but a plain string has no such issue.
  const roomCode = room.code;

  async function handleCopyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/room/${roomCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleStart() {
    setStarting(true);
    setStartError(null);
    const result = await startGame();
    setStarting(false);
    if (!result.ok) setStartError(result.message);
  }

  return (
    <div className="flex shrink-0 flex-col gap-2 rounded-2xl border-[3px] border-play-ink bg-white p-3.5 font-play-body shadow-[5px_5px_0_var(--color-play-ink)]">
      <div className="flex items-center justify-between gap-2">
        <span className="font-play-display text-base font-bold text-play-ink">Room {room.code}</span>
        <span
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-full border-2 border-play-ink px-2 py-0.5 font-play-display text-[10px] font-bold",
            isPrivate ? "bg-white text-play-ink" : "bg-play-blue text-white",
          )}
        >
          {isPrivate ? <Lock className="size-2.5" /> : <Globe2 className="size-2.5" />}
          {isPrivate ? "Private" : "Public"}
        </span>
      </div>

      <span className="font-play-display text-xs font-bold text-play-ink/55">{category ? `${category.icon ?? "🎨"} ${category.name}`.trim() : "…"}</span>

      {gameStarted && state.currentTurn && (
        <p className="rounded-xl border-2 border-play-ink bg-play-cream px-2.5 py-1.5 text-center font-play-display text-[11px] font-bold text-play-ink/60">
          {isDrawer ? "You're drawing" : `${state.currentTurn.drawerName} is drawing`}
        </p>
      )}

      {gameStarted && !state.currentTurn && state.lastTurnResult && (
        <p className="font-play-display text-xs font-bold text-play-ink/55">The word was &ldquo;{state.lastTurnResult.word}&rdquo; — next turn soon…</p>
      )}

      <button
        type="button"
        onClick={handleCopyLink}
        className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-play-ink bg-white px-3 py-2 font-play-display text-xs font-bold text-play-ink shadow-[2px_2px_0_var(--color-play-ink)]"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? "Copied" : "Copy room link"}
      </button>

      {!gameStarted &&
        (isHost ? (
          <button
            type="button"
            disabled={!canStart || starting}
            onClick={handleStart}
            className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-play-ink bg-play-orange px-4 py-2 font-play-display text-xs font-bold text-white shadow-[2px_2px_0_var(--color-play-ink)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {starting ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
            {canStart ? "Start game" : "Need 2 players"}
          </button>
        ) : (
          <span className="text-center font-play-display text-xs font-bold text-play-ink/50">Waiting for host…</span>
        ))}

      {startError && <p className="font-play-body text-xs font-bold text-red-600">{startError}</p>}
    </div>
  );
}
