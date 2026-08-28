"use client";

import { useSocket } from "@/hooks/use-socket";
import { useRoomSession } from "@/modules/room/context/use-room-session";

/**
 * A dark bar pinned to the top of the chat panel (see ChatPanel) — the
 * word/blanks and who's drawing. The lightweight, always-visible
 * counterpart to TurnWordModal's one-time reveal: shows the drawer their
 * own word, everyone else the masked blanks (never the real word —
 * mirrors the backend's word-privacy split), and the previous word for a
 * beat once a turn's just ended. This is also the only remaining home for
 * "who's drawing" now that the room-metadata card is gone — self-
 * contained, no props, so ChatPanel can render it unconditionally and let
 * it decide whether there's anything to show. `rounded-t-2xl` matches the
 * chat card's own corner radius since this sits flush at its top, not
 * floating separately over the canvas the way it used to.
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
      <div className="flex shrink-0 items-center gap-2 rounded-t-2xl border-b-[3px] border-play-ink bg-play-ink px-4 py-2.5">
        <span className="truncate font-play-display text-base font-bold tracking-wide text-white">{isDrawer ? yourWord : blanks}</span>
        <span className="whitespace-nowrap font-play-body text-[11px] font-bold text-white/60">{isDrawer ? "— that's your word" : `— ${currentTurn.drawerName} is drawing`}</span>
      </div>
    );
  }

  if (lastTurnResult) {
    return (
      <div className="shrink-0 rounded-t-2xl border-b-[3px] border-play-ink bg-play-ink px-4 py-2.5">
        <span className="whitespace-nowrap font-play-display text-sm font-bold text-white/80">The word was &ldquo;{lastTurnResult.word}&rdquo; — next turn soon…</span>
      </div>
    );
  }

  return null;
}
