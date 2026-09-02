import { initialRoomSessionState, type RoomSessionAction, type RoomSessionState } from "./room-session.type";

function systemMessage(
  text: string,
  flags?: { isCorrectGuess?: boolean; isCloseGuess?: boolean },
): RoomSessionState["chatMessages"][number] {
  return { id: `system-${Date.now()}-${Math.random()}`, playerId: "system", name: "System", message: text, sentAt: Date.now(), isSystem: true, ...flags };
}

export function roomSessionReducer(state: RoomSessionState, action: RoomSessionAction): RoomSessionState {
  switch (action.type) {
    case "SET_ROOM":
      return { ...state, room: action.room };

    case "CHAT_MESSAGE":
      return { ...state, chatMessages: [...state.chatMessages, action.message] };

    case "TURN_STARTED":
      // A new turn always starts with a clean slate — no carried-over
      // guesses/word/canvas. `correctGuesserIds` comes straight off the
      // payload rather than being hardcoded to [] here, though: for a
      // genuinely fresh turn the server already sends it empty, but for
      // the mid-turn catch-up a late joiner receives (see
      // getCurrentTurnStarted in pictionary-be), it's the real list of
      // who's already guessed right this turn.
      return {
        ...state,
        currentTurn: action.payload,
        yourWord: null,
        correctGuesserIds: action.payload.correctGuesserIds,
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
        // Points land the instant the guess is scored, not just at the
        // end of the turn — the payload already carries both updated
        // totals, so merge them straight into the live scoreboard.
        currentTurn: state.currentTurn && {
          ...state.currentTurn,
          scores: {
            ...state.currentTurn.scores,
            [action.payload.playerId]: action.payload.guesserScore,
            [action.payload.drawerId]: action.payload.drawerScore,
          },
        },
        // No emoji in the text — ChatPanel renders a real Target icon
        // next to isCorrectGuess lines instead (matches the app's
        // hand-drawn/lucide icon language rather than emoji glyphs).
        chatMessages: [...state.chatMessages, systemMessage(`${action.payload.name} has hit the answer`, { isCorrectGuess: true })],
      };

    // Private to this client only — the server never broadcasts a
    // near-miss guess (see game.handler.ts's "close" outcome), it just
    // tells the guesser's own socket, so this never shows up in anyone
    // else's chat. Echoes back the guesser's own typed word, not the
    // actual answer.
    case "CLOSE_GUESS":
      return { ...state, chatMessages: [...state.chatMessages, systemMessage(`${action.guess} is quite close`, { isCloseGuess: true })] };

    case "TURN_ENDED":
      return {
        ...state,
        currentTurn: null,
        yourWord: null,
        lastTurnResult: action.payload,
        chatMessages: [...state.chatMessages, systemMessage(`Turn over — the word was "${action.payload.word}".`)],
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
