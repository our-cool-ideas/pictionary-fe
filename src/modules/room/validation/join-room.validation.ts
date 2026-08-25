import { z } from "zod";

export const joinRoomFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(24, "Keep it under 24 characters"),
});

export type JoinRoomFormValues = z.infer<typeof joinRoomFormSchema>;
