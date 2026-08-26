/**
 * Six selectable guest avatars — a colored circle + a hand-drawn glyph
 * (never emoji, unlike the category icons which are real backend data).
 * Colors are literal hexes, not the `--color-play-*` tokens: three
 * (yellow/blue/orange) intentionally match the brand palette, the other
 * three (green/pink/purple) exist only to give the picker real variety
 * and have no meaning elsewhere in the app.
 */
export enum AVATAR_ICON {
  STAR = "star",
  BOLT = "bolt",
  CONTROLLER = "controller",
  HEART = "heart",
  MOON = "moon",
  GEM = "gem",
}

export interface AvatarOption {
  id: string;
  color: string;
  icon: AVATAR_ICON;
  label: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: "yellow", color: "#FFC83D", icon: AVATAR_ICON.STAR, label: "Star" },
  { id: "blue", color: "#2F6FEB", icon: AVATAR_ICON.BOLT, label: "Bolt" },
  { id: "orange", color: "#FF7A33", icon: AVATAR_ICON.CONTROLLER, label: "Controller" },
  { id: "green", color: "#3FAE6A", icon: AVATAR_ICON.HEART, label: "Heart" },
  { id: "pink", color: "#FF5C7A", icon: AVATAR_ICON.MOON, label: "Moon" },
  { id: "purple", color: "#8B5CF6", icon: AVATAR_ICON.GEM, label: "Gem" },
];

export type AvatarId = (typeof AVATAR_OPTIONS)[number]["id"];

export const DEFAULT_AVATAR_ID: AvatarId = "blue";

export function getAvatarOption(id: AvatarId): AvatarOption {
  return AVATAR_OPTIONS.find((a) => a.id === id) ?? AVATAR_OPTIONS[1];
}
