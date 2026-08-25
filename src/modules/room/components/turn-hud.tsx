"use client";

import { Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCountdown } from "@/modules/room/hooks/use-countdown";
import type { TurnStartedPayload } from "@/modules/room/types/game.type";

interface TurnHudProps {
  turn: TurnStartedPayload;
  isDrawer: boolean;
  yourWord: string | null;
}

export function TurnHud({ turn, isDrawer, yourWord }: TurnHudProps) {
  const secondsLeft = useCountdown(turn.turnEndsAt);
  const blanks = "_ ".repeat(turn.wordLength).trim();

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
      <div>
        <p className="text-sm text-muted-foreground">{isDrawer ? "You're drawing" : `${turn.drawerName} is drawing`}</p>
        <p className="font-mono text-lg font-semibold tracking-widest">{isDrawer ? yourWord : blanks}</p>
      </div>
      <Badge variant={secondsLeft <= 10 ? "destructive" : "secondary"} className="gap-1 text-base">
        <Timer className="size-4" />
        {secondsLeft}s
      </Badge>
    </div>
  );
}
