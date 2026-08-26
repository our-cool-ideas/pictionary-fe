// Mirrors pictionary-be's TURN_DURATION_MS (modules/game/game.constant.ts) —
// the server owns the actual deadline (TurnStartedPayload.turnEndsAt), this
// is only used client-side to turn that deadline into a fraction-remaining
// for the draining progress bar (see use-turn-progress.ts). If the two ever
// drift the bar just starts partway full/empty instead of at exactly 100%
// — cosmetic only, never affects the real turn timing.
export const TURN_DURATION_MS = 60_000;
