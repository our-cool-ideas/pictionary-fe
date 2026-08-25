"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { RoomPlayer } from "@/modules/room/types/room.type";

function initialsFor(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface ScoreboardProps {
  players: RoomPlayer[];
  scores: Record<string, number>;
  currentDrawerId: string | null;
  correctGuesserIds: string[];
}

export function Scoreboard({ players, scores, currentDrawerId, correctGuesserIds }: ScoreboardProps) {
  const sorted = [...players].sort((a, b) => (scores[b.playerId] ?? 0) - (scores[a.playerId] ?? 0));

  return (
    <ul className="flex flex-col gap-1.5">
      {sorted.map((player) => (
        <li key={player.playerId} className="flex items-center gap-2 rounded-lg border bg-card px-2 py-1.5">
          <Avatar className="size-7">
            <AvatarFallback className="text-xs">{initialsFor(player.name)}</AvatarFallback>
          </Avatar>
          <span className="flex-1 truncate text-sm">{player.name}</span>
          {player.playerId === currentDrawerId && (
            <Badge variant="outline" className="text-xs">
              Drawing
            </Badge>
          )}
          {correctGuesserIds.includes(player.playerId) && (
            <Badge variant="secondary" className="text-xs">
              ✓
            </Badge>
          )}
          <span className="text-sm font-semibold tabular-nums">{scores[player.playerId] ?? 0}</span>
        </li>
      ))}
    </ul>
  );
}
