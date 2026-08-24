"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_CATEGORIES_FILTER } from "@/modules/words/constants/word.constant";
import type { Category } from "@/modules/categories/types/category.type";

interface WordCategoryFilterProps {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
}

export function WordCategoryFilter({ categories, value, onChange }: WordCategoryFilterProps) {
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  return (
    <Select value={value} onValueChange={(val) => val && onChange(val)}>
      <SelectTrigger className="w-56">
        <SelectValue>{(v: string) => (v === ALL_CATEGORIES_FILTER ? "All categories" : categoryName(v))}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_CATEGORIES_FILTER}>All categories</SelectItem>
        {categories.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.icon} {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
