"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Category } from "@/modules/categories/types/category.type";

interface CategoryDeleteDialogProps {
  category: Category | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function CategoryDeleteDialog({ category, onOpenChange, onConfirm }: CategoryDeleteDialogProps) {
  return (
    <AlertDialog open={!!category} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &quot;{category?.name}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            This can&apos;t be undone. If this category still has words assigned to it, deletion will be blocked —
            deactivate it instead.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
