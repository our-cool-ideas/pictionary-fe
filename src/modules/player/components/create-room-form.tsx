"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { usePublicCategories } from "@/modules/player/hooks/use-public-categories";
import { createRoomFormSchema, type CreateRoomFormValues } from "@/modules/player/validation/create-room.validation";
import { useRoomSession } from "@/modules/room/context/use-room-session";
import { usePlayerName } from "@/hooks/use-player-name";
import { ROOM_VISIBILITY } from "@/lib/enums/room-visibility.enum";

export function CreateRoomForm() {
  const router = useRouter();
  const { playerName } = usePlayerName();
  const { data: categoriesData, isLoading: categoriesLoading } = usePublicCategories();
  const {
    actions: { createRoom },
  } = useRoomSession();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoomFormValues>({
    resolver: zodResolver(createRoomFormSchema),
    defaultValues: { categoryId: "", visibility: ROOM_VISIBILITY.PUBLIC },
  });

  const categories = categoriesData?.categories ?? [];
  const hasName = playerName.trim().length > 0;

  async function onSubmit(values: CreateRoomFormValues) {
    setSubmitError(null);
    const result = await createRoom({ name: playerName.trim(), categoryId: values.categoryId, visibility: values.visibility });
    if (!result.ok || !result.code) {
      setSubmitError(result.message);
      return;
    }
    router.push(`/room/${result.code}`);
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="flex flex-col gap-1.5">
        <Label>Category</Label>
        {categoriesLoading ? (
          <Skeleton className="h-9 w-full" />
        ) : (
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={(val) => val && field.onChange(val)}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: string) => {
                      const category = categories.find((c) => c.id === value);
                      return category ? `${category.icon ?? ""} ${category.name}`.trim() : "Choose a category";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )}
        {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId.message}</p>}
        {!categoriesLoading && categories.length === 0 && (
          <p className="text-sm text-muted-foreground">No categories available yet — check back soon.</p>
        )}
      </div>

      <Controller
        name="visibility"
        control={control}
        render={({ field }) => (
          <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="room-private">Private room</Label>
              <p className="text-xs text-muted-foreground">
                {field.value === ROOM_VISIBILITY.PRIVATE
                  ? "Only joinable via the invite link — hidden from the Rooms list."
                  : "Listed in Rooms for anyone to join, and joinable via the invite link."}
              </p>
            </div>
            <Switch
              id="room-private"
              checked={field.value === ROOM_VISIBILITY.PRIVATE}
              onCheckedChange={(checked) => field.onChange(checked ? ROOM_VISIBILITY.PRIVATE : ROOM_VISIBILITY.PUBLIC)}
            />
          </div>
        )}
      />

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}
      {!hasName && <p className="text-sm text-muted-foreground">Enter your name above first.</p>}

      <Button type="submit" disabled={isSubmitting || categories.length === 0 || !hasName}>
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Creating room...
          </>
        ) : (
          "Create room"
        )}
      </Button>
    </form>
  );
}
