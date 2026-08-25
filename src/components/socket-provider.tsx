"use client";

import { createContext, useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import { getSocket, setStoredPlayerId } from "@/lib/socket-client";
import { SOCKET_EVENT } from "@/lib/enums/socket-event.enum";

export interface SocketContextValue {
  socket: Socket;
  /** Null until the server's `identity` event arrives right after connecting. */
  playerId: string | null;
  isConnected: boolean;
}

export const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket] = useState(getSocket);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }
    function onDisconnect() {
      setIsConnected(false);
    }
    function onIdentity(payload: { playerId: string }) {
      setStoredPlayerId(payload.playerId);
      setPlayerId(payload.playerId);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on(SOCKET_EVENT.IDENTITY, onIdentity);

    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off(SOCKET_EVENT.IDENTITY, onIdentity);
      // Deliberately not calling socket.disconnect() — this provider wraps
      // the whole app and should only ever unmount when the tab closes.
    };
  }, [socket]);

  return <SocketContext.Provider value={{ socket, playerId, isConnected }}>{children}</SocketContext.Provider>;
}
