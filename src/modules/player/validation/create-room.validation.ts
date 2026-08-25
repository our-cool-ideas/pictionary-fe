import { z } from "zod";
import { ROOM_VISIBILITY } from "@/lib/enums/room-visibility.enum";

// No `name` field — the guest's name is set once, session-wide, via
// PlayerNameField (see modules/player/components/player-name-field.tsx),
// not re-collected per action.
export const createRoomFormSchema = z.object({
  categoryId: z.string().min(1, "Pick a category"),
  visibility: z.enum(ROOM_VISIBILITY),
});

export type CreateRoomFormValues = z.infer<typeof createRoomFormSchema>;
