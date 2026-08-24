"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/types/api-response.type";
import { appConfigQueryKeys } from "@/modules/app-config/constants/app-config.constant";
import type { AppConfigFormValues, AppConfigRow } from "@/modules/app-config/types/app-config.type";

export function useAppConfig() {
  return useQuery({
    queryKey: appConfigQueryKeys.all,
    queryFn: () => apiClient.get<{ config: AppConfigRow[] }>("admin/app-config"),
  });
}

export function useUpsertAppConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, ...values }: AppConfigFormValues) =>
      apiClient.put<{ config: AppConfigRow }>(`admin/app-config/${key}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appConfigQueryKeys.all });
      toast.success("Config saved");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to save config"),
  });
}

export function useDeleteAppConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => apiClient.delete<{ config: AppConfigRow }>(`admin/app-config/${key}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appConfigQueryKeys.all });
      toast.success("Config deleted");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to delete config"),
  });
}
