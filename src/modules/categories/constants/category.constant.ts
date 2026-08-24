import type { CategoryFormValues } from "@/modules/categories/types/category.type";

export const EMPTY_CATEGORY_FORM_VALUES: CategoryFormValues = {
  name: "",
  slug: "",
  icon: "",
  isActive: true,
};

export const categoryQueryKeys = {
  all: ["categories"] as const,
};
