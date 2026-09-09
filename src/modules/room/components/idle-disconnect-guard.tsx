"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { useRoomSession } from "@/modules/room/context/use-room-session";
import { useCountdown } from "@/modules/room/hooks/use-countdown";
import { PRESS_CLASS, cn, pressStyle } from "@/lib/utils";

// How long with zero mouse/keyboard/touch/scroll activity before the
// "are you still there?" warning shows.
const IDLE_WARNING_MS = 60_000;
// How long the warning itself stays up before this client actually
// leaves the room — any activity during this window (including the
// "I'm still here" button, which is really just one more click) cancels
// it and resets the whole 60s clock.
const IDLE_DISCONNECT_GRACE_MS = 10_000;

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "pointerdown", "scroll"] as const;

/**
 * Mounted once in GameBoard, active for the whole room lifecycle (lobby
 * and in-game alike, unlike CanvasBoard's sole-survivor overlay which
 * only applies once a game's running) — an AFK guard, not a connection
 * one: the socket itself stays perfectly connected the whole time, this
 * is purely about a human who's stopped looking at the tab holding a
 * seat (and, mid-game, everyone else's turn) open indefinitely. No props
 * — reads the room straight from context and renders nothing at all
 * until the idle threshold is actually crossed.
 */
export function IdleDisconnectGuard() {
  const router = useRouter();
  const {
    state: { room },
    actions: { leaveRoom },
  } = useRoomSession();

  // A ref, not state — every mousemove would otherwise trigger a render.
  // Starts at 0 (not Date.now()) since reading the clock is an impure
  // call React's purity rule won't allow directly in a render — the
  // effect below (which runs once, synchronously after mount, before the
  // idle-check effect further down ever gets a chance to read this ref)
  // stamps the real value instead.
  const lastActivityRef = useRef(0);
  // The moment the 60s-idle threshold was first crossed, or null while
  // active. Pinned via a functional update (see the interval below) so it
  // doesn't drift on every check tick once it's set — only the initial
  // "still null" -> "just crossed" transition sets it, and only a fresh
  // burst of activity clears it back to null.
  const [idleSince, setIdleSince] = useState<number | null>(null);

  useEffect(() => {
    lastActivityRef.current = Date.now();
    const markActive = () => {
      lastActivityRef.current = Date.now();
    };
    for (const event of ACTIVITY_EVENTS) window.addEventListener(event, markActive, { passive: true });
    return () => {
      for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, markActive);
    };
  }, []);

  // Polls rather than a single setTimeout — activity can happen (and needs
  // to reset the clock) at any moment, not just once, so there's no one
  // fixed deadline to schedule a timer against ahead of time the way the
  // sole-survivor/word-choice countdowns can.
  useEffect(() => {
    if (!room) return;
    const interval = setInterval(() => {
      const idleMs = Date.now() - lastActivityRef.current;
      if (idleMs >= IDLE_WARNING_MS) {
        setIdleSince((prev) => prev ?? lastActivityRef.current + IDLE_WARNING_MS);
      } else {
        setIdleSince(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [room]);

  const disconnectAt = idleSince !== null ? idleSince + IDLE_DISCONNECT_GRACE_MS : null;
  const secondsLeft = useCountdown(disconnectAt);

  useEffect(() => {
    if (disconnectAt === null) return;
    const timer = setTimeout(
      () => {
        void leaveRoom().then(() => router.push("/rooms"));
      },
      Math.max(0, disconnectAt - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [disconnectAt, leaveRoom, router]);

  if (!room || idleSince === null) return null;

  function handleStillHere() {
    lastActivityRef.current = Date.now();
    setIdleSince(null);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-play-ink/60 p-4">
      <div
        style={{ animation: "play-modal-pop 0.3s ease-out" }}
        className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl border-[3px] border-play-ink bg-white p-7 text-center shadow-[8px_8px_0_var(--color-play-ink)]"
      >
        <Clock className="size-8 text-play-ink/60" />
        <p className="font-play-display text-lg font-bold text-play-ink">Still there?</p>
        <p className="font-play-display text-sm font-bold text-play-ink/55">You&apos;ll be disconnected in {secondsLeft}s due to inactivity.</p>
        <button
          type="button"
          onClick={handleStillHere}
          style={pressStyle(3)}
          className={cn(
            "mt-1 flex items-center gap-1.5 rounded-2xl border-[3px] border-play-ink bg-play-orange px-5 py-2.5 font-play-display text-base font-bold text-white shadow-[3px_3px_0_var(--color-play-ink)]",
            PRESS_CLASS,
          )}
        >
          I&apos;m still here!
        </button>
      </div>
    </div>
  );
}
