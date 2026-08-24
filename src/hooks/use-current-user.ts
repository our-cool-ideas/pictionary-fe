"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { User } from "@/lib/types/user.type";

/**
 * Global, not module-local — the sidebar (a global component) and multiple
 * modules (auth's login page, the users module) all need "who is logged
 * in right now."
 */
export const currentUserQueryKey = ["auth", "me"] as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: () => apiClient.get<{ user: User }>("auth/me"),
    retry: false,
  });
}
