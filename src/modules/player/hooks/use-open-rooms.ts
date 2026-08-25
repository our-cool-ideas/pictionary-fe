"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { OpenRoomListItem } from "@/modules/player/types/room-list.type";

/**
 * Public, unauthenticated, like usePublicCategories. Polled on an interval
 * rather than socket-pushed — the home page isn't in any particular room's
 * Socket.IO channel yet (there's no "lobby" broadcast concept), and a 5s
 * poll is plenty responsive for "browse open rooms and pick one to join."
 */
export function useOpenRooms() {
  return useQuery({
    queryKey: ["open-rooms"],
    queryFn: () => apiClient.get<{ rooms: OpenRoomListItem[] }>("rooms"),
    refetchInterval: 5000,
  });
}
