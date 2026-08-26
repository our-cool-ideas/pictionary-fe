"use client";

import { Check } from "lucide-react";
import { AVATAR_OPTIONS } from "@/modules/player/constants/avatar.constant";
import { AvatarIcon } from "@/modules/player/components/avatar-icon";
import { usePlayerIdentity } from "@/hooks/use-player-identity";
import { cn } from "@/lib/utils";

export function AvatarPicker() {
  const { avatarId, setAvatarId } = usePlayerIdentity();

  return (
    <div className="flex flex-col gap-2">
      <label className="font-play-display text-xs font-semibold tracking-wide text-play-ink uppercase">Pick an avatar</label>
      <div className="flex justify-between gap-2">
        {AVATAR_OPTIONS.map((avatar) => {
          const selected = avatar.id === avatarId;
          return (
            <button
              key={avatar.id}
              type="button"
              aria-label={avatar.label}
              aria-pressed={selected}
              onClick={() => setAvatarId(avatar.id)}
              className="relative cursor-pointer"
            >
              <span
                className={cn(
                  "flex size-11 items-center justify-center rounded-full text-white transition-transform",
                  selected ? "-translate-y-0.5 border-[3px] border-play-ink shadow-[2px_2px_0_var(--color-play-ink)]" : "border-[3px] border-black/10",
                )}
                style={{ backgroundColor: avatar.color }}
              >
                <AvatarIcon icon={avatar.icon} size={19} />
              </span>
              {selected && (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full border-2 border-white bg-play-ink">
                  <Check className="size-2.5 text-white" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
