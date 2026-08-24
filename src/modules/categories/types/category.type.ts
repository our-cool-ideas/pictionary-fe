import type { z } from "zod";
import type { categorySchema } from "@/modules/categories/validation/category.validation";

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CategoryFormValues = z.infer<typeof categorySchema>;
