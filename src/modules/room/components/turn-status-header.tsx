"use client";

import { useSocket } from "@/hooks/use-socket";
import { useRoomSession } from "@/modules/room/context/use-room-session";

/**
 * A dark pill sitting above the canvas (see GameBoard) — the word/blanks
 * and who's drawing, persistent for the whole turn. This is the ONLY
 * place the word/blanks show at all now — there's no separate reveal
 * overlay on the canvas itself anymore (the drawer already knows the
 * word, they just chose it themselves in the word-choice picker; a
 * guesser only ever gets the masked blanks either way, so a one-time
 * "X's turn! (N letters)" flash on the canvas was pure redundancy with
 * this bar). Shows the drawer their own word, everyone else the masked
 * blanks (never the real word — mirrors the backend's word-privacy
 * split), and the previous word for a beat once a turn's just ended.
 * This is also the only remaining home for "who's drawing" now that the
 * room-metadata card is gone — self-contained, no props, so GameBoard
 * can render it unconditionally and let it decide whether there's
 * anything to show (renders nothing pre-game and in any other state
 * with no turn/last-result to show, so it never leaves a stray gap in
 * the flex column it sits in). Used to live pinned to the top of
 * ChatPanel's own card instead — moved here so it stops eating into
 * ChatPanel's own message-list height, and rounded/bordered/shadowed on
 * all sides now that it's a standalone card of its own rather than
 * something flush against another card's top edge.
 */
export function TurnStatusHeader() {
  const { playerId } = useSocket();
  const {
    state: { currentTurn, yourWord, lastTurnResult },
  } = useRoomSession();

  if (currentTurn) {
    const isDrawer = currentTurn.drawerId === playerId;
    const blanks = "_ ".repeat(currentTurn.wordLength).trim();
    return (
      <div className="flex shrink-0 items-center gap-2 rounded-2xl border-[3px] border-play-ink bg-play-ink px-4 py-2.5 shadow-[3px_3px_0_var(--color-play-ink)]">
        <span className="truncate font-play-display text-base font-bold tracking-wide text-white">{isDrawer ? yourWord : blanks}</span>
        <span className="whitespace-nowrap font-play-body text-[11px] font-bold text-white/60">{isDrawer ? "— that's your word" : `— ${currentTurn.drawerName} is drawing`}</span>
      </div>
    );
  }

  if (lastTurnResult) {
    return (
      <div className="shrink-0 rounded-2xl border-[3px] border-play-ink bg-play-ink px-4 py-2.5 shadow-[3px_3px_0_var(--color-play-ink)]">
        <span className="whitespace-nowrap font-play-display text-sm font-bold text-white/80">The word was &ldquo;{lastTurnResult.word}&rdquo; — next turn soon…</span>
      </div>
    );
  }

  return null;
}
