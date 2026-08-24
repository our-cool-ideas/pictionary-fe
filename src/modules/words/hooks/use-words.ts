"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { ApiError } from "@/lib/types/api-response.type";
import type { Pagination } from "@/lib/types/pagination.type";
import { wordQueryKeys } from "@/modules/words/constants/word.constant";
import type { Word, WordFormValues } from "@/modules/words/types/word.type";

export function useWords(categoryId?: string) {
  return useQuery({
    queryKey: wordQueryKeys.list(categoryId),
    queryFn: () =>
      apiClient.get<{ words: Word[]; pagination: Pagination }>(
        `admin/words${categoryId ? `?categoryId=${categoryId}&pageSize=200` : "?pageSize=200"}`,
      ),
  });
}

export function useCreateWord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WordFormValues) => apiClient.post<{ word: Word }>("admin/words", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wordQueryKeys.all });
      toast.success("Word created");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to create word"),
  });
}

export function useUpdateWord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<WordFormValues> }) =>
      apiClient.patch<{ word: Word }>(`admin/words/${id}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wordQueryKeys.all });
      toast.success("Word updated");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to update word"),
  });
}

export function useDeleteWord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<{ word: Word }>(`admin/words/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wordQueryKeys.all });
      toast.success("Word deleted");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to delete word"),
  });
}
