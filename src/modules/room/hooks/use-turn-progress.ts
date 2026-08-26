"use client";

import { useEffect, useState } from "react";
import { TURN_DURATION_MS } from "@/modules/room/constants/turn.constant";

function fractionRemaining(endsAt: number): number {
  return Math.min(1, Math.max(0, (endsAt - Date.now()) / TURN_DURATION_MS));
}

/** Fraction of the turn's time still left — 1 right after the turn starts, 0 at the deadline. Drives the draining progress bar over the canvas; ticks on the same server-provided deadline useCountdown reads, just expressed as a ratio instead of whole seconds. */
export function useTurnProgress(endsAt: number | null): number {
  const [fraction, setFraction] = useState(() => (endsAt ? fractionRemaining(endsAt) : 0));

  useEffect(() => {
    if (!endsAt) {
      setFraction(0);
      return;
    }
    const tick = () => setFraction(fractionRemaining(endsAt));
    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [endsAt]);

  return fraction;
}
