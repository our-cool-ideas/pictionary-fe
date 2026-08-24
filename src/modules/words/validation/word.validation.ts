import { z } from "zod";
import { WORD_DIFFICULTY } from "@/modules/words/enums/word-difficulty.enum";

export const wordSchema = z.object({
  text: z.string().min(1, "Word is required").max(80),
  categoryId: z.string().min(1, "Pick a category"),
  difficulty: z.enum(WORD_DIFFICULTY),
  locale: z.string().min(2).max(10),
  isActive: z.boolean(),
});
