import type { Socket } from "socket.io-client";

/** Mirrors pictionary-be's SocketAck — every emitAck response is shaped like this. */
export interface SocketAckResponse<T> {
  status: number;
  data: T | null;
  error: string | null;
  message: string;
}

/** Generic emit-with-acknowledgement helper — not room/game-specific, reusable for any socket event. */
export function emitWithAck<T>(socket: Socket, event: string, payload: unknown, timeoutMs = 8000): Promise<SocketAckResponse<T>> {
  return new Promise((resolve) => {
    socket.timeout(timeoutMs).emit(event, payload, (err: unknown, response: SocketAckResponse<T>) => {
      if (err) {
        resolve({ status: 0, data: null, error: "TIMEOUT", message: "The server didn't respond in time." });
        return;
      }
      resolve(response);
    });
  });
}
