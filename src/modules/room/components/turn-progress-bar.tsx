"use client";

import { useTurnProgress } from "@/modules/room/hooks/use-turn-progress";
import { cn } from "@/lib/utils";
import type { TurnStartedPayload } from "@/modules/room/types/game.type";

interface TurnProgressBarProps {
  turn: TurnStartedPayload;
}

/** A draining "reverse" progress bar over the canvas — full the instant a turn starts, empty at the deadline — replacing the old numeric "Xs" badge that used to sit in the room-metadata card. */
export function TurnProgressBar({ turn }: TurnProgressBarProps) {
  const fraction = useTurnProgress(turn.turnEndsAt);
  const low = fraction <= 1 / 6; // roughly the last 10s of a 60s turn

  return (
    <div className="h-3 w-full shrink-0 overflow-hidden rounded-full border-2 border-play-ink bg-white">
      <div
        className={cn("h-full rounded-full transition-[width] duration-200 ease-linear", low ? "bg-red-400" : "bg-play-yellow")}
        style={{ width: `${fraction * 100}%` }}
      />
    </div>
  );
}
