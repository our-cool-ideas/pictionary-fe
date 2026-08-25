/** Local UI-only state (which tool the drawer currently has selected) — not part of the socket protocol, so a plain union rather than a shared enum. */
export type CanvasTool = "pen" | "fill";
