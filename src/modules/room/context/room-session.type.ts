import type { ChatMessage, RoomState } from "@/modules/room/types/room.type";
import type { CorrectGuessPayload, DrawAction, GameOverPayload, TurnEndedPayload, TurnStartedPayload } from "@/modules/room/types/game.type";

export interface RoomSessionState {
  room: RoomState | null;
  currentTurn: TurnStartedPayload | null;
  /** Only ever populated for the local player when they're the drawer — never received otherwise. */
  yourWord: string | null;
  correctGuesserIds: string[];
  lastTurnResult: TurnEndedPayload | null;
  gameOver: GameOverPayload | null;
  chatMessages: ChatMessage[];
  strokes: DrawAction[];
  youWereKicked: boolean;
  roomClosed: boolean;
}

export const initialRoomSessionState: RoomSessionState = {
  room: null,
  currentTurn: null,
  yourWord: null,
  correctGuesserIds: [],
  lastTurnResult: null,
  gameOver: null,
  chatMessages: [],
  strokes: [],
  youWereKicked: false,
  roomClosed: false,
};

export type RoomSessionAction =
  | { type: "SET_ROOM"; room: RoomState }
  | { type: "CHAT_MESSAGE"; message: ChatMessage }
  | { type: "TURN_STARTED"; payload: TurnStartedPayload }
  | { type: "YOUR_WORD"; word: string }
  | { type: "CORRECT_GUESS"; payload: CorrectGuessPayload }
  | { type: "TURN_ENDED"; payload: TurnEndedPayload }
  | { type: "GAME_OVER"; payload: GameOverPayload }
  | { type: "STROKE_BROADCAST"; stroke: DrawAction }
  | { type: "STROKE_HISTORY"; strokes: DrawAction[] }
  | { type: "CANVAS_CLEARED" }
  | { type: "YOU_WERE_KICKED" }
  | { type: "ROOM_CLOSED" }
  | { type: "RESET" };
