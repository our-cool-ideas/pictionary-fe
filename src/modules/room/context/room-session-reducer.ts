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

    // A separate action from SET_ROOM (even though it also carries a fresh
    // room) specifically so it can drop its own system-chat announcement —
    // the old host disconnecting/leaving/being kicked already gets its own
    // message from whichever of those triggered it; this is purely "and by
    // the way, X is the new host now."
    case "HOST_CHANGED":
      return { ...state, room: action.room, chatMessages: [...state.chatMessages, systemMessage(`${action.newHostName} is now the host!`)] };

    case "CHAT_MESSAGE":
      return { ...state, chatMessages: [...state.chatMessages, action.message] };

    // A drawer's been picked and is choosing between two words — nobody
    // can guess yet (currentTurn is still null), but the canvas needs to
    // show *something* other than a frozen pre-game card, hence this
    // being its own state rather than just waiting for TURN_STARTED.
    case "WORD_CHOICE_PENDING":
      return {
        ...state,
        wordChoicePending: action.payload,
        myWordChoices: null,
        turnSkipped: null,
        lastTurnResult: null,
        chatMessages: [...state.chatMessages, systemMessage(`${action.payload.drawerName} is picking a word…`)],
      };

    // Only ever received by the drawer themselves — see WordChoicesPayload's doc comment.
    case "WORD_CHOICES":
      return { ...state, myWordChoices: action.payload };

    // The drawer didn't pick in time — no word, no turn, straight to
    // whoever's next. wordChoicePending/myWordChoices clear out here
    // rather than waiting for the next WORD_CHOICE_PENDING, so the
    // "picking a word" UI doesn't linger through the skip message.
    case "TURN_SKIPPED":
      return {
        ...state,
        turnSkipped: action.payload,
        wordChoicePending: null,
        myWordChoices: null,
        chatMessages: [...state.chatMessages, systemMessage(`${action.payload.drawerName}'s turn was skipped — no word chosen in time.`)],
      };

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
        liveScores: action.payload.scores,
        lastTurnResult: null,
        wordChoicePending: null,
        myWordChoices: null,
        turnSkipped: null,
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
        // totals, so merge them straight into the live scoreboard (both
        // here in liveScores, the one Scoreboard actually reads from,
        // and in currentTurn.scores for anything still keying off that).
        liveScores: {
          ...state.liveScores,
          [action.payload.playerId]: action.payload.guesserScore,
          [action.payload.drawerId]: action.payload.drawerScore,
        },
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
        liveScores: action.payload.scores,
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
