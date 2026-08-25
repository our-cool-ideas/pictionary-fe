"use client";

import { Crown, WifiOff, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { RoomPlayer } from "@/modules/room/types/room.type";

function initialsFor(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface PlayerListProps {
  players: RoomPlayer[];
  currentPlayerId: string | null;
  isCurrentPlayerHost: boolean;
  onKick?: (playerId: string) => void;
}

export function PlayerList({ players, currentPlayerId, isCurrentPlayerHost, onKick }: PlayerListProps) {
  return (
    <ul className="flex flex-col gap-2">
      {players.map((player) => {
        const isSelf = player.playerId === currentPlayerId;
        return (
          <li key={player.playerId} className="flex items-center gap-2 rounded-lg border bg-card p-2">
            <Avatar className="size-8">
              <AvatarFallback className="text-xs">{initialsFor(player.name)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">
                {player.name}
                {isSelf && <span className="text-muted-foreground"> (you)</span>}
              </span>
              {!player.connected && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <WifiOff className="size-3" /> Reconnecting…
                </span>
              )}
            </div>
            {player.isHost && <Crown className="size-4 shrink-0 text-primary" aria-label="Host" />}
            {isCurrentPlayerHost && !isSelf && onKick && (
              <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => onKick(player.playerId)}>
                <X className="size-4" />
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
