import { Briefcase, Car, ChefHat, CloudSun, Flag, Gamepad2, Ghost, PawPrint, Salad, Shapes, Shield, Smartphone, Tag, UtensilsCrossed, Wrench, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { RealisticGirlGlasses } from "@/modules/player/components/realistic-girl-glasses";

// Keyed by category NAME (lowercased), not id/slug — every call site
// already has the name in hand, and it's the one field guaranteed
// present everywhere a category shows up (OpenRoomListItem's trimmed
// category shape doesn't even carry a slug). Only covers the current
// fixed starter set (see pictionary-be's word-bank.seed.ts) — anything
// an admin adds later just falls through to the generic Shapes glyph
// below rather than rendering blank.
const ICON_BY_CATEGORY_NAME: Record<string, LucideIcon> = {
  "action & verbs": Zap,
  animals: PawPrint,
  "fruits & veggies": Salad,
  food: UtensilsCrossed,
  "cartoon characters": Ghost,
  "marvel & dc characters": Shield,
  flags: Flag,
  profession: Briefcase,
  "video games": Gamepad2,
  apps: Smartphone,
  logos: Tag,
  "kitchen items": ChefHat,
  tools: Wrench,
  vehicles: Car,
  "weather & nature": CloudSun,
};

// "Bhumika Specials" gets the actual GIRL_GLASSES avatar illustration
// (see RealisticGirlGlasses's own doc comment) instead of a Lucide glyph —
// by explicit request, since this category is named after that avatar.
// Handled as a separate special case rather than folding into
// ICON_BY_CATEGORY_NAME because RealisticGirlGlasses takes a `size` prop,
// not `strokeWidth` — it's a full illustration, not a themeable line icon.
const BHUMIKA_SPECIALS_NAME = "bhumika specials";

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
  if (name?.trim().toLowerCase() === BHUMIKA_SPECIALS_NAME) {
    return <RealisticGirlGlasses className={className} />;
  }
  const Icon = (name && ICON_BY_CATEGORY_NAME[name.trim().toLowerCase()]) || Shapes;
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
}
