// Mirrors pictionary-be's PublicRoomState/PublicRoomPlayer (modules/room/room.type.ts)
// — the sanitized shape the server actually sends, never the internal one
// (no socketId/ip/userId — see the backend README's note on that fix).

import type { ROOM_VISIBILITY } from "@/lib/enums/room-visibility.enum";

export interface RoomPlayer {
  playerId: string;
  name: string;
  /** A closed set of ids matching modules/player/constants/avatar.constant.ts — look up the actual color/glyph via getAvatarOption(). */
  avatarId: string;
  isGuest: boolean;
  isHost: boolean;
  connected: boolean;
  joinedAt: number;
}

export interface RoomSettings {
  categoryId: string;
  turnsPerPlayer: number | null;
  targetScore: number | null;
  maxPlayers: number;
  visibility: ROOM_VISIBILITY;
}

export interface RoomState {
  code: string;
  hostPlayerId: string;
  settings: RoomSettings;
  createdAt: number;
  emptySince: number | null;
  aloneSince: number | null;
  players: RoomPlayer[];
}

export interface ChatMessage {
  id: string;
  playerId: string;
  name: string;
  message: string;
  sentAt: number;
  /** A server-generated announcement (correct guess, turn ended) rendered distinctly from a player's own words. */
  isSystem?: boolean;
  /** Narrows isSystem down to specifically "someone guessed right" — ChatPanel renders these bold italic orange, with an emoji, instead of the generic muted system style. */
  isCorrectGuess?: boolean;
  /** Narrows isSystem down to "this client's own near-miss guess" — private to the guesser (never broadcast), rendered bold italic blue. */
  isCloseGuess?: boolean;
}
