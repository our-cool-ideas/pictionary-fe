import { io, type Socket } from "socket.io-client";

// Persisted so a genuine page refresh (not just a same-tab socket
// reconnect — the in-memory `storedPlayerId` below already survives
// that on its own) can still identify as the same player. Without this,
// every reload minted a brand-new guest playerId server-side (see
// socket.plugin.ts's guest fallback), which meant joinRoom's
// reconnect-by-playerId branch could never find the existing seat —
// a refresh mid-round always dropped you and re-joined as a stranger.
// Same trust model the backend already has for guests (whoever presents
// a given playerId in the auth handshake is treated as that player, no
// secret/signature involved) — persisting it doesn't introduce a new
// risk beyond that, since every player's playerId is already visible to
// everyone else in their room via the room state payload.
const PLAYER_ID_STORAGE_KEY = "pictionary.playerId";

function readStoredPlayerId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(PLAYER_ID_STORAGE_KEY);
  } catch {
    // Private browsing / blocked storage — falls back to a fresh guest id.
    return null;
  }
}

function writeStoredPlayerId(playerId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PLAYER_ID_STORAGE_KEY, playerId);
  } catch {
    // Storage full/blocked — persistence is a nicety, not required.
  }
}

/**
 * A single socket connection for the whole app (created once, reused —
 * not one per component). `auth` is a function, not a plain object, so
 * every (re)connection attempt picks up the *current* playerId.
 */
let socket: Socket | null = null;
let storedPlayerId: string | null = readStoredPlayerId();

export function setStoredPlayerId(playerId: string): void {
  storedPlayerId = playerId;
  writeStoredPlayerId(playerId);
}

export function getSocket(): Socket {
  if (socket) return socket;

  const url = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SOCKET_URL is not set");

  socket = io(url, {
    autoConnect: false,
    auth: (callback) => callback({ playerId: storedPlayerId ?? undefined }),
  });

  return socket;
}
