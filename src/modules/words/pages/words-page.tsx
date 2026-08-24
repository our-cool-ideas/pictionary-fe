"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WordCategoryFilter } from "@/modules/words/components/word-category-filter";
import { WordTable } from "@/modules/words/components/word-table";
import { WordFormDialog } from "@/modules/words/components/word-form-dialog";
import { WordDeleteDialog } from "@/modules/words/components/word-delete-dialog";
import { useWords, useCreateWord, useUpdateWord, useDeleteWord } from "@/modules/words/hooks/use-words";
import { ALL_CATEGORIES_FILTER } from "@/modules/words/constants/word.constant";
import { useCategories } from "@/modules/categories/hooks/use-categories";
import type { Word, WordFormValues } from "@/modules/words/types/word.type";

export function WordsPage() {
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES_FILTER);
  const { data: categoriesData } = useCategories();
  const { data, isLoading } = useWords(categoryFilter === ALL_CATEGORIES_FILTER ? undefined : categoryFilter);
  const createWord = useCreateWord();
  const updateWord = useUpdateWord();
  const deleteWord = useDeleteWord();

  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editing, setEditing] = useState<Word | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Word | null>(null);

  const categories = categoriesData?.categories ?? [];

  function openCreate() {
    setEditing(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function openEdit(word: Word) {
    setEditing(word);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function handleSubmit(values: WordFormValues) {
    if (editing) {
      updateWord.mutate({ id: editing.id, values }, { onSuccess: () => setFormOpen(false) });
    } else {
      createWord.mutate(values, { onSuccess: () => setFormOpen(false) });
    }
  }

  function handleDeleteConfirm() {
    if (deleteTarget) deleteWord.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Words</h1>
          <p className="text-sm text-muted-foreground">The word bank players draw from during their turn.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          New word
        </Button>
      </div>

      <WordCategoryFilter categories={categories} value={categoryFilter} onChange={setCategoryFilter} />

      <WordTable
        words={data?.words ?? []}
        categories={categories}
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
      />

      <WordFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        word={editing}
        categories={categories}
        defaultCategoryId={categoryFilter === ALL_CATEGORIES_FILTER ? undefined : categoryFilter}
        onSubmit={handleSubmit}
        isSubmitting={createWord.isPending || updateWord.isPending}
      />

      <WordDeleteDialog
        word={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
