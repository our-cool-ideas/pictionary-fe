"use client";

import { createContext, useEffect, useState } from "react";
import { AVATAR_OPTIONS, DEFAULT_AVATAR_ID, type AvatarId } from "@/modules/player/constants/avatar.constant";

export interface PlayerIdentityContextValue {
  playerName: string;
  setPlayerName: (name: string) => void;
  avatarId: AvatarId;
  setAvatarId: (id: AvatarId) => void;
  /** False until the one-time localStorage read on mount finishes — pages
   * that redirect based on `playerName` being empty (see RoomsPage) must
   * wait for this, otherwise they'd bounce a returning guest to "/" in
   * the split second before their stored name loads. */
  isHydrated: boolean;
}

export const PlayerIdentityContext = createContext<PlayerIdentityContextValue | null>(null);

const STORAGE_KEY = "pictionary.playerIdentity";

interface StoredIdentity {
  playerName: string;
  avatarId: AvatarId;
}

function readStoredIdentity(): StoredIdentity | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredIdentity>;
    if (typeof parsed.playerName !== "string") return null;
    const avatarId = AVATAR_OPTIONS.some((a) => a.id === parsed.avatarId) ? (parsed.avatarId as AvatarId) : DEFAULT_AVATAR_ID;
    return { playerName: parsed.playerName, avatarId };
  } catch {
    // Private browsing / blocked storage — treat as "nothing stored".
    return null;
  }
}

function writeStoredIdentity(identity: StoredIdentity): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  } catch {
    // Storage full/blocked — persistence is a nicety, not required.
  }
}

/**
 * The guest's chosen display name and avatar — persisted to localStorage
 * (just those two cosmetic, self-chosen values, nothing else) purely so a
 * refresh on the sign-in/rooms pages doesn't forget them.
 *
 * This is deliberately NOT the same as persisting a session or identity:
 * the socket's `playerId` (see socket-client.ts) still lives in memory
 * only and is never written anywhere, so refreshing mid-round still
 * disconnects you and reconnects as a brand-new player with no way to
 * resume your spot in the room — that's unchanged and intentional. There
 * is no resumable session token, cookie, or server-side identifier
 * involved here, just a nickname and a picture the guest picked for
 * themself, stored on their own device.
 */
export function PlayerIdentityProvider({ children }: { children: React.ReactNode }) {
  const [playerName, setPlayerNameState] = useState("");
  const [avatarId, setAvatarIdState] = useState<AvatarId>(DEFAULT_AVATAR_ID);
  const [isHydrated, setIsHydrated] = useState(false);

  // Reads from localStorage only after mount (never during SSR/first
  // paint) to avoid a server/client markup mismatch — see isHydrated doc.
  // The setState calls are deferred into a timer callback rather than
  // called synchronously in the effect body — see react-hooks/set-state-in-effect.
  useEffect(() => {
    const timer = setTimeout(() => {
      const stored = readStoredIdentity();
      if (stored) {
        setPlayerNameState(stored.playerName);
        setAvatarIdState(stored.avatarId);
      }
      setIsHydrated(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  function setPlayerName(name: string) {
    setPlayerNameState(name);
    writeStoredIdentity({ playerName: name, avatarId });
  }

  function setAvatarId(id: AvatarId) {
    setAvatarIdState(id);
    writeStoredIdentity({ playerName, avatarId: id });
  }

  return (
    <PlayerIdentityContext.Provider value={{ playerName, setPlayerName, avatarId, setAvatarId, isHydrated }}>
      {children}
    </PlayerIdentityContext.Provider>
  );
}
