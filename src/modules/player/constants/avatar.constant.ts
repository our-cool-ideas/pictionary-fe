/**
 * Ten selectable guest avatars — small hand-drawn character illustrations
 * (face shape + hair + eyes + mouth + shirt), never emoji, unlike the
 * category icons which are real backend data. Each character has its own
 * fixed skin tone, hair color, eye style and iris color baked into its
 * SVG (see AvatarIcon) — `color` here is only the shirt/hoodie color,
 * which doubles as the badge's circular backdrop so the shirt blends into
 * it (see AvatarBadge/AvatarPicker/Scoreboard/PlayerDetailModal, all of
 * which pass `avatar.color` to both the backdrop `<span>` and AvatarIcon).
 */
export enum AVATAR_ICON {
  GIRL_LONG = "girl-long",
  GIRL_PONYTAIL = "girl-ponytail",
  GIRL_BUN = "girl-bun",
  GIRL_BOB = "girl-bob",
  GIRL_PIXIE = "girl-pixie",
  BOY_SHORT = "boy-short",
  BOY_CURLY = "boy-curly",
  BOY_BUZZ = "boy-buzz",
  BOY_SPIKY = "boy-spiky",
  BOY_SIDEPART = "boy-sidepart",
}

export interface AvatarOption {
  id: string;
  color: string;
  icon: AVATAR_ICON;
  label: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: AVATAR_ICON.GIRL_LONG, color: "#FF5C7A", icon: AVATAR_ICON.GIRL_LONG, label: "Long hair" },
  { id: AVATAR_ICON.GIRL_PONYTAIL, color: "#8B5CF6", icon: AVATAR_ICON.GIRL_PONYTAIL, label: "Ponytail" },
  { id: AVATAR_ICON.GIRL_BUN, color: "#3FAE6A", icon: AVATAR_ICON.GIRL_BUN, label: "Bun" },
  { id: AVATAR_ICON.GIRL_BOB, color: "#FF7A33", icon: AVATAR_ICON.GIRL_BOB, label: "Bob" },
  { id: AVATAR_ICON.GIRL_PIXIE, color: "#2AA9A0", icon: AVATAR_ICON.GIRL_PIXIE, label: "Pixie" },
  { id: AVATAR_ICON.BOY_SHORT, color: "#2F6FEB", icon: AVATAR_ICON.BOY_SHORT, label: "Short hair" },
  { id: AVATAR_ICON.BOY_CURLY, color: "#B23A48", icon: AVATAR_ICON.BOY_CURLY, label: "Curly" },
  { id: AVATAR_ICON.BOY_BUZZ, color: "#FFC83D", icon: AVATAR_ICON.BOY_BUZZ, label: "Buzz cut" },
  { id: AVATAR_ICON.BOY_SPIKY, color: "#6C4AB6", icon: AVATAR_ICON.BOY_SPIKY, label: "Spiky" },
  { id: AVATAR_ICON.BOY_SIDEPART, color: "#D9488A", icon: AVATAR_ICON.BOY_SIDEPART, label: "Side part" },
];

export type AvatarId = (typeof AVATAR_OPTIONS)[number]["id"];

export const DEFAULT_AVATAR_ID: AvatarId = AVATAR_ICON.BOY_SHORT;

export function getAvatarOption(id: AvatarId): AvatarOption {
  return AVATAR_OPTIONS.find((a) => a.id === id) ?? AVATAR_OPTIONS.find((a) => a.id === DEFAULT_AVATAR_ID)!;
}
