"use client";

import { createContext, useEffect, useReducer } from "react";
import { useSocket } from "@/hooks/use-socket";
import { SOCKET_EVENT } from "@/lib/enums/socket-event.enum";
import type { ROOM_VISIBILITY } from "@/lib/enums/room-visibility.enum";
import { emitWithAck } from "@/lib/socket-emit";
import { roomSessionReducer } from "./room-session-reducer";
import { initialRoomSessionState, type RoomSessionState } from "./room-session.type";
import type { ChatMessage, RoomState } from "@/modules/room/types/room.type";
import type {
  CorrectGuessPayload,
  DrawAction,
  GameOverPayload,
  StrokePoint,
  TurnEndedPayload,
  TurnStartedPayload,
} from "@/modules/room/types/game.type";

interface ActionResult {
  ok: boolean;
  message: string;
}

interface RoomActionResult extends ActionResult {
  /** The room's code, if the action succeeded — callers need this to redirect to /room/[code]. */
  code: string | null;
}

export interface RoomSessionActions {
  createRoom: (input: {
    name: string;
    categoryId: string;
    maxPlayers?: number;
    visibility: ROOM_VISIBILITY;
  }) => Promise<RoomActionResult>;
  joinRoom: (input: { roomCode: string; name: string }) => Promise<RoomActionResult>;
  leaveRoom: () => Promise<void>;
  kickPlayer: (playerId: string) => Promise<ActionResult>;
  sendMessage: (message: string) => Promise<ActionResult>;
  startGame: () => Promise<ActionResult>;
  submitStroke: (stroke: { points: StrokePoint[]; color: string; width: number }) => void;
  submitFill: (fill: { x: number; y: number; color: string }) => void;
  clearCanvas: () => void;
  undo: () => Promise<ActionResult>;
  redo: () => Promise<ActionResult>;
}

export interface RoomSessionContextValue {
  state: RoomSessionState;
  actions: RoomSessionActions;
}

export const RoomSessionContext = createContext<RoomSessionContextValue | null>(null);

export function RoomSessionProvider({ children }: { children: React.ReactNode }) {
  const { socket, playerId } = useSocket();
  const [state, dispatch] = useReducer(roomSessionReducer, initialRoomSessionState);

  useEffect(() => {
    const onRoomUpdate = (payload: { room: RoomState }) => dispatch({ type: "SET_ROOM", room: payload.room });

    const onPlayerKicked = (payload: { room: RoomState | null; playerId: string; youWereKicked?: boolean }) => {
      if (payload.youWereKicked) {
        dispatch({ type: "YOU_WERE_KICKED" });
      } else if (payload.room) {
        dispatch({ type: "SET_ROOM", room: payload.room });
      }
    };

    const onChatMessage = (payload: { playerId: string; name: string; message: string; sentAt: number }) => {
      const message: ChatMessage = { id: `${payload.playerId}-${payload.sentAt}`, ...payload };
      dispatch({ type: "CHAT_MESSAGE", message });
    };

    const onRoomClosed = () => dispatch({ type: "ROOM_CLOSED" });
    const onTurnStarted = (payload: TurnStartedPayload) => dispatch({ type: "TURN_STARTED", payload });
    const onYourWord = (payload: { word: string }) => dispatch({ type: "YOUR_WORD", word: payload.word });
    const onCorrectGuess = (payload: CorrectGuessPayload) => dispatch({ type: "CORRECT_GUESS", payload });
    const onTurnEnded = (payload: TurnEndedPayload) => dispatch({ type: "TURN_ENDED", payload });
    const onGameOver = (payload: GameOverPayload) => dispatch({ type: "GAME_OVER", payload });
    const onStrokeBroadcast = (stroke: DrawAction) => dispatch({ type: "STROKE_BROADCAST", stroke });
    const onStrokeHistory = (payload: { strokes: DrawAction[] }) => dispatch({ type: "STROKE_HISTORY", strokes: payload.strokes });
    const onCanvasCleared = () => dispatch({ type: "CANVAS_CLEARED" });

    socket.on(SOCKET_EVENT.ROOM_PLAYER_JOINED, onRoomUpdate);
    socket.on(SOCKET_EVENT.ROOM_PLAYER_LEFT, onRoomUpdate);
    socket.on(SOCKET_EVENT.ROOM_PLAYER_RECONNECTED, onRoomUpdate);
    socket.on(SOCKET_EVENT.ROOM_PLAYER_DISCONNECTED, onRoomUpdate);
    socket.on(SOCKET_EVENT.ROOM_PLAYER_KICKED, onPlayerKicked);
    socket.on(SOCKET_EVENT.ROOM_CHAT_MESSAGE, onChatMessage);
    socket.on(SOCKET_EVENT.ROOM_CLOSED, onRoomClosed);

    socket.on(SOCKET_EVENT.GAME_TURN_STARTED, onTurnStarted);
    socket.on(SOCKET_EVENT.GAME_YOUR_WORD, onYourWord);
    socket.on(SOCKET_EVENT.GAME_CORRECT_GUESS, onCorrectGuess);
    socket.on(SOCKET_EVENT.GAME_TURN_ENDED, onTurnEnded);
    socket.on(SOCKET_EVENT.GAME_OVER, onGameOver);
    socket.on(SOCKET_EVENT.GAME_STROKE_BROADCAST, onStrokeBroadcast);
    socket.on(SOCKET_EVENT.GAME_STROKE_HISTORY, onStrokeHistory);
    socket.on(SOCKET_EVENT.GAME_CANVAS_CLEARED, onCanvasCleared);

    return () => {
      socket.off(SOCKET_EVENT.ROOM_PLAYER_JOINED, onRoomUpdate);
      socket.off(SOCKET_EVENT.ROOM_PLAYER_LEFT, onRoomUpdate);
      socket.off(SOCKET_EVENT.ROOM_PLAYER_RECONNECTED, onRoomUpdate);
      socket.off(SOCKET_EVENT.ROOM_PLAYER_DISCONNECTED, onRoomUpdate);
      socket.off(SOCKET_EVENT.ROOM_PLAYER_KICKED, onPlayerKicked);
      socket.off(SOCKET_EVENT.ROOM_CHAT_MESSAGE, onChatMessage);
      socket.off(SOCKET_EVENT.ROOM_CLOSED, onRoomClosed);

      socket.off(SOCKET_EVENT.GAME_TURN_STARTED, onTurnStarted);
      socket.off(SOCKET_EVENT.GAME_YOUR_WORD, onYourWord);
      socket.off(SOCKET_EVENT.GAME_CORRECT_GUESS, onCorrectGuess);
      socket.off(SOCKET_EVENT.GAME_TURN_ENDED, onTurnEnded);
      socket.off(SOCKET_EVENT.GAME_OVER, onGameOver);
      socket.off(SOCKET_EVENT.GAME_STROKE_BROADCAST, onStrokeBroadcast);
      socket.off(SOCKET_EVENT.GAME_STROKE_HISTORY, onStrokeHistory);
      socket.off(SOCKET_EVENT.GAME_CANVAS_CLEARED, onCanvasCleared);
    };
  }, [socket]);

  const actions: RoomSessionActions = {
    async createRoom(input) {
      const res = await emitWithAck<{ room: RoomState }>(socket, SOCKET_EVENT.ROOM_CREATE, input);
      if (res.data?.room) dispatch({ type: "SET_ROOM", room: res.data.room });
      return { ok: res.status < 400, message: res.message, code: res.data?.room.code ?? null };
    },

    async joinRoom(input) {
      const res = await emitWithAck<{ room: RoomState }>(socket, SOCKET_EVENT.ROOM_JOIN, input);
      if (res.data?.room) dispatch({ type: "SET_ROOM", room: res.data.room });
      return { ok: res.status < 400, message: res.message, code: res.data?.room.code ?? null };
    },

    async leaveRoom() {
      await emitWithAck(socket, SOCKET_EVENT.ROOM_LEAVE, {});
      dispatch({ type: "RESET" });
    },

    async kickPlayer(playerId) {
      const res = await emitWithAck<{ room: RoomState }>(socket, SOCKET_EVENT.ROOM_KICK, { playerId });
      if (res.data?.room) dispatch({ type: "SET_ROOM", room: res.data.room });
      return { ok: res.status < 400, message: res.message };
    },

    async sendMessage(message) {
      const res = await emitWithAck(socket, SOCKET_EVENT.ROOM_CHAT, { message });
      return { ok: res.status < 400, message: res.message };
    },

    async startGame() {
      const res = await emitWithAck(socket, SOCKET_EVENT.GAME_START, {});
      return { ok: res.status < 400, message: res.message };
    },

    submitStroke(stroke) {
      // The server only broadcasts a stroke to everyone *else* in the room
      // — the drawer renders their own strokes immediately, optimistically,
      // rather than waiting on a round trip back to themselves.
      socket.emit(SOCKET_EVENT.GAME_STROKE, stroke);
      if (playerId) {
        dispatch({ type: "STROKE_BROADCAST", stroke: { kind: "stroke", ...stroke, drawerId: playerId } });
      }
    },

    submitFill(fill) {
      // Same reasoning as submitStroke — fire-and-forget plus an immediate
      // local render, since the server only broadcasts to everyone *else*.
      socket.emit(SOCKET_EVENT.GAME_FILL, fill);
      if (playerId) {
        dispatch({ type: "STROKE_BROADCAST", stroke: { kind: "fill", ...fill, drawerId: playerId } });
      }
    },

    clearCanvas() {
      socket.emit(SOCKET_EVENT.GAME_CLEAR_CANVAS, {});
      dispatch({ type: "CANVAS_CLEARED" });
    },

    async undo() {
      // No optimistic local update here, unlike stroke/fill — the server
      // is the only one that knows what the resulting action list looks
      // like, and it resends that full list via GAME_STROKE_HISTORY to
      // *everyone* including us, so the canvas updates through that
      // existing listener rather than a bespoke "remove the last one" path.
      const res = await emitWithAck(socket, SOCKET_EVENT.GAME_UNDO, {});
      return { ok: res.status < 400, message: res.message };
    },

    async redo() {
      const res = await emitWithAck(socket, SOCKET_EVENT.GAME_REDO, {});
      return { ok: res.status < 400, message: res.message };
    },
  };

  return <RoomSessionContext.Provider value={{ state, actions }}>{children}</RoomSessionContext.Provider>;
}
