import { getAvatarOption, type AvatarId } from "@/modules/player/constants/avatar.constant";
import { AvatarIcon } from "@/modules/player/components/avatar-icon";

interface AvatarBadgeProps {
  avatarId: AvatarId;
  name: string;
}

/** The small "who am I" pill shown once the guest has set their identity on the sign-in page — see RoomsPage's top bar. */
export function AvatarBadge({ avatarId, name }: AvatarBadgeProps) {
  const avatar = getAvatarOption(avatarId);

  return (
    <div className="flex items-center gap-2 rounded-full border-[2.5px] border-play-ink bg-white py-1.5 pr-4 pl-1.5">
      <span className="flex size-7 items-center justify-center rounded-full border-2 border-play-ink text-white" style={{ backgroundColor: avatar.color }}>
        <AvatarIcon icon={avatar.icon} size={15} />
      </span>
      <span className="font-play-display text-sm font-bold text-play-ink">{name}</span>
    </div>
  );
}
