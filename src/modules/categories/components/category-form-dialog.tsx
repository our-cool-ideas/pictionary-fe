"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { categorySchema } from "@/modules/categories/validation/category.validation";
import { EMPTY_CATEGORY_FORM_VALUES } from "@/modules/categories/constants/category.constant";
import type { Category, CategoryFormValues } from "@/modules/categories/types/category.type";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  onSubmit: (values: CategoryFormValues) => void;
  isSubmitting: boolean;
}

/**
 * No effect resetting form state on open/category change — the caller
 * remounts this component with a fresh `key` every time it's opened (see
 * categories-page.tsx), so react-hook-form's defaultValues (only applied at
 * mount) already seed the right values per-mount.
 */
export function CategoryFormDialog({ open, onOpenChange, category, onSubmit, isSubmitting }: CategoryFormDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: category
      ? { name: category.name, slug: category.slug, icon: category.icon ?? "", isActive: category.isActive }
      : EMPTY_CATEGORY_FORM_VALUES,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>{category ? "Edit category" : "New category"}</DialogTitle>
            <DialogDescription>
              {category ? "Update this category's details." : "Categories group the words players draw from."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cat-name">Name</Label>
              <Input id="cat-name" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cat-slug">Slug</Label>
              <Input id="cat-slug" {...register("slug")} placeholder="e.g. fruits" />
              {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cat-icon">Icon (emoji)</Label>
              <Input id="cat-icon" {...register("icon")} placeholder="🍎" />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="cat-active" className="cursor-pointer">
                Active
              </Label>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => <Switch id="cat-active" checked={field.value} onCheckedChange={field.onChange} />}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : category ? "Save changes" : "Create category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
