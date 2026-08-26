"use client";

import { useContext } from "react";
import { PlayerIdentityContext, type PlayerIdentityContextValue } from "@/components/player-identity-provider";

export function usePlayerIdentity(): PlayerIdentityContextValue {
  const context = useContext(PlayerIdentityContext);
  if (!context) throw new Error("usePlayerIdentity must be used within a PlayerIdentityProvider");
  return context;
}
