"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AvatarBadge } from "@/modules/player/components/avatar-badge";
import { QuickCreateStrip } from "@/modules/player/components/quick-create-strip";
import { OpenRoomsList } from "@/modules/player/components/open-rooms-list";
import { usePlayerIdentity } from "@/hooks/use-player-identity";

export function RoomsPage() {
  const router = useRouter();
  const { playerName, avatarId } = usePlayerIdentity();
  const hasName = playerName.trim().length > 0;

  // Guest identity is never persisted (see PlayerIdentityProvider) — a
  // direct/refreshed visit to /rooms with no name set has nowhere to go
  // but back to the sign-in page where a name gets chosen.
  useEffect(() => {
    if (!hasName) router.replace("/");
  }, [hasName, router]);

  if (!hasName) return null;

  return (
    <div className="min-h-screen bg-play-cream p-6 font-play-body sm:p-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="26" height="26" viewBox="0 0 38 38" fill="none" aria-hidden="true">
              <path d="M27 6 L32 11 L16 27 L9 29 L11 22 Z" fill="var(--color-play-orange)" stroke="var(--color-play-ink)" strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M9 29 L6 32" stroke="var(--color-play-ink)" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="30" cy="8" r="3.4" fill="var(--color-play-yellow)" stroke="var(--color-play-ink)" strokeWidth="2" />
            </svg>
            <span className="font-play-display text-2xl font-bold tracking-tight text-play-ink">Pictionary</span>
          </div>
          <AvatarBadge avatarId={avatarId} name={playerName} />
        </div>

        <QuickCreateStrip />
        <OpenRoomsList />
      </div>
    </div>
  );
}
