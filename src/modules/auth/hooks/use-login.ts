"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { currentUserQueryKey } from "@/hooks/use-current-user";
import { ApiError, type ApiResponse } from "@/lib/types/api-response.type";
import type { LoginFormValues, LoginResult } from "@/modules/auth/types/login.type";

// Deliberately NOT going through apiClient/`/api/proxy` — login is the one
// call that has to hit our own `/api/auth/login` BFF route directly, since
// that's what sets the httpOnly cookie.
async function loginRequest(input: LoginFormValues): Promise<LoginResult> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const result = (await res.json()) as ApiResponse<LoginResult>;
  if (!res.ok || !result.data) {
    throw new ApiError(result.status, result.error, result.message);
  }
  return result.data;
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      queryClient.setQueryData(currentUserQueryKey, data);
    },
  });
}
