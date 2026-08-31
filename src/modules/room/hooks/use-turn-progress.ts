"use client";

import { useEffect, useState } from "react";
import { TURN_DURATION_MS } from "@/modules/room/constants/turn.constant";

function fractionRemaining(endsAt: number): number {
  return Math.min(1, Math.max(0, (endsAt - Date.now()) / TURN_DURATION_MS));
}

/**
 * Fraction of the turn's time still left — 1 right after the turn starts,
 * 0 at the deadline. Drives the draining progress bar over the canvas;
 * ticks on the same server-provided deadline useCountdown reads, just
 * expressed as a ratio instead of whole seconds.
 *
 * `frozen` pins this at 1 (full, not ticking) during the drawer's 5s word
 * reveal — the server already pushes `endsAt` back by that same window
 * (see WORD_REVEAL_DURATION_MS in pictionary-be), so the math lines up to
 * exactly "full" the instant the reveal ends and real drawing time starts.
 */
export function useTurnProgress(endsAt: number | null, frozen = false): number {
  const [fraction, setFraction] = useState(() => (endsAt ? fractionRemaining(endsAt) : 0));

  useEffect(() => {
    if (!endsAt || frozen) return;
    const tick = () => setFraction(fractionRemaining(endsAt));
    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [endsAt, frozen]);

  if (!endsAt) return 0;
  return frozen ? 1 : fraction;
}
