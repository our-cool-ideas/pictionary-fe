import { clsx, type ClassValue } from "clsx"
import type { CSSProperties } from "react"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Every primary button in this app draws its own flat drop shadow via
// `shadow-[Npx_Npx_0_var(--color-play-ink)]` (the "sticker" look) — but
// on its own that shadow just sits there, static, no matter how hard you
// click. PRESS_CLASS is the shared, purely-visual feedback for that: on
// press the button slides by (--press-x, --press-y) — exactly the same
// N as its own shadow offset — and its shadow disappears, so the button
// visually meets its own shadow and looks physically pushed in, then
// springs back on release.
//
// This is ONE static class string reused everywhere rather than a
// `pressable(n)` helper returning `translate-x-[${n}px]` per call site —
// Tailwind's build only generates CSS for arbitrary-value classes that
// appear as a complete, literal string somewhere in the source; a
// runtime-interpolated one is invisible to that scan and silently
// produces no CSS at all. Referencing a CSS custom property instead
// (`translate-x-[var(--press-x)]`) keeps the class itself static while
// still letting each button supply its own offset — via `pressStyle`
// below, matching whatever its own shadow offset already is.
export const PRESS_CLASS = "transition-transform active:translate-x-[var(--press-x)] active:translate-y-[var(--press-y)] active:shadow-none";

/** Pass the same N (in px) as the button's own `shadow-[Npx_Npx_0_...]` offset. */
export function pressStyle(offsetPx: number): CSSProperties {
  return { "--press-x": `${offsetPx}px`, "--press-y": `${offsetPx}px` } as CSSProperties;
}
