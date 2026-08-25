"use client";

import { useRouter } from "next/navigation";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRoomSession } from "@/modules/room/context/use-room-session";
import type { GameOverPayload } from "@/modules/room/types/game.type";
import type { RoomPlayer } from "@/modules/room/types/room.type";

interface GameOverScreenProps {
  gameOver: GameOverPayload;
  players: RoomPlayer[];
}

export function GameOverScreen({ gameOver, players }: GameOverScreenProps) {
  const router = useRouter();
  const {
    actions: { leaveRoom },
  } = useRoomSession();
  const sorted = [...players].sort((a, b) => (gameOver.scores[b.playerId] ?? 0) - (gameOver.scores[a.playerId] ?? 0));

  async function handleLeave() {
    await leaveRoom();
    router.push("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Trophy className="mb-2 size-10 text-primary" />
          <CardTitle>{gameOver.winnerId ? `${gameOver.winnerName} wins!` : "Game over"}</CardTitle>
          <CardDescription>{gameOver.winnerId ? "First to 100 points." : "Not enough players to continue."}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="flex flex-col gap-1.5">
            {sorted.map((player, index) => (
              <li key={player.playerId} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm">
                <span>
                  {index + 1}. {player.name}
                </span>
                <span className="font-semibold tabular-nums">{gameOver.scores[player.playerId] ?? 0}</span>
              </li>
            ))}
          </ul>
          <Button onClick={handleLeave}>Back to home</Button>
        </CardContent>
      </Card>
    </div>
  );
}
