// Mirrors pictionary-be/src/enum/socket-event.ts — kept in sync manually.
export enum SOCKET_EVENT {
  IDENTITY = "identity",

  ROOM_CREATE = "room:create",
  ROOM_JOIN = "room:join",
  ROOM_LEAVE = "room:leave",
  ROOM_KICK = "room:kick",
  ROOM_CHAT = "room:chat",

  ROOM_PLAYER_JOINED = "room:player_joined",
  ROOM_PLAYER_LEFT = "room:player_left",
  ROOM_PLAYER_KICKED = "room:player_kicked",
  ROOM_PLAYER_DISCONNECTED = "room:player_disconnected",
  ROOM_PLAYER_RECONNECTED = "room:player_reconnected",
  ROOM_CHAT_MESSAGE = "room:chat_message",
  ROOM_CLOSED = "room:closed",

  GAME_START = "game:start",
  GAME_STROKE = "game:stroke",
  GAME_FILL = "game:fill",
  GAME_CLEAR_CANVAS = "game:clear_canvas",
  GAME_UNDO = "game:undo",
  GAME_REDO = "game:redo",

  GAME_TURN_STARTED = "game:turn_started",
  GAME_STROKE_BROADCAST = "game:stroke_broadcast",
  GAME_CANVAS_CLEARED = "game:canvas_cleared",
  GAME_CORRECT_GUESS = "game:correct_guess",
  GAME_TURN_ENDED = "game:turn_ended",
  GAME_OVER = "game:over",

  GAME_YOUR_WORD = "game:your_word",
  GAME_STROKE_HISTORY = "game:stroke_history",
}
