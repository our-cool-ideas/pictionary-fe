import type { z } from "zod";
import type { wordSchema } from "@/modules/words/validation/word.validation";
import type { WORD_DIFFICULTY } from "@/modules/words/enums/word-difficulty.enum";

export interface Word {
  id: string;
  text: string;
  categoryId: string;
  difficulty: WORD_DIFFICULTY;
  locale: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type WordFormValues = z.infer<typeof wordSchema>;
