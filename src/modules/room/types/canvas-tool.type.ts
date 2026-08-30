/**
 * Local UI-only state (which tool the drawer currently has selected) —
 * not part of the socket protocol, so a plain union rather than a shared
 * enum. The line/shape tools (line, square/circle outline or filled)
 * don't need their own DrawAction kind on the wire — CanvasBoard reduces
 * a dragged line or shape down to the two primitives the backend already
 * understands: a line is a 2-point stroke, an outline is a closed
 * poly-line stroke, and "filled" is that same outline stroke followed by
 * a bucket-fill click at its center. "eraser" doesn't need one either —
 * it's just a normal stroke painted in the canvas's own background color
 * (see CanvasBoard), not a true pixel-clearing wire primitive.
 */
export type CanvasTool = "pen" | "eraser" | "fill" | "line" | "square" | "square-filled" | "circle" | "circle-filled";
