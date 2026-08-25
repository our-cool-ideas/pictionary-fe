/** Shape of one row from GET /rooms (public) — mirrors pictionary-be's RoomListItem. */
export interface OpenRoomListItem {
  code: string;
  hostName: string | null;
  category: { id: string; name: string; icon: string | null } | null;
  playerCount: number;
  maxPlayers: number;
  createdAt: number;
}
