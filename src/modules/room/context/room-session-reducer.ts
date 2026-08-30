import { initialRoomSessionState, type RoomSessionAction, type RoomSessionState } from "./room-session.type";

function systemMessage(text: string, isCorrectGuess = false): RoomSessionState["chatMessages"][number] {
  return { id: `system-${Date.now()}-${Math.random()}`, playerId: "system", name: "System", message: text, sentAt: Date.now(), isSystem: true, isCorrectGuess };
}

export function roomSessionReducer(state: RoomSessionState, action: RoomSessionAction): RoomSessionState {
  switch (action.type) {
    case "SET_ROOM":
      return { ...state, room: action.room };

    case "CHAT_MESSAGE":
      return { ...state, chatMessages: [...state.chatMessages, action.message] };

    case "TURN_STARTED":
      // A new turn always starts with a clean slate — no carried-over guesses/word/canvas.
      return {
        ...state,
        currentTurn: action.payload,
        yourWord: null,
        correctGuesserIds: [],
        lastTurnResult: null,
        strokes: [],
        chatMessages: [...state.chatMessages, systemMessage(`${action.payload.drawerName} is drawing now — go!`)],
      };

    case "YOUR_WORD":
      return { ...state, yourWord: action.word };

    case "CORRECT_GUESS":
      return {
        ...state,
        correctGuesserIds: [...state.correctGuesserIds, action.payload.playerId],
        chatMessages: [...state.chatMessages, systemMessage(`${action.payload.name} has hit the answer`, true)],
      };

    case "TURN_ENDED":
      return {
        ...state,
        currentTurn: null,
        yourWord: null,
        lastTurnResult: action.payload,
        chatMessages: [...state.chatMessages, systemMessage(`Turn over — the word was "${action.payload.word}".`)],
      };

    case "GAME_OVER":
      return {
        ...state,
        currentTurn: null,
        yourWord: null,
        gameOver: action.payload,
        chatMessages: [
          ...state.chatMessages,
          systemMessage(action.payload.winnerId ? `${action.payload.winnerName} wins with ${action.payload.scores[action.payload.winnerId]} points!` : "Game ended — not enough players."),
        ],
      };

    case "STROKE_BROADCAST":
      return { ...state, strokes: [...state.strokes, action.stroke] };

    case "STROKE_HISTORY":
      return { ...state, strokes: action.strokes };

    case "CANVAS_CLEARED":
      return { ...state, strokes: [] };

    case "YOU_WERE_KICKED":
      return { ...initialRoomSessionState, youWereKicked: true };

    case "ROOM_CLOSED":
      return { ...initialRoomSessionState, roomClosed: true };

    case "RESET":
      return initialRoomSessionState;

    default:
      return state;
  }
}
