"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { PublicCategory } from "@/modules/player/types/category.type";

/** Public, unauthenticated endpoint — works for a guest with no admin session, unlike the admin categories hook. */
export function usePublicCategories() {
  return useQuery({
    queryKey: ["public-categories"],
    queryFn: () => apiClient.get<{ categories: PublicCategory[] }>("categories"),
  });
}
