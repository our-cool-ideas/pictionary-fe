import type { ReactNode } from "react";
import { AVATAR_ICON } from "@/modules/player/constants/avatar.constant";

/**
 * The ten hand-drawn player characters — see avatar.constant.ts for the
 * option list. Unlike the old single-glyph icons (plain `currentColor`
 * fills), each character here is a small layered illustration with its
 * own fixed skin tone, hair color, eye style/iris and mouth — only the
 * shirt/hoodie uses the `color` prop, so it blends into the circular
 * backdrop every call site paints behind this icon (see AvatarBadge,
 * AvatarPicker, Scoreboard, PlayerDetailModal). Everything is flat fills
 * plus a thick ink outline/stroke, matching the app's sticker look
 * elsewhere (thick borders, no gradients, no soft shading).
 */
const INK = "#1a1a2e";

const SKIN = { light: "#F2C9A0", tan: "#E8B48A", deep: "#A9673A" } as const;
const HAIR = {
  chestnut: "#6b4226",
  black: "#1f1b24",
  blonde: "#d9a441",
  darkBrown: "#3b2a20",
  navy: "#2b2438",
} as const;
const IRIS = { blue: "#4a7fc9", hazel: "#8a6a3f", green: "#3f8f5e", gray: "#6b7280", amber: "#c98a2e", brown: "#6b4226" } as const;
const BROW = { dark: "#3a2a1e", darker: "#2a1e14", blonde: "#7a5a1e" } as const;
const NOSE_SHADOW = { light: "#d69b73", tan: "#c98456", deep: "#8a4a28" } as const;

function Ears({ skin, wide = false }: { skin: string; wide?: boolean }) {
  const cx = wide ? 3.6 : 3.9;
  const cxR = wide ? 14.4 : 14.1;
  const cy = wide ? 8.7 : 8.4;
  return (
    <>
      <ellipse cx={cx} cy={cy} rx="0.9" ry="1.3" fill={skin} stroke={INK} strokeWidth="0.35" />
      <ellipse cx={cxR} cy={cy} rx="0.9" ry="1.3" fill={skin} stroke={INK} strokeWidth="0.35" />
    </>
  );
}

function Shoulders({ color }: { color: string }) {
  return <path d="M2.6 18C2.6 15 5.1 13.3 9 13.3C12.9 13.3 15.4 15 15.4 18Z" fill={color} stroke={INK} strokeWidth="0.45" strokeLinejoin="round" />;
}

function HoodieStrings() {
  return (
    <>
      <circle cx="8.3" cy="14.6" r="0.16" fill={INK} />
      <circle cx="9.7" cy="14.6" r="0.16" fill={INK} />
      <path d="M8.3 14.6L8.1 15.6" stroke={INK} strokeWidth="0.25" />
      <path d="M9.7 14.6L9.9 15.6" stroke={INK} strokeWidth="0.25" />
    </>
  );
}

function RoundCollar() {
  return <path d="M7.5 13.4C8 14 10 14 10.5 13.4" fill="none" stroke={INK} strokeWidth="0.3" />;
}

const FACE_OVAL = "M9 2.2C11.8 2.2 13.6 4.4 13.6 7.6C13.6 10 12.6 12.5 11 13.8C10.4 14.3 9.7 14.6 9 14.6C8.3 14.6 7.6 14.3 7 13.8C5.4 12.5 4.4 10 4.4 7.6C4.4 4.4 6.2 2.2 9 2.2Z";
const FACE_WIDE = "M9 2.4C12.2 2.4 14.2 4.8 14.2 7.9C14.2 11.4 12 14.3 9 14.3C6 14.3 3.8 11.4 3.8 7.9C3.8 4.8 5.8 2.4 9 2.4Z";
const FACE_SQUARE = "M9 2.3C11.6 2.3 13.4 4.3 13.6 6.9C13.7 9 13.4 11.2 12.3 12.7C11.7 13.5 10.9 13.9 9 13.9C7.1 13.9 6.3 13.5 5.7 12.7C4.6 11.2 4.3 9 4.4 6.9C4.6 4.3 6.4 2.3 9 2.3Z";

function Face({ shape, skin }: { shape: string; skin: string }) {
  return <path d={shape} fill={skin} stroke={INK} strokeWidth="0.45" strokeLinejoin="round" />;
}

function Eyebrows({ girl, color, cy = 8.8 }: { girl: boolean; color: string; cy?: number }) {
  const ry = girl ? 0.14 : 0.2;
  const rx = girl ? 0.85 : 0.9;
  const rot = girl ? 12 : 6;
  return (
    <>
      <ellipse cx="6.9" cy={cy} rx={rx} ry={ry} fill={color} transform={`rotate(-${rot} 6.9 ${cy})`} />
      <ellipse cx="11.1" cy={cy} rx={rx} ry={ry} fill={color} transform={`rotate(${rot} 11.1 ${cy})`} />
    </>
  );
}

function EyeDetail({ cx, cy, iris, r = 0.75, rIris = 0.42 }: { cx: number; cy: number; iris: string; r?: number; rIris?: number }) {
  return (
    <>
      <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.8} fill="#fff" stroke={INK} strokeWidth="0.15" />
      <circle cx={cx} cy={cy} r={rIris} fill={iris} />
      <circle cx={cx} cy={cy} r={rIris * 0.43} fill={INK} />
      <circle cx={cx - 0.25} cy={cy - 0.2} r="0.08" fill="#fff" />
    </>
  );
}

function RoundEyes({ iris, cy = 9.7 }: { iris: string; cy?: number }) {
  return (
    <>
      <EyeDetail cx={6.9} cy={cy} iris={iris} />
      <EyeDetail cx={11.1} cy={cy} iris={iris} />
    </>
  );
}

function BigEyes({ iris, cy = 9.6 }: { iris: string; cy?: number }) {
  return (
    <>
      <EyeDetail cx={6.85} cy={cy} iris={iris} r={0.95} rIris={0.52} />
      <EyeDetail cx={11.15} cy={cy} iris={iris} r={0.95} rIris={0.52} />
    </>
  );
}

function AlmondEyes({ iris, cy = 9.7 }: { iris: string; cy?: number }) {
  return (
    <>
      <ellipse cx="6.9" cy={cy} rx="0.8" ry="0.4" fill="#fff" stroke={INK} strokeWidth="0.15" transform={`rotate(-4 6.9 ${cy})`} />
      <ellipse cx="11.1" cy={cy} rx="0.8" ry="0.4" fill="#fff" stroke={INK} strokeWidth="0.15" transform={`rotate(4 11.1 ${cy})`} />
      <circle cx="6.9" cy={cy} r="0.34" fill={iris} />
      <circle cx="11.1" cy={cy} r="0.34" fill={iris} />
      <circle cx="6.9" cy={cy} r="0.15" fill={INK} />
      <circle cx="11.1" cy={cy} r="0.15" fill={INK} />
    </>
  );
}

function ClosedArc({ cx, cy = 9.75 }: { cx: number; cy?: number }) {
  return <path d={`M${cx - 0.75} ${cy}Q${cx} ${cy - 0.5} ${cx + 0.75} ${cy}`} fill="none" stroke={INK} strokeWidth="0.38" strokeLinecap="round" />;
}

function ClosedHappyEyes({ cy = 9.75 }: { cy?: number }) {
  return (
    <>
      <ClosedArc cx={6.9} cy={cy} />
      <ClosedArc cx={11.1} cy={cy} />
    </>
  );
}

function WinkEyes({ iris, cy = 9.7 }: { iris: string; cy?: number }) {
  return (
    <>
      <ClosedArc cx={6.9} cy={cy + 0.05} />
      <EyeDetail cx={11.1} cy={cy} iris={iris} />
    </>
  );
}

function Glasses({ cy = 9.7, r = 1.25 }: { cy?: number; r?: number }) {
  return (
    <>
      <circle cx="6.9" cy={cy} r={r} fill="none" stroke={INK} strokeWidth="0.5" />
      <circle cx="11.1" cy={cy} r={r} fill="none" stroke={INK} strokeWidth="0.5" />
      <path d={`M${8.15} ${cy}L${9.85} ${cy}`} stroke={INK} strokeWidth="0.5" />
    </>
  );
}

function Nose({ shadow }: { shadow: string }) {
  return <path d="M8.85 10.3C8.75 10.9 8.7 11.3 9 11.5C9.3 11.3 9.25 10.9 9.15 10.3Z" fill={shadow} />;
}

function BigSmile() {
  return <path d="M7.2 12.1Q9 13.6 10.8 12.1Q9 13 7.2 12.1Z" fill="#fff" stroke={INK} strokeWidth="0.3" strokeLinejoin="round" />;
}

function NeutralSmile() {
  return <path d="M7.6 12.3Q9 12.85 10.4 12.3" fill="none" stroke={INK} strokeWidth="0.4" strokeLinecap="round" />;
}

function Smirk() {
  return <path d="M7.6 12.4Q9.3 12.9 10.3 12" fill="none" stroke={INK} strokeWidth="0.4" strokeLinecap="round" />;
}

// Hair — each hairstyle is its own small set of ink-outlined shapes, all
// filled with the character's hair color (passed in per-character below).
function LongHair({ color }: { color: string }) {
  return (
    <>
      <path
        d="M4.1 7.6C4.1 3.9 6.3 1.3 9 1.3C11.7 1.3 13.9 3.9 13.9 7.6C13.9 8.4 13.8 9.1 13.6 9.7C13.3 7.6 11.6 6 9.5 6C9.1 7 8.2 7.7 7.1 7.7C6.3 7.7 5.6 7.3 5.2 6.7C4.7 7.5 4.3 8.5 4.2 9.6C4.2 9 4.1 8.3 4.1 7.6Z"
        fill={color}
        stroke={INK}
        strokeWidth="0.4"
        strokeLinejoin="round"
      />
      <path d="M4.2 7.2C3.6 9.2 3.6 11.7 4.3 13.6C4.8 12.6 5 10.5 4.9 8.5C4.9 8 4.6 7.5 4.2 7.2Z" fill={color} stroke={INK} strokeWidth="0.35" strokeLinejoin="round" />
      <path d="M13.8 7.2C14.4 9.2 14.4 11.7 13.7 13.6C13.2 12.6 13 10.5 13.1 8.5C13.1 8 13.4 7.5 13.8 7.2Z" fill={color} stroke={INK} strokeWidth="0.35" strokeLinejoin="round" />
    </>
  );
}

function PonytailHair({ color }: { color: string }) {
  return (
    <>
      <path
        d="M4.2 7.6C4.2 4.1 6.3 1.6 9 1.6C11.7 1.6 13.8 4.1 13.8 7.6C13.8 7.9 13.78 8.2 13.7 8.5C13.4 6.9 11.6 5.6 9.2 5.5C9.1 6.4 8.4 7 7.4 7C6.6 7 5.9 6.6 5.5 6C4.9 6.7 4.5 7.6 4.3 8.6C4.24 8.2 4.2 7.9 4.2 7.6Z"
        fill={color}
        stroke={INK}
        strokeWidth="0.4"
        strokeLinejoin="round"
      />
      <path d="M13.3 5.7C14.9 6.1 15.8 7.8 15.4 9.4C15.1 10.6 14 11.4 13.2 11.4C13.9 9.4 13.6 7.2 13.3 5.7Z" fill={color} stroke={INK} strokeWidth="0.4" strokeLinejoin="round" />
    </>
  );
}

function BunHair({ color }: { color: string }) {
  return (
    <>
      <path
        d="M4.3 7.4C4.3 4 6.4 1.5 9 1.5C11.6 1.5 13.7 4 13.7 7.4C13.7 7.7 13.68 8 13.6 8.3C13.3 6.8 11.5 5.6 9.2 5.5C9.1 6.3 8.4 6.9 7.5 6.9C6.7 6.9 6 6.5 5.6 5.9C5 6.6 4.6 7.5 4.4 8.4C4.34 8 4.3 7.7 4.3 7.4Z"
        fill={color}
        stroke={INK}
        strokeWidth="0.4"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="1.3" r="1.15" fill={color} stroke={INK} strokeWidth="0.4" />
    </>
  );
}

function BobHair({ color }: { color: string }) {
  return (
    <>
      <path
        d="M4.1 7.9C4.1 4.2 6.3 1.6 9 1.6C11.7 1.6 13.9 4.2 13.9 7.9C13.9 8.7 13.8 9.4 13.6 10C13.3 7.9 11.6 6.3 9.5 6.3C9.1 7.3 8.2 8 7.1 8C6.3 8 5.6 7.6 5.2 7C4.7 7.8 4.3 8.8 4.2 9.9C4.14 9.4 4.1 8.7 4.1 7.9Z"
        fill={color}
        stroke={INK}
        strokeWidth="0.4"
        strokeLinejoin="round"
      />
      <path d="M4.15 7.6C3.85 9.1 3.95 10.6 4.35 11.7C4.85 11.1 5.05 9.7 4.95 8.3C4.93 8 4.55 7.8 4.15 7.6Z" fill={color} stroke={INK} strokeWidth="0.35" strokeLinejoin="round" />
      <path d="M13.85 7.6C14.15 9.1 14.05 10.6 13.65 11.7C13.15 11.1 12.95 9.7 13.05 8.3C13.07 8 13.45 7.8 13.85 7.6Z" fill={color} stroke={INK} strokeWidth="0.35" strokeLinejoin="round" />
    </>
  );
}

const SHORT_DOME =
  "M3.9 7.6C3.9 3.9 6.1 1.3 9 1.3C11.9 1.3 14.1 3.9 14.1 7.6C14.1 8.4 14 9.1 13.7 9.7C13.5 7.6 11.7 6 9.5 6C9.2 7 8.3 7.7 7.2 7.7C6.4 7.7 5.7 7.3 5.3 6.7C4.7 7.5 4.3 8.5 4.2 9.6C4 9 3.9 8.3 3.9 7.6Z";

function PixieHair({ color }: { color: string }) {
  return (
    <>
      <path d={SHORT_DOME} fill={color} stroke={INK} strokeWidth="0.4" strokeLinejoin="round" />
      <path d="M8.3 4.3L9 3.4L9.7 4.3Z" fill={color} />
    </>
  );
}

function ShortHair({ color }: { color: string }) {
  const highlight = "#ffffff33";
  return (
    <>
      <path d={SHORT_DOME} fill={color} stroke={INK} strokeWidth="0.4" strokeLinejoin="round" />
      <path d="M5.6 6.6C6.3 5.3 7.6 4.4 9 4.3C8.4 5.1 7.5 5.6 6.5 5.7C6.1 6 5.8 6.3 5.6 6.6Z" fill={highlight} />
    </>
  );
}

function CurlyHair({ color }: { color: string }) {
  return (
    <>
      <circle cx="6" cy="4.3" r="1.9" fill={color} stroke={INK} strokeWidth="0.35" />
      <circle cx="9" cy="3.1" r="2.1" fill={color} stroke={INK} strokeWidth="0.35" />
      <circle cx="12" cy="4.3" r="1.9" fill={color} stroke={INK} strokeWidth="0.35" />
      <circle cx="4.5" cy="6.5" r="1.4" fill={color} stroke={INK} strokeWidth="0.35" />
      <circle cx="13.5" cy="6.5" r="1.4" fill={color} stroke={INK} strokeWidth="0.35" />
    </>
  );
}

const BUZZ_CAP =
  "M4.3 7.3C4.3 4.2 6.4 2 9 2C11.6 2 13.7 4.2 13.7 7.3C13.7 7.6 13.68 7.9 13.6 8.1C13.3 6.6 11.4 5.4 9 5.4C6.6 5.4 4.7 6.6 4.4 8.1C4.32 7.9 4.3 7.6 4.3 7.3Z";

function BuzzHair({ color }: { color: string }) {
  return <path d={BUZZ_CAP} fill={color} stroke={INK} strokeWidth="0.4" strokeLinejoin="round" />;
}

function SpikyHair({ color }: { color: string }) {
  return (
    <>
      <path d={BUZZ_CAP} fill={color} stroke={INK} strokeWidth="0.4" strokeLinejoin="round" />
      <path
        d="M5.9 5.6L6.6 2.3L8 5L9 2L10 5L11.4 2.3L12.1 5.6C11.2 4.6 10.1 4.2 9 4.2C7.9 4.2 6.8 4.6 5.9 5.6Z"
        fill={color}
        stroke={INK}
        strokeWidth="0.35"
        strokeLinejoin="round"
      />
    </>
  );
}

function SidepartHair({ color, skin }: { color: string; skin: string }) {
  return (
    <>
      <path d={BUZZ_CAP} fill={color} stroke={INK} strokeWidth="0.4" strokeLinejoin="round" />
      <path d="M6.4 2.3Q7.7 3.5 6.2 5.7" fill="none" stroke={skin} strokeWidth="0.3" />
    </>
  );
}

const CHARACTERS: Record<AVATAR_ICON, (shirtColor: string) => ReactNode> = {
  [AVATAR_ICON.GIRL_LONG]: (shirtColor) => (
    <>
      <Ears skin={SKIN.light} />
      <Shoulders color={shirtColor} />
      <HoodieStrings />
      <Face shape={FACE_OVAL} skin={SKIN.light} />
      <LongHair color={HAIR.chestnut} />
      <Eyebrows girl color={BROW.dark} cy={8.75} />
      <RoundEyes iris={IRIS.blue} />
      <Nose shadow={NOSE_SHADOW.light} />
      <BigSmile />
    </>
  ),
  [AVATAR_ICON.GIRL_PONYTAIL]: (shirtColor) => (
    <>
      <Ears skin={SKIN.tan} wide />
      <Shoulders color={shirtColor} />
      <RoundCollar />
      <Face shape={FACE_WIDE} skin={SKIN.tan} />
      <PonytailHair color={HAIR.black} />
      <Eyebrows girl color={BROW.dark} cy={8.85} />
      <AlmondEyes iris={IRIS.hazel} />
      <Glasses />
      <Nose shadow={NOSE_SHADOW.tan} />
      <NeutralSmile />
    </>
  ),
  [AVATAR_ICON.GIRL_BUN]: (shirtColor) => (
    <>
      <Ears skin={SKIN.deep} />
      <Shoulders color={shirtColor} />
      <HoodieStrings />
      <Face shape={FACE_OVAL} skin={SKIN.deep} />
      <BunHair color={HAIR.blonde} />
      <Eyebrows girl color={BROW.blonde} cy={8.75} />
      <ClosedHappyEyes />
      <Nose shadow={NOSE_SHADOW.deep} />
      <BigSmile />
    </>
  ),
  [AVATAR_ICON.GIRL_BOB]: (shirtColor) => (
    <>
      <Ears skin={SKIN.light} wide />
      <Shoulders color={shirtColor} />
      <RoundCollar />
      <Face shape={FACE_WIDE} skin={SKIN.light} />
      <BobHair color={HAIR.darkBrown} />
      <Eyebrows girl color={BROW.darker} cy={8.85} />
      <BigEyes iris={IRIS.green} />
      <Glasses cy={9.6} r={1.3} />
      <Nose shadow={NOSE_SHADOW.light} />
      <BigSmile />
    </>
  ),
  [AVATAR_ICON.GIRL_PIXIE]: (shirtColor) => (
    <>
      <Ears skin={SKIN.tan} />
      <Shoulders color={shirtColor} />
      <Face shape={FACE_SQUARE} skin={SKIN.tan} />
      <PixieHair color={HAIR.black} />
      <Eyebrows girl color={BROW.dark} cy={8.75} />
      <WinkEyes iris={IRIS.amber} />
      <Nose shadow={NOSE_SHADOW.tan} />
      <Smirk />
    </>
  ),
  [AVATAR_ICON.BOY_SHORT]: (shirtColor) => (
    <>
      <Ears skin={SKIN.tan} />
      <Shoulders color={shirtColor} />
      <HoodieStrings />
      <Face shape={FACE_OVAL} skin={SKIN.tan} />
      <ShortHair color={HAIR.navy} />
      <Eyebrows girl={false} color={BROW.dark} cy={8.8} />
      <RoundEyes iris={IRIS.blue} />
      <Nose shadow={NOSE_SHADOW.tan} />
      <BigSmile />
    </>
  ),
  [AVATAR_ICON.BOY_CURLY]: (shirtColor) => (
    <>
      <Ears skin={SKIN.deep} wide />
      <Shoulders color={shirtColor} />
      <RoundCollar />
      <Face shape={FACE_WIDE} skin={SKIN.deep} />
      <CurlyHair color={HAIR.black} />
      <Eyebrows girl={false} color={BROW.darker} cy={8.9} />
      <AlmondEyes iris={IRIS.brown} />
      <Glasses />
      <Nose shadow={NOSE_SHADOW.deep} />
      <Smirk />
    </>
  ),
  [AVATAR_ICON.BOY_BUZZ]: (shirtColor) => (
    <>
      <Ears skin={SKIN.light} />
      <Shoulders color={shirtColor} />
      <HoodieStrings />
      <Face shape={FACE_SQUARE} skin={SKIN.light} />
      <BuzzHair color={HAIR.black} />
      <Eyebrows girl={false} color={BROW.dark} cy={8.8} />
      <BigEyes iris={IRIS.gray} />
      <Nose shadow={NOSE_SHADOW.light} />
      <NeutralSmile />
    </>
  ),
  [AVATAR_ICON.BOY_SPIKY]: (shirtColor) => (
    <>
      <Ears skin={SKIN.tan} />
      <Shoulders color={shirtColor} />
      <RoundCollar />
      <Face shape={FACE_OVAL} skin={SKIN.tan} />
      <SpikyHair color={HAIR.chestnut} />
      <Eyebrows girl={false} color={BROW.dark} cy={8.8} />
      <ClosedHappyEyes />
      <Glasses />
      <Nose shadow={NOSE_SHADOW.tan} />
      <BigSmile />
    </>
  ),
  [AVATAR_ICON.BOY_SIDEPART]: (shirtColor) => (
    <>
      <Ears skin={SKIN.deep} />
      <Shoulders color={shirtColor} />
      <HoodieStrings />
      <Face shape={FACE_SQUARE} skin={SKIN.deep} />
      <SidepartHair color={HAIR.darkBrown} skin={SKIN.deep} />
      <Eyebrows girl={false} color={BROW.darker} cy={8.8} />
      <WinkEyes iris={IRIS.hazel} />
      <Nose shadow={NOSE_SHADOW.deep} />
      <Smirk />
    </>
  ),
};

interface AvatarIconProps {
  icon: AVATAR_ICON;
  /** Shirt/hoodie color — pass the same `avatar.color` used for this icon's circular backdrop, so the shirt blends into it. */
  color?: string;
  size?: number;
  className?: string;
}

/** One of the ten hand-drawn player characters — see avatar.constant.ts. Flat fills + ink outlines, never emoji. */
export function AvatarIcon({ icon, color = "#2F6FEB", size = 18, className }: AvatarIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" className={className} aria-hidden="true">
      {CHARACTERS[icon](color)}
    </svg>
  );
}
