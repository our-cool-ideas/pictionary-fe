"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { createQueryClient } from "@/lib/query-client";
import { SocketProvider } from "@/components/socket-provider";
import { PlayerIdentityProvider } from "@/components/player-identity-provider";
import { RoomSessionProvider } from "@/modules/room/context/room-session-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <PlayerIdentityProvider>
          <RoomSessionProvider>
            <TooltipProvider>
              {children}
              <Toaster richColors position="top-right" />
            </TooltipProvider>
          </RoomSessionProvider>
        </PlayerIdentityProvider>
      </SocketProvider>
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
