// Mirrors pictionary-be's game event payload shapes (modules/game/game.type.ts).

/** Broadcast to the whole room the instant a drawer is picked, before they've chosen a word — CanvasBoard shows "X is picking a word…" during this window. Never carries the actual word options. */
export interface WordChoicePendingPayload {
  turnNumber: number;
  drawerId: string;
  drawerName: string;
  wordChoiceEndsAt: number;
}

/** Sent to the drawer only — the actual two options, never broadcast. */
export interface WordChoicesPayload {
  choices: { id: string; text: string }[];
  wordChoiceEndsAt: number;
}

/** Broadcast when a drawer let the word-choice window run out without picking — their turn is skipped outright, no drawing happens. */
export interface TurnSkippedPayload {
  drawerId: string;
  drawerName: string;
  /** When the next word-choice phase is scheduled to start — same brief-pause idea as TurnEndedPayload.nextTurnAt. */
  nextChoiceAt: number;
}

export interface TurnStartedPayload {
  turnNumber: number;
  drawerId: string;
  drawerName: string;
  wordLength: number;
  turnEndsAt: number;
  scores: Record<string, number>;
  /**
   * Always [] for a genuinely fresh turn — only meaningfully non-empty
   * when this is the mid-turn catch-up a late joiner receives, who needs
   * to know who's already guessed right, not just that a turn is running.
   */
  correctGuesserIds: string[];
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
