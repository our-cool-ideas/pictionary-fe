"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useSocket } from "@/hooks/use-socket";
import { useRoomSession } from "@/modules/room/context/use-room-session";

const VISIBLE_MS = 1800;

/**
 * A transient full-screen "you got it!" overlay, shown only to the local
 * player the instant *they* land in correctGuesserIds — not for other
 * players' correct guesses, which are already announced in the chat log
 * (see ChatPanel's green highlight). Keyed by a fresh timestamp each time
 * so the CSS pop animation restarts even on a second correct guess in the
 * same session; correctGuesserIds resets to [] on every new turn (see the
 * reducer's TURN_STARTED case), so re-triggering across turns needs no
 * special-case reset here.
 */
export function CorrectGuessCelebration() {
  const { playerId } = useSocket();
  const {
    state: { correctGuesserIds },
  } = useRoomSession();
  const [celebrationKey, setCelebrationKey] = useState<number | null>(null);
  const wasIncluded = useRef(false);

  useEffect(() => {
    const isIncluded = playerId !== null && correctGuesserIds.includes(playerId);
    if (isIncluded && !wasIncluded.current) setCelebrationKey(Date.now());
    wasIncluded.current = isIncluded;
  }, [correctGuesserIds, playerId]);

  useEffect(() => {
    if (celebrationKey === null) return;
    const timer = setTimeout(() => setCelebrationKey(null), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [celebrationKey]);

  if (celebrationKey === null) return null;

  return (
    <div key={celebrationKey} className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <div
        style={{ animation: `play-correct-guess-pop ${VISIBLE_MS}ms ease-out forwards` }}
        className="flex flex-col items-center gap-2 rounded-full border-[3px] border-play-ink bg-play-green px-10 py-10 text-white shadow-[8px_8px_0_var(--color-play-ink)]"
      >
        <CheckCircle2 className="size-16" strokeWidth={2.5} />
        <span className="font-play-display text-lg font-bold">Correct!</span>
      </div>
    </div>
  );
}
