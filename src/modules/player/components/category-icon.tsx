import { Apple, Boxes, Car, Carrot, Clapperboard, Flag, Ghost, PawPrint, Refrigerator, Shapes, Shirt, Sparkles, UtensilsCrossed } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Keyed by category NAME (lowercased), not id/slug — every call site
// already has the name in hand, and it's the one field guaranteed
// present everywhere a category shows up (OpenRoomListItem's trimmed
// category shape doesn't even carry a slug). Only covers the current
// fixed starter set (see pictionary-be's word-bank.seed.ts) — anything
// an admin adds later just falls through to the generic Shapes glyph
// below rather than rendering blank.
const ICON_BY_CATEGORY_NAME: Record<string, LucideIcon> = {
  fruits: Apple,
  vegetables: Carrot,
  cars: Car,
  flag: Flag,
  "bollywood actors": Clapperboard,
  "cartoon characters": Ghost,
  food: UtensilsCrossed,
  animal: PawPrint,
  things: Boxes,
  objects: Boxes,
  clothes: Shirt,
  appliances: Refrigerator,
  "bhumika's special": Sparkles,
};

interface CategoryIconProps {
  name: string | null | undefined;
  className?: string;
  strokeWidth?: number;
}

/**
 * A themed line icon standing in for whatever emoji an admin typed into a
 * category's `icon` field (see category-form-dialog.tsx) — emoji render
 * inconsistently across platforms/fonts and read as a flat, off-theme
 * glyph next to this app's own thick-outline sticker icons everywhere
 * else (QuickCreateStrip, OpenRoomsList). Deliberately NOT used in the
 * admin category table/word-form select, though — those two are exactly
 * where an admin previews the raw emoji they themselves typed into the
 * `icon` field, so showing anything else there would be actively
 * misleading about what's actually stored.
 */
export function CategoryIcon({ name, className, strokeWidth = 2.2 }: CategoryIconProps) {
  const Icon = (name && ICON_BY_CATEGORY_NAME[name.trim().toLowerCase()]) || Shapes;
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
}
