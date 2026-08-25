"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePlayerName } from "@/hooks/use-player-name";

/**
 * The one place a guest's name gets typed — both CreateRoomPanel and
 * OpenRoomsList read the shared value this writes to, so it's only ever
 * asked for once per session, not once per action.
 */
export function PlayerNameField() {
  const { playerName, setPlayerName } = usePlayerName();

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="player-name">Your name</Label>
      <Input
        id="player-name"
        placeholder="e.g. Alex"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        maxLength={24}
      />
      <p className="text-xs text-muted-foreground">Used whenever you create or join a room this session.</p>
    </div>
  );
}
