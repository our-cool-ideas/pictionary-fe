"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Target } from "lucide-react";
import { useSocket } from "@/hooks/use-socket";
import { useRoomSession } from "@/modules/room/context/use-room-session";
import { TurnStatusHeader } from "@/modules/room/components/turn-status-header";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  isDrawer: boolean;
}

export function ChatPanel({ isDrawer }: ChatPanelProps) {
  const { playerId } = useSocket();
  const {
    state: { chatMessages, correctGuesserIds },
    actions: { sendMessage },
  } = useRoomSession();
  // Once you've guessed the current turn's word, there's nothing left to
  // type it for — server-side this is already a no-op (tryScoreGuess
  // rejects a repeat guesser), this just stops it at the input instead of
  // round-tripping first. Resets every turn (correctGuesserIds does too).
  const hasGuessedCorrectly = playerId !== null && correctGuesserIds.includes(playerId);
  const inputDisabled = isDrawer || hasGuessedCorrectly;
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [chatMessages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // The server rejects a drawer's chat message outright (see
    // pictionary-be's README) — this is just the UI-side mirror of that
    // rule so the drawer never gets as far as a round trip to find out.
    if (inputDisabled) return;
    const trimmed = draft.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setDraft("");
    await sendMessage(trimmed);
    setSending(false);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border-[3px] border-play-ink bg-white font-play-body shadow-[5px_5px_0_var(--color-play-ink)]">
      {/* Pinned at the top of this card, not floating over the canvas
          anymore — see TurnStatusHeader. Renders nothing (null) pre-game
          and in any other state with no turn/last-result to show. */}
      <TurnStatusHeader />
      <div ref={listRef} className="flex-1 overflow-y-auto p-3">
        {chatMessages.length === 0 && (
          <p className="text-sm font-bold text-play-ink/40">
            No messages yet — say hi!
          </p>
        )}
        {/* Plain text, no bubble/pill/border around any of these — every
            line in here is `font-bold font-play-body` (same weight and
            family the input itself types in, so a message doesn't look
            lighter once it's sent), with only style/color (and, for a
            correct guess, a real Target icon rather than an emoji glyph)
            distinguishing the three kinds: a turn-level announcement
            (italic, muted ink), a correct guess (italic orange, with the
            icon), a private near-miss nudge only the guesser ever sees
            (italic blue), or someone's own message (blue name prefix +
            regular ink text — both still bold, so the name doesn't read
            heavier than the rest of the line). */}
        <ul className="flex flex-col gap-1.5 font-bold">
          {chatMessages.map((message) =>
            message.isSystem ? (
              <li
                key={message.id}
                className={cn(
                  "flex items-center gap-1 text-sm italic",
                  message.isCorrectGuess && "text-play-orange",
                  message.isCloseGuess && "text-play-blue",
                  !message.isCorrectGuess && !message.isCloseGuess && "text-play-ink/70",
                )}
              >
                {message.isCorrectGuess && <Target className="size-3.5 shrink-0" strokeWidth={2.5} />}
                {message.message}
              </li>
            ) : (
              <li key={message.id} className="text-sm text-play-ink">
                <span className="text-play-blue">{message.name}: </span>
                {message.message}
              </li>
            ),
          )}
        </ul>
      </div>
      <form
        className="flex gap-2 border-t-[3px] border-play-ink p-2.5"
        onSubmit={handleSubmit}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={
            isDrawer
              ? "You can't chat while drawing"
              : hasGuessedCorrectly
                ? "You already guessed it!"
                : "Type your guess..."
          }
          maxLength={280}
          disabled={inputDisabled}
          className={cn(
            "min-w-0 flex-1 rounded-xl border-2 border-play-ink bg-white px-3 py-2 text-sm font-bold text-play-ink outline-none placeholder:text-play-ink/35",
            inputDisabled && "cursor-not-allowed opacity-50",
          )}
        />
        <button
          type="submit"
          disabled={inputDisabled || sending || !draft.trim()}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl border-2 border-play-ink bg-play-orange text-white shadow-[2px_2px_0_var(--color-play-ink)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}
