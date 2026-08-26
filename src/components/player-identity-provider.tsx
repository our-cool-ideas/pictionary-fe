"use client";

import { createContext, useState } from "react";
import { DEFAULT_AVATAR_ID, type AvatarId } from "@/modules/player/constants/avatar.constant";

export interface PlayerIdentityContextValue {
  playerName: string;
  setPlayerName: (name: string) => void;
  avatarId: AvatarId;
  setAvatarId: (id: AvatarId) => void;
}

export const PlayerIdentityContext = createContext<PlayerIdentityContextValue | null>(null);

/**
 * The guest's chosen display name and avatar, held in React state only —
 * no cookies/localStorage, same reasoning as the guest playerId in
 * socket-provider.tsx (compliance-driven: nothing persisted client-side).
 * "Across the whole session" means across this tab's lifetime, not across
 * a reload — set once on the sign-in page (or the first time you join via
 * a shared link, for the name) and every subsequent create/join this
 * session reuses it without asking again. A refresh forgets it, same as
 * it already forgets playerId — that's consistent with the rest of the
 * app, not a regression.
 */
export function PlayerIdentityProvider({ children }: { children: React.ReactNode }) {
  const [playerName, setPlayerName] = useState("");
  const [avatarId, setAvatarId] = useState<AvatarId>(DEFAULT_AVATAR_ID);

  return (
    <PlayerIdentityContext.Provider value={{ playerName, setPlayerName, avatarId, setAvatarId }}>
      {children}
    </PlayerIdentityContext.Provider>
  );
}
