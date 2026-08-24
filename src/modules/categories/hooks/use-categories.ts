"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/types/api-response.type";
import { categoryQueryKeys } from "@/modules/categories/constants/category.constant";
import type { Category, CategoryFormValues } from "@/modules/categories/types/category.type";

export function useCategories() {
  return useQuery({
    queryKey: categoryQueryKeys.all,
    queryFn: () => apiClient.get<{ categories: Category[] }>("admin/categories"),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CategoryFormValues) => apiClient.post<{ category: Category }>("admin/categories", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all });
      toast.success("Category created");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to create category"),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<CategoryFormValues> }) =>
      apiClient.patch<{ category: Category }>(`admin/categories/${id}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all });
      toast.success("Category updated");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to update category"),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<{ category: Category }>(`admin/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all });
      toast.success("Category deleted");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to delete category"),
  });
}
