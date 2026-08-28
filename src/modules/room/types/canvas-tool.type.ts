/**
 * Local UI-only state (which tool the drawer currently has selected) —
 * not part of the socket protocol, so a plain union rather than a shared
 * enum. The line/shape tools (line, square/circle outline or filled)
 * don't need their own DrawAction kind on the wire — CanvasBoard reduces
 * a dragged line or shape down to the two primitives the backend already
 * understands: a line is a 2-point stroke, an outline is a closed
 * poly-line stroke, and "filled" is that same outline stroke followed by
 * a bucket-fill click at its center.
 */
export type CanvasTool = "pen" | "fill" | "line" | "square" | "square-filled" | "circle" | "circle-filled";
