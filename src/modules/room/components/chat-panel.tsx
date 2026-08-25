"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRoomSession } from "@/modules/room/context/use-room-session";
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
    <div className="flex h-full flex-col rounded-lg border bg-card">
      <div ref={listRef} className="flex-1 overflow-y-auto p-3">
        {chatMessages.length === 0 && <p className="text-sm text-muted-foreground">No messages yet.</p>}
        <ul className="flex flex-col gap-1.5">
          {chatMessages.map((message) => (
            <li key={message.id} className={cn("text-sm", message.isSystem && "italic text-muted-foreground")}>
              {!message.isSystem && <span className="font-medium">{message.name}: </span>}
              {message.message}
            </li>
          ))}
        </ul>
      </div>
      <form className="flex gap-2 border-t p-2" onSubmit={handleSubmit}>
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={isDrawer ? "You can't chat while drawing" : "Type your guess..."}
          maxLength={280}
          disabled={isDrawer}
        />
        <Button type="submit" size="icon" disabled={isDrawer || sending || !draft.trim()}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
