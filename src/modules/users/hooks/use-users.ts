"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/types/api-response.type";
import type { Pagination } from "@/lib/types/pagination.type";
import type { User } from "@/lib/types/user.type";
import type { USER_TYPE } from "@/lib/enums/role.enum";
import { userQueryKeys } from "@/modules/users/constants/user.constant";

export function useUsers() {
  return useQuery({
    queryKey: userQueryKeys.all,
    queryFn: () => apiClient.get<{ users: User[]; pagination: Pagination }>("admin/users?pageSize=100"),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: USER_TYPE }) =>
      apiClient.patch<{ user: User }>(`admin/users/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
      toast.success("User role updated");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to update role"),
  });
}
