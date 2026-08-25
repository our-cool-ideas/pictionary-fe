"use client";

import { useContext } from "react";
import { PlayerNameContext, type PlayerNameContextValue } from "@/components/player-name-provider";

export function usePlayerName(): PlayerNameContextValue {
  const context = useContext(PlayerNameContext);
  if (!context) throw new Error("usePlayerName must be used within a PlayerNameProvider");
  return context;
}
