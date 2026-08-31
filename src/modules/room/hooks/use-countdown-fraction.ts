"use client";

import { useEffect, useState } from "react";

function fractionRemaining(endsAt: number, totalMs: number): number {
  if (totalMs <= 0) return 0;
  return Math.min(1, Math.max(0, (endsAt - Date.now()) / totalMs));
}

/**
 * Generic version of use-turn-progress's fraction-remaining ticker — that
 * one is hardcoded to the turn-duration deadline, this takes any deadline
 * plus the total window it's counting down within. Used by the post-turn
 * leaderboard overlay's draining bar (endsAt = TurnEndedPayload.nextTurnAt,
 * totalMs = TURN_TRANSITION_DELAY_MS).
 */
export function useCountdownFraction(endsAt: number | null, totalMs: number): number {
  const [fraction, setFraction] = useState(() => (endsAt ? fractionRemaining(endsAt, totalMs) : 0));

  useEffect(() => {
    if (!endsAt) return;
    const tick = () => setFraction(fractionRemaining(endsAt, totalMs));
    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [endsAt, totalMs]);

  if (!endsAt) return 0;
  return fraction;
}
