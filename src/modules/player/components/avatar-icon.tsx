import { AVATAR_ICON } from "@/modules/player/constants/avatar.constant";

const PATHS: Record<AVATAR_ICON, React.ReactNode> = {
  [AVATAR_ICON.STAR]: <path d="M9 1L11 6.2L16.5 6.6L12.3 10.1L13.7 15.5L9 12.3L4.3 15.5L5.7 10.1L1.5 6.6L7 6.2Z" />,
  [AVATAR_ICON.BOLT]: <path d="M10 1L3.5 10H8L6.5 17L14.5 7.5H9.5Z" />,
  [AVATAR_ICON.CONTROLLER]: (
    <>
      <path d="M4 6h10a3.5 3.5 0 0 1 3.4 4.4l-.6 2.3a2.2 2.2 0 0 1-3.9.8L11.6 12H6.4l-1.3 1.5a2.2 2.2 0 0 1-3.9-.8l-.6-2.3A3.5 3.5 0 0 1 4 6Z" />
      <rect x="5.6" y="8.3" width="1.4" height="3.4" rx="0.5" />
      <rect x="4.4" y="9.5" width="3.8" height="1.4" rx="0.5" />
      <circle cx="13.3" cy="8.8" r="1" />
      <circle cx="15.3" cy="10.8" r="1" />
    </>
  ),
  [AVATAR_ICON.HEART]: (
    <path d="M9 15.5S2 11.2 2 6.6C2 4 4 2.3 6.3 2.3c1.2 0 2.2.6 2.7 1.5.5-.9 1.5-1.5 2.7-1.5C14 2.3 16 4 16 6.6c0 4.6-7 8.9-7 8.9Z" />
  ),
  [AVATAR_ICON.MOON]: <path d="M12.5 2.2A7 7 0 1 0 12.5 15.8 5.6 5.6 0 0 1 12.5 2.2Z" />,
  [AVATAR_ICON.GEM]: <path d="M9 2L15 7L9 16L3 7Z" />,
};

interface AvatarIconProps {
  icon: AVATAR_ICON;
  size?: number;
  className?: string;
}

/** One of the six hand-drawn avatar glyphs — see avatar.constant.ts. Always filled currentColor, never emoji. */
export function AvatarIcon({ icon, size = 18, className }: AvatarIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="currentColor" className={className} aria-hidden="true">
      {PATHS[icon]}
    </svg>
  );
}
