// Mirrors pictionary-be's game event payload shapes (modules/game/game.type.ts).

export interface TurnStartedPayload {
  turnNumber: number;
  drawerId: string;
  drawerName: string;
  wordLength: number;
  turnEndsAt: number;
  scores: Record<string, number>;
}

export interface CorrectGuessPayload {
  playerId: string;
  name: string;
  guesserScore: number;
  drawerId: string;
  drawerScore: number;
}

export interface TurnEndedPayload {
  word: string;
  drawerId: string;
  correctGuesserIds: string[];
  scores: Record<string, number>;
}

export interface GameOverPayload {
  winnerId: string | null;
  winnerName: string;
  scores: Record<string, number>;
}

export interface StrokePoint {
  x: number;
  y: number;
}

export interface StrokeAction {
  kind: "stroke";
  points: StrokePoint[];
  color: string;
  width: number;
  drawerId: string;
}

/** A single flood-fill click — replayed against whatever's already drawn at that point in the action list, see canvas-board.tsx's floodFill(). */
export interface FillAction {
  kind: "fill";
  x: number;
  y: number;
  color: string;
  drawerId: string;
}

/** Ordered list of everything drawn this turn — strokes and fills interleaved in the order they happened. */
export type DrawAction = StrokeAction | FillAction;
