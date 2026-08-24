"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppConfigTable } from "@/modules/app-config/components/app-config-table";
import { AppConfigFormDialog } from "@/modules/app-config/components/app-config-form-dialog";
import { AppConfigDeleteDialog } from "@/modules/app-config/components/app-config-delete-dialog";
import { useAppConfig, useUpsertAppConfig, useDeleteAppConfig } from "@/modules/app-config/hooks/use-app-config";
import type { AppConfigFormValues, AppConfigRow } from "@/modules/app-config/types/app-config.type";

export function AppConfigPage() {
  const { data, isLoading } = useAppConfig();
  const upsertConfig = useUpsertAppConfig();
  const deleteConfig = useDeleteAppConfig();

  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editing, setEditing] = useState<AppConfigRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AppConfigRow | null>(null);

  function openCreate() {
    setEditing(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function openEdit(config: AppConfigRow) {
    setEditing(config);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function handleSubmit(values: AppConfigFormValues) {
    upsertConfig.mutate(values, { onSuccess: () => setFormOpen(false) });
  }

  function handleDeleteConfirm() {
    if (deleteTarget) deleteConfig.mutate(deleteTarget.key, { onSuccess: () => setDeleteTarget(null) });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">App Config</h1>
          <p className="text-sm text-muted-foreground">Global settings and feature flags.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          New key
        </Button>
      </div>

      <AppConfigTable config={data?.config ?? []} isLoading={isLoading} onEdit={openEdit} onDelete={setDeleteTarget} />

      <AppConfigFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        config={editing}
        onSubmit={handleSubmit}
        isSubmitting={upsertConfig.isPending}
      />

      <AppConfigDeleteDialog
        config={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
