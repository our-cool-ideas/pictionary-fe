"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

/** Global — used by the sidebar (a global component), not specific to the auth module's pages. */
export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await fetch("/api/auth/logout", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
