"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { GoogleSignInButton } from "@/modules/player/components/google-sign-in-button";
import { AvatarPicker } from "@/modules/player/components/avatar-picker";
import { PlayerNameField } from "@/modules/player/components/player-name-field";
import { usePlayerIdentity } from "@/hooks/use-player-identity";
import { PRESS_CLASS, cn, pressStyle } from "@/lib/utils";

export function SignInPage() {
  const router = useRouter();
  const { playerName } = usePlayerIdentity();
  const hasName = playerName.trim().length > 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-play-sand p-5 font-play-body">
      <div className="flex w-full max-w-[420px] flex-col gap-4.5 rounded-[28px] border-[3px] border-play-ink bg-white p-7 shadow-[8px_8px_0_var(--color-play-ink)]">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="flex items-center gap-2">
            <svg width="34" height="34" viewBox="0 0 38 38" fill="none" aria-hidden="true">
              <path d="M27 6 L32 11 L16 27 L9 29 L11 22 Z" fill="var(--color-play-orange)" stroke="var(--color-play-ink)" strokeWidth="2.5" strokeLinejoin="round" />
              <path d="M9 29 L6 32" stroke="var(--color-play-ink)" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="30" cy="8" r="3.4" fill="var(--color-play-yellow)" stroke="var(--color-play-ink)" strokeWidth="2" />
            </svg>
            <span className="font-play-display text-[30px] font-bold tracking-tight text-play-ink">Pictionary</span>
          </div>
          <span className="font-play-display text-[13px] font-semibold text-play-ink/65">Draw it. Guess it. Win it.</span>
        </div>

        <GoogleSignInButton />

        <div className="flex items-center gap-2.5">
          <div className="h-0.5 flex-1 bg-play-ink/15" />
          <span className="font-play-display text-[11.5px] font-semibold tracking-wide text-play-ink/50 uppercase">or continue as guest</span>
          <div className="h-0.5 flex-1 bg-play-ink/15" />
        </div>

        <AvatarPicker />
        <PlayerNameField />

        <button
          type="button"
          disabled={!hasName}
          onClick={() => router.push("/rooms")}
          style={pressStyle(4)}
          className={cn(
            "flex items-center justify-center gap-2 rounded-2xl border-[3px] border-play-ink bg-play-orange p-3.5 font-play-display text-lg font-bold text-white shadow-[4px_4px_0_var(--color-play-ink)] disabled:cursor-not-allowed disabled:opacity-50",
            PRESS_CLASS,
          )}
        >
          Start
          <ArrowRight className="size-4.5" strokeWidth={2.5} />
        </button>
        {/* Same grid-rows animation as GoogleSignInButton's note, and for
            the same reason — this used to be a plain `{!hasName && ...}`
            mount, so the whole card visibly jumped the instant a name got
            typed (or cleared) instead of the hint smoothly folding away.
            The `-mt-2.5` that used to sit directly on the <p> (pulling it
            closer to the button than the parent's gap-4.5) stays on this
            outer wrapper instead — it's a plain margin on a flex child,
            untouched by the grid-rows collapse happening one level in. */}
        <div className={`-mt-2.5 grid transition-[grid-template-rows] duration-200 ease-out ${!hasName ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
          <div className="overflow-hidden">
            <p className="text-center font-play-body text-xs font-bold text-play-ink/50">Pick a name to start playing.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
