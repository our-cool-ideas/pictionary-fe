"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { joinRoomFormSchema, type JoinRoomFormValues } from "@/modules/room/validation/join-room.validation";
import { useRoomSession } from "@/modules/room/context/use-room-session";
import { usePlayerName } from "@/hooks/use-player-name";

export function JoinRoomForm({ code }: { code: string }) {
  const { playerName, setPlayerName } = usePlayerName();
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
    const result = await joinRoom({ roomCode: code, name: values.name });
    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }
    // Shared-link entry — this may be the first name this session ever
    // typed, so it becomes the session-wide name from here on too (see
    // PlayerNameProvider), same as if they'd set it on the home page first.
    setPlayerName(values.name);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Palette className="size-5" />
          </div>
          <CardTitle>Join room {code}</CardTitle>
          <CardDescription>Pick a name to join this room.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="join-name">Your name</Label>
              <Input id="join-name" placeholder="e.g. Alex" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join room"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
