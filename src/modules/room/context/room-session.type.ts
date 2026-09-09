import type { ChatMessage, RoomState } from "@/modules/room/types/room.type";
import type {
  CorrectGuessPayload,
  DrawAction,
  TurnEndedPayload,
  TurnStartedPayload,
  WordChoicePendingPayload,
  WordChoicesPayload,
  TurnSkippedPayload,
} from "@/modules/room/types/game.type";

export interface RoomSessionState {
  room: RoomState | null;
  currentTurn: TurnStartedPayload | null;
  /** Only ever populated for the local player when they're the drawer — never received otherwise. */
  yourWord: string | null;
  correctGuesserIds: string[];
  /**
   * The one source of truth Scoreboard reads scores from — unlike
   * `currentTurn`/`lastTurnResult`, this is NEVER null/reset just because
   * the game moved into a phase that doesn't have a turn/result of its
   * own (word-choice pending, a skipped turn). It used to be derived as
   * `currentTurn?.scores ?? lastTurnResult?.scores ?? {}` at the call
   * site (GameBoard), which fell through to `{}` — every score reading
   * 0 — for the entire word-choice window, since THAT phase clears both
   * of those fields (see the WORD_CHOICE_PENDING case below). Updated by
   * whichever event actually carries fresh scores (CORRECT_GUESS,
   * TURN_STARTED, TURN_ENDED) and left untouched by everything else.
   */
  liveScores: Record<string, number>;
  lastTurnResult: TurnEndedPayload | null;
  /** Set the instant a drawer's picked but hasn't chosen a word yet — null once they pick (currentTurn takes over) or the choice window times out (turnSkipped takes over instead). */
  wordChoicePending: WordChoicePendingPayload | null;
  /** Only ever populated for the local player when they're the one picking — never received otherwise (see WordChoicesPayload's own doc comment). */
  myWordChoices: WordChoicesPayload | null;
  /** Set for a beat when a drawer's turn is skipped for not picking in time — cleared the moment the next wordChoicePending arrives. */
  turnSkipped: TurnSkippedPayload | null;
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
  liveScores: {},
  lastTurnResult: null,
  wordChoicePending: null,
  myWordChoices: null,
  turnSkipped: null,
  chatMessages: [],
  strokes: [],
  youWereKicked: false,
  roomClosed: false,
};

export type RoomSessionAction =
  | { type: "SET_ROOM"; room: RoomState }
  | { type: "HOST_CHANGED"; room: RoomState; newHostName: string }
  | { type: "CHAT_MESSAGE"; message: ChatMessage }
  | { type: "WORD_CHOICE_PENDING"; payload: WordChoicePendingPayload }
  | { type: "WORD_CHOICES"; payload: WordChoicesPayload }
  | { type: "TURN_SKIPPED"; payload: TurnSkippedPayload }
  | { type: "TURN_STARTED"; payload: TurnStartedPayload }
  | { type: "YOUR_WORD"; word: string }
  | { type: "CORRECT_GUESS"; payload: CorrectGuessPayload }
  | { type: "CLOSE_GUESS"; guess: string }
  | { type: "TURN_ENDED"; payload: TurnEndedPayload }
  | { type: "STROKE_BROADCAST"; stroke: DrawAction }
  | { type: "STROKE_HISTORY"; strokes: DrawAction[] }
  | { type: "CANVAS_CLEARED" }
  | { type: "YOU_WERE_KICKED" }
  | { type: "ROOM_CLOSED" }
  | { type: "RESET" };
