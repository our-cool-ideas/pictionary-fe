"use client";

import { useContext } from "react";
import { RoomSessionContext, type RoomSessionContextValue } from "./room-session-provider";

export function useRoomSession(): RoomSessionContextValue {
  const context = useContext(RoomSessionContext);
  if (!context) throw new Error("useRoomSession must be used within a RoomSessionProvider");
  return context;
}
