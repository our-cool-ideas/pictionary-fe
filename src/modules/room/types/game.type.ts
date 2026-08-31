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
  /**
   * "everyone_guessed" ends the turn early once every connected non-drawer
   * has scored — a brief celebration, still an ordinary turn change (no
   * leaderboard). "round_won" means someone just reached the winning
   * score — CanvasBoard shows the top-3 leaderboard for this one, for the
   * much longer ROUND_TRANSITION_DELAY_MS, before scores reset and a
   * fresh round starts. "timeout" is just the clock running out.
   */
  reason: "everyone_guessed" | "timeout" | "round_won";
  /** When the next turn (or, for "round_won", the next round) is scheduled to start — drives CanvasBoard's post-turn countdown. */
  nextTurnAt: number;
  /** Only present when reason is "round_won". */
  winnerId?: string;
  winnerName?: string;
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
