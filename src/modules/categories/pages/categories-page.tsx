"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryTable } from "@/modules/categories/components/category-table";
import { CategoryFormDialog } from "@/modules/categories/components/category-form-dialog";
import { CategoryDeleteDialog } from "@/modules/categories/components/category-delete-dialog";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/modules/categories/hooks/use-categories";
import type { Category, CategoryFormValues } from "@/modules/categories/types/category.type";

export function CategoriesPage() {
  const { data, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  // Forces CategoryFormDialog to remount fresh on every open, so its
  // react-hook-form defaultValues seed correctly per-mount.
  function openCreate() {
    setEditing(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function handleSubmit(values: CategoryFormValues) {
    if (editing) {
      updateCategory.mutate({ id: editing.id, values }, { onSuccess: () => setFormOpen(false) });
    } else {
      createCategory.mutate(values, { onSuccess: () => setFormOpen(false) });
    }
  }

  function handleDeleteConfirm() {
    if (deleteTarget) deleteCategory.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">Word categories players can draw from (fruits, animals, ...).</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          New category
        </Button>
      </div>

      <CategoryTable categories={data?.categories ?? []} isLoading={isLoading} onEdit={openEdit} onDelete={setDeleteTarget} />

      <CategoryFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editing}
        onSubmit={handleSubmit}
        isSubmitting={createCategory.isPending || updateCategory.isPending}
      />

      <CategoryDeleteDialog
        category={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
