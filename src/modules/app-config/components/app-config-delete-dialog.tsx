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
import type { AppConfigRow } from "@/modules/app-config/types/app-config.type";

interface AppConfigDeleteDialogProps {
  config: AppConfigRow | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function AppConfigDeleteDialog({ config, onOpenChange, onConfirm }: AppConfigDeleteDialogProps) {
  return (
    <AlertDialog open={!!config} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &quot;{config?.key}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
