import { WORD_DIFFICULTY } from "@/modules/words/enums/word-difficulty.enum";
import type { WordFormValues } from "@/modules/words/types/word.type";

export const ALL_CATEGORIES_FILTER = "__all__";

export function emptyWordFormValues(defaultCategoryId?: string): WordFormValues {
  return { text: "", categoryId: defaultCategoryId ?? "", difficulty: WORD_DIFFICULTY.MEDIUM, locale: "en", isActive: true };
}

export const wordQueryKeys = {
  all: ["words"] as const,
  list: (categoryId: string | undefined) => ["words", { categoryId: categoryId ?? null }] as const,
};
