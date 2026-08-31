"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { joinRoomFormSchema, type JoinRoomFormValues } from "@/modules/room/validation/join-room.validation";
import { useRoomSession } from "@/modules/room/context/use-room-session";
import { usePlayerIdentity } from "@/hooks/use-player-identity";

export function JoinRoomForm({ code }: { code: string }) {
  const { playerName, setPlayerName, avatarId } = usePlayerIdentity();
  const {
    actions: { joinRoom },
  } = useRoomSession();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<JoinRoomFormValues>({ resolver: zodResolver(joinRoomFormSchema), defaultValues: { name: playerName } });

  async function onSubmit(values: JoinRoomFormValues) {
    setSubmitError(null);
    const result = await joinRoom({ roomCode: code, name: values.name, avatarId });
    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }
    // Shared-link entry — this may be the first name this session ever
    // typed, so it becomes the session-wide name from here on too (see
    // PlayerIdentityProvider), same as if they'd set it on the sign-in
    // page first.
    setPlayerName(values.name);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-play-sand p-5 font-play-body">
      <div className="flex w-full max-w-[380px] flex-col gap-5 rounded-[28px] border-[3px] border-play-ink bg-white p-7 shadow-[8px_8px_0_var(--color-play-ink)]">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <svg width="34" height="34" viewBox="0 0 38 38" fill="none" aria-hidden="true">
            <path d="M27 6 L32 11 L16 27 L9 29 L11 22 Z" fill="var(--color-play-orange)" stroke="var(--color-play-ink)" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M9 29 L6 32" stroke="var(--color-play-ink)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="30" cy="8" r="3.4" fill="var(--color-play-yellow)" stroke="var(--color-play-ink)" strokeWidth="2" />
          </svg>
          <span className="font-play-display text-2xl font-bold text-play-ink">Join room {code}</span>
          <span className="font-play-display text-[13px] font-semibold text-play-ink/65">Pick a name to join this room.</span>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="flex flex-col gap-2">
            <label htmlFor="join-name" className="font-play-display text-xs font-semibold tracking-wide text-play-ink uppercase">
              Your Name
            </label>
            <input
              id="join-name"
              placeholder="e.g. Alex"
              maxLength={24}
              {...register("name")}
              className="rounded-2xl border-[3px] border-play-ink bg-white px-4 py-3 font-play-body text-base font-bold text-play-ink shadow-[3px_3px_0_var(--color-play-ink)] outline-none placeholder:text-play-ink/35"
            />
            {errors.name && <p className="font-play-body text-xs font-bold text-red-600">{errors.name.message}</p>}
          </div>
          {submitError && <p className="font-play-body text-xs font-bold text-red-600">{submitError}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 rounded-2xl border-[3px] border-play-ink bg-play-orange p-3.5 font-play-display text-lg font-bold text-white shadow-[4px_4px_0_var(--color-play-ink)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Joining...
              </>
            ) : (
              "Join Room"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
