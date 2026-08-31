// Mirrors pictionary-be's TURN_DURATION_MS (modules/game/game.constant.ts) —
// the server owns the actual deadline (TurnStartedPayload.turnEndsAt), this
// is only used client-side to turn that deadline into a fraction-remaining
// for the draining progress bar (see use-turn-progress.ts). If the two ever
// drift the bar just starts partway full/empty instead of at exactly 100%
// — cosmetic only, never affects the real turn timing.
export const TURN_DURATION_MS = 60_000;

// Mirrors pictionary-be's TURN_TRANSITION_DELAY_MS/ROUND_TRANSITION_DELAY_MS
// (modules/game/game.constant.ts) — the server owns the actual deadline
// (TurnEndedPayload.nextTurnAt), these are only used client-side to pick
// the right denominator for CanvasBoard's post-turn countdown: the brief
// ordinary turn-change pause, or the much longer one shown only alongside
// the round-won leaderboard. Same cosmetic-drift caveat as TURN_DURATION_MS above.
export const TURN_TRANSITION_DELAY_MS = 5_000;
export const ROUND_TRANSITION_DELAY_MS = 20_000;
