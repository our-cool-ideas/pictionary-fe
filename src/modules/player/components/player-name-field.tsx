"use client";

import { usePlayerIdentity } from "@/hooks/use-player-identity";

/** The one place a guest's name gets typed — AvatarPicker's sibling on the sign-in card, both writing to the same session-wide identity. */
export function PlayerNameField() {
  const { playerName, setPlayerName } = usePlayerIdentity();

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="player-name" className="font-play-display text-xs font-semibold tracking-wide text-play-ink uppercase">
        Your Name
      </label>
      <input
        id="player-name"
        placeholder="e.g. Alex"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        maxLength={24}
        className="rounded-2xl border-[3px] border-play-ink bg-white px-4 py-3 font-play-body text-base font-bold text-play-ink shadow-[3px_3px_0_var(--color-play-ink)] outline-none placeholder:text-play-ink/35"
      />
    </div>
  );
}
