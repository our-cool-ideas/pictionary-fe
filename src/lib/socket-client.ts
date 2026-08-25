import { io, type Socket } from "socket.io-client";

/**
 * A single socket connection for the whole app (created once, reused —
 * not one per component). `auth` is a function, not a plain object, so
 * every (re)connection attempt picks up the *current* playerId — this is
 * what lets a reconnect within the same tab identify as the same player
 * without ever writing anything to a cookie or localStorage.
 */
let socket: Socket | null = null;
let storedPlayerId: string | null = null;

export function setStoredPlayerId(playerId: string): void {
  storedPlayerId = playerId;
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
