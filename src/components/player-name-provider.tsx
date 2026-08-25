"use client";

import { createContext, useState } from "react";

export interface PlayerNameContextValue {
  playerName: string;
  setPlayerName: (name: string) => void;
}

export const PlayerNameContext = createContext<PlayerNameContextValue | null>(null);

/**
 * The guest's chosen display name, held in React state only — no
 * cookies/localStorage, same reasoning as the guest playerId in
 * socket-provider.tsx (compliance-driven: nothing persisted client-side).
 * "Across the whole session" means across this tab's lifetime, not across
 * a reload — set it once (on the home page, or the first time you join via
 * a shared link) and every subsequent create/join this session reuses it
 * without asking again. A refresh forgets it, same as it already forgets
 * playerId — that's consistent with the rest of the app, not a regression.
 */
export function PlayerNameProvider({ children }: { children: React.ReactNode }) {
  const [playerName, setPlayerName] = useState("");

  return <PlayerNameContext.Provider value={{ playerName, setPlayerName }}>{children}</PlayerNameContext.Provider>;
}
