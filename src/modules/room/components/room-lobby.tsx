"use client";

import { useState } from "react";
import { Check, Copy, Globe2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerList } from "@/modules/room/components/player-list";
import { RoomLobbyStartAction } from "@/modules/room/components/room-lobby-start-action";
import { usePublicCategories } from "@/modules/player/hooks/use-public-categories";
import { ROOM_VISIBILITY } from "@/lib/enums/room-visibility.enum";
import type { RoomState } from "@/modules/room/types/room.type";

interface RoomLobbyProps {
  room: RoomState;
  currentPlayerId: string | null;
}

export function RoomLobby({ room, currentPlayerId }: RoomLobbyProps) {
  const { data: categoriesData } = usePublicCategories();
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const isHost = room.hostPlayerId === currentPlayerId;
  const category = categoriesData?.categories.find((c) => c.id === room.settings.categoryId);
  const canStart = room.players.filter((p) => p.connected).length >= 2;
  const isPrivate = room.settings.visibility === ROOM_VISIBILITY.PRIVATE;

  async function handleCopyLink() {
    const url = `${window.location.origin}/room/${room.code}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleStart(start: () => Promise<{ ok: boolean; message: string }>) {
    setStarting(true);
    setStartError(null);
    const result = await start();
    setStarting(false);
    if (!result.ok) setStartError(result.message);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Room {room.code}</CardTitle>
            <Badge variant={isPrivate ? "outline" : "secondary"} className="gap-1">
              {isPrivate ? <Lock className="size-3" /> : <Globe2 className="size-3" />}
              {isPrivate ? "Private" : "Public"}
            </Badge>
          </div>
          <CardDescription>
            {category ? `${category.icon ?? ""} ${category.name}`.trim() : "Loading category..."} · waiting for the host to
            start
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button type="button" variant="outline" onClick={handleCopyLink}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Link copied" : "Copy invite link"}
          </Button>
          {isPrivate && (
            <p className="-mt-2 text-xs text-muted-foreground">
              This room is private — it won't show up in Rooms, only whoever has this link can join.
            </p>
          )}

          <RoomLobbyStartAction isHost={isHost} canStart={canStart} starting={starting} startError={startError} onStart={handleStart} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Players ({room.players.length}/{room.settings.maxPlayers})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PlayerList players={room.players} currentPlayerId={currentPlayerId} isCurrentPlayerHost={isHost} />
        </CardContent>
      </Card>
    </div>
  );
}
