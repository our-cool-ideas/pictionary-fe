"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Play } from "lucide-react";
import { useRoomSession } from "@/modules/room/context/use-room-session";
import { useSocket } from "@/hooks/use-socket";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/modules/room/constants/canvas.constant";
import { PRESS_CLASS, cn, pressStyle } from "@/lib/utils";

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
        {/* Stacked now (Start Game on top, Copy room link below) instead
            of side by side — a normal full-width primary button reads as
            THE thing to do here, same as Start/Join Room/Create
            elsewhere in the app, rather than a small circular FAB that
            didn't match any other CTA's shape. Same disabled condition
            and starting/loading flow as before, just the plain
            `disabled:opacity-50` treatment every other CTA button here
            uses instead of the FAB's own bespoke ink-tinted disabled
            look. */}
        <div className="flex w-full max-w-xs flex-col gap-2.5">
          <button
            type="button"
            disabled={!isHost || !canStart || starting}
            onClick={handleStart}
            aria-label="Start game"
            style={pressStyle(4)}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-2xl border-[3px] border-play-ink bg-play-orange p-3.5 font-play-display text-lg font-bold text-white shadow-[4px_4px_0_var(--color-play-ink)] disabled:cursor-not-allowed disabled:opacity-50",
              PRESS_CLASS,
            )}
          >
            {starting ? <Loader2 className="size-5 animate-spin" /> : <Play className="size-5" fill="currentColor" />}
            Start Game
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            style={pressStyle(2)}
            className={cn(
              "flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-play-ink bg-white px-4 py-2.5 font-play-display text-sm font-bold text-play-ink shadow-[2px_2px_0_var(--color-play-ink)]",
              PRESS_CLASS,
            )}
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
