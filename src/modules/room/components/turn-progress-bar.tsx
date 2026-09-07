"use client";

import { useTurnProgress } from "@/modules/room/hooks/use-turn-progress";
import { cn } from "@/lib/utils";
import type { TurnStartedPayload } from "@/modules/room/types/game.type";

interface TurnProgressBarProps {
  turn: TurnStartedPayload;
}

type UrgencyStage = "blue" | "yellow" | "red";

// Blue for the first 20% of the turn, yellow through the big middle
// stretch, red for the final 20% — a plain 3-way split of the 0–100%
// remaining-time scale (`fraction`), not evenly-spaced thirds.
function stageFor(fraction: number): UrgencyStage {
  if (fraction <= 0.2) return "red";
  if (fraction <= 0.8) return "yellow";
  return "blue";
}

const STAGE_FILL: Record<UrgencyStage, string> = {
  blue: "bg-play-blue",
  yellow: "bg-play-yellow",
  red: "bg-red-400",
};

/** A draining "reverse" progress bar over the canvas — full the instant a turn starts, empty at the deadline — replacing the old numeric "Xs" badge that used to sit in the room-metadata card. */
export function TurnProgressBar({ turn }: TurnProgressBarProps) {
  const fraction = useTurnProgress(turn.turnEndsAt);
  const stage = stageFor(fraction);

  return (
    // `key={stage}` remounts this wrapper the instant the urgency stage
    // changes, which is what replays the `play-progress-pop` animation
    // fresh every time (a CSS animation doesn't restart on its own just
    // because a class/color changed) — a plain color swap here read as
    // flat/lifeless for something meant to signal "this just got more
    // urgent." Split onto its own wrapper (rather than combined with the
    // continuous `animate-pulse` below) so the two animations don't
    // fight over the same element's `animation` property.
    <div key={stage} className="w-full shrink-0" style={{ animation: "play-progress-pop 0.4s ease-out" }}>
      <div
        className={cn(
          "h-3 w-full overflow-hidden rounded-full border-2 border-play-ink bg-white",
          // The final stretch pulses continuously, not just on the one
          // transition into it — an actively-draining "hurry up" cue
          // rather than a color that quietly sits there being red.
          stage === "red" && "animate-pulse",
        )}
      >
        <div className={cn("h-full rounded-full transition-[width] duration-200 ease-linear", STAGE_FILL[stage])} style={{ width: `${fraction * 100}%` }} />
      </div>
    </div>
  );
}
