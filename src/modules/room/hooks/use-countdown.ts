"use client";

import { useEffect, useState } from "react";

/** Ticks down to a server-provided timestamp — the server owns the actual deadline, this just renders it. */
export function useCountdown(endsAt: number | null): number {
  const [secondsLeft, setSecondsLeft] = useState(() => (endsAt ? Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)) : 0));

  useEffect(() => {
    if (!endsAt) {
      setSecondsLeft(0);
      return;
    }
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [endsAt]);

  return secondsLeft;
}
