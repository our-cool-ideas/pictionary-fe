"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Play } from "lucide-react";
import { useRoomSession } from "@/modules/room/context/use-room-session";
import { useSocket } from "@/hooks/use-socket";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/modules/room/constants/canvas.constant";

/**
 * Sits inside the canvas's own footprint (same width, border, and shadow)
 * until a game is actually running — replacing the empty drawable surface
 * with the two things that actually matter before then: invite people,
 * and (host-only) start once there are enough of them. Swapped out for
 * the real drawable canvas the moment a turn starts (see CanvasBoard) —
 * this is the only place Copy Link / Start Game live now that the
 * room-metadata card is gone entirely. `w-full` + the canvas's own fixed
 * aspect ratio (not `h-full`) — matches the real canvas's full-bleed,
 * width-driven sizing exactly, so nothing visibly jumps in size when the
 * game starts.
 *
 * Also reserves the same vertical space CanvasBoard's TurnProgressBar row
 * occupies once a turn is running (an invisible placeholder of identical
 * height, right below the card) — without it, this column's total height
 * grows by the progress bar's height + gap the instant the game starts,
 * and every sibling column visibly jumps to match via GameBoard's grid
 * `align-items: stretch`. This placeholder is the fix; CanvasBoard's own
 * in-game layout is untouched.
 */
export function PreGameCanvasCard() {
  const { playerId } = useSocket();
  const {
    state: { room },
    actions: { startGame },
  } = useRoomSession();
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  if (!room) return null;

  const isHost = room.hostPlayerId === playerId;
  const canStart = room.players.filter((p) => p.connected).length >= 2;
  // Captured as a primitive rather than referencing `room` inside the
  // closure below — TS can't carry the null-check's narrowing into a
  // nested function, but a plain string has no such issue.
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

  const helperText = !canStart
    ? "Invite more players — need more than 1 player to start the game."
    : isHost
      ? "Everyone's here — hit play when you're ready!"
      : "Waiting for host to start the game…";

  return (
    <div className="flex w-full flex-col gap-2">
      <div
        className="flex w-full flex-col items-center justify-center gap-4 rounded-2xl border-[3px] border-play-ink bg-white p-6 text-center shadow-[5px_5px_0_var(--color-play-ink)]"
        style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!isHost || !canStart || starting}
            onClick={handleStart}
            aria-label="Start game"
            className="flex size-16 items-center justify-center rounded-full border-[3px] border-play-ink bg-play-orange text-white shadow-[3px_3px_0_var(--color-play-ink)] transition-opacity disabled:cursor-not-allowed disabled:border-play-ink/25 disabled:bg-play-ink/10 disabled:text-play-ink/30 disabled:shadow-none"
          >
            {starting ? <Loader2 className="size-6 animate-spin" /> : <Play className="size-6" fill="currentColor" />}
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 rounded-xl border-2 border-play-ink bg-white px-4 py-2.5 font-play-display text-sm font-bold text-play-ink shadow-[2px_2px_0_var(--color-play-ink)]"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copied!" : "Copy room link"}
          </button>
        </div>
        <p className="max-w-xs font-play-display text-sm font-bold text-play-ink/55">{helperText}</p>
        {startError && <p className="font-play-body text-xs font-bold text-red-600">{startError}</p>}
      </div>
      {/* Invisible — see the file doc comment above for why this exists. */}
      <div className="shrink-0 px-1" aria-hidden="true">
        <div className="h-3 w-full rounded-full border-2 border-transparent" />
      </div>
    </div>
  );
}
