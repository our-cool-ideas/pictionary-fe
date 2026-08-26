"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/use-socket";
import { useRoomSession } from "@/modules/room/context/use-room-session";

const AUTO_DISMISS_MS = 5000;

/**
 * The turn-start word reveal — a plain custom overlay (not shadcn's Dialog,
 * matching the rest of the gamified player screens), popped up once per
 * turn instead of living inline in the compact room-metadata card. The
 * drawer sees the real word; everyone else sees who's drawing and the
 * blank count, never the word itself (mirrors the backend's word-privacy
 * split — yourWord only ever arrives for the actual drawer).
 */
export function TurnWordModal() {
  const { playerId } = useSocket();
  const {
    state: { currentTurn: turn, yourWord },
  } = useRoomSession();
  const [dismissedTurn, setDismissedTurn] = useState<number | null>(null);

  const turnNumber = turn?.turnNumber ?? null;
  const isDrawer = turn?.drawerId === playerId;
  // The drawer's modal waits for yourWord to actually arrive rather than
  // popping up with a blank word for a beat.
  const ready = turn !== null && (!isDrawer || yourWord !== null);
  const visible = ready && turnNumber !== dismissedTurn;

  useEffect(() => {
    if (!visible || turnNumber === null) return;
    const timer = setTimeout(() => setDismissedTurn(turnNumber), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [visible, turnNumber]);

  if (!visible || !turn) return null;

  const blanks = "_ ".repeat(turn.wordLength).trim();

  function dismiss() {
    setDismissedTurn(turnNumber);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-play-ink/60 p-4" onClick={dismiss}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "play-modal-pop 0.3s ease-out" }}
        className="flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl border-[3px] border-play-ink bg-white p-7 text-center shadow-[8px_8px_0_var(--color-play-ink)]"
      >
        <p className="font-play-display text-xs font-bold tracking-wide text-play-ink/50 uppercase">
          {isDrawer ? "It's your turn to draw!" : `${turn.drawerName} is drawing`}
        </p>
        <p className="font-play-display text-3xl font-bold break-all text-play-ink" style={{ letterSpacing: isDrawer ? "normal" : "0.35em" }}>
          {isDrawer ? yourWord : blanks}
        </p>
        {!isDrawer && (
          <p className="font-play-body text-sm font-bold text-play-ink/55">
            {turn.wordLength} letters — guess it in the chat!
          </p>
        )}
        <button
          type="button"
          onClick={dismiss}
          className="mt-1 rounded-xl border-2 border-play-ink bg-play-yellow px-5 py-2 font-play-display text-sm font-bold text-play-ink shadow-[2px_2px_0_var(--color-play-ink)]"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
