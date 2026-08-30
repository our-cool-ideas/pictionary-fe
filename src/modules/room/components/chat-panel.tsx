"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useRoomSession } from "@/modules/room/context/use-room-session";
import { TurnStatusHeader } from "@/modules/room/components/turn-status-header";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  isDrawer: boolean;
}

export function ChatPanel({ isDrawer }: ChatPanelProps) {
  const {
    state: { chatMessages },
    actions: { sendMessage },
  } = useRoomSession();
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
    if (isDrawer) return;
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
        {/* Plain text, no bubble/pill/border around any of these — just
            weight/style/color distinguishing the three kinds of line
            this list ever shows: a turn-level announcement (bold
            italic), a correct guess (blue), or someone's own message
            (bold name prefix + regular-weight text). */}
        <ul className="flex flex-col gap-1.5">
          {chatMessages.map((message) =>
            message.isSystem ? (
              <li
                key={message.id}
                className={cn(
                  "text-sm",
                  message.isCorrectGuess
                    ? "text-play-blue font-bold"
                    : "font-bold text-play-ink/70 italic",
                )}
              >
                {message.message}
              </li>
            ) : (
              <li key={message.id} className="text-sm text-play-ink">
                <span className="font-play-display font-bold text-play-blue">
                  {message.name}:{" "}
                </span>
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
            isDrawer ? "You can't chat while drawing" : "Type your guess..."
          }
          maxLength={280}
          disabled={isDrawer}
          className={cn(
            "min-w-0 flex-1 rounded-xl border-2 border-play-ink bg-white px-3 py-2 text-sm font-bold text-play-ink outline-none placeholder:text-play-ink/35",
            isDrawer && "cursor-not-allowed opacity-50",
          )}
        />
        <button
          type="submit"
          disabled={isDrawer || sending || !draft.trim()}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl border-2 border-play-ink bg-play-orange text-white shadow-[2px_2px_0_var(--color-play-ink)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}
