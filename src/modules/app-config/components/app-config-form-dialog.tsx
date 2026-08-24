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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { appConfigSchema } from "@/modules/app-config/validation/app-config.validation";
import { EMPTY_APP_CONFIG_FORM_VALUES } from "@/modules/app-config/constants/app-config.constant";
import { APP_CONFIG_TYPE } from "@/modules/app-config/enums/app-config-type.enum";
import type { AppConfigFormValues, AppConfigRow } from "@/modules/app-config/types/app-config.type";

interface AppConfigFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config?: AppConfigRow | null;
  onSubmit: (values: AppConfigFormValues) => void;
  isSubmitting: boolean;
}

/**
 * No effect resetting form state on open/config change — the caller
 * remounts this component with a fresh `key` every time it's opened, so
 * react-hook-form's defaultValues (only applied at mount) are enough.
 */
export function AppConfigFormDialog({ open, onOpenChange, config, onSubmit, isSubmitting }: AppConfigFormDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AppConfigFormValues>({
    resolver: zodResolver(appConfigSchema),
    defaultValues: config
      ? { key: config.key, value: config.value, type: config.type, description: config.description ?? "" }
      : EMPTY_APP_CONFIG_FORM_VALUES,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>{config ? "Edit config" : "New config key"}</DialogTitle>
            <DialogDescription>
              {config ? "Update this key's value." : "Add a new global app config key/value pair."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cfg-key">Key</Label>
              <Input id="cfg-key" disabled={!!config} {...register("key")} placeholder="e.g. max_players_per_room" />
              {errors.key && <p className="text-sm text-destructive">{errors.key.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(val) => val && field.onChange(val)}>
                    <SelectTrigger className="w-full">
                      <SelectValue>{(value: APP_CONFIG_TYPE) => <span className="capitalize">{value}</span>}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(APP_CONFIG_TYPE).map((t) => (
                        <SelectItem key={t} value={t} className="capitalize">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cfg-value">Value</Label>
              <Input id="cfg-value" {...register("value")} />
              {errors.value && <p className="text-sm text-destructive">{errors.value.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cfg-description">Description</Label>
              <Input id="cfg-description" {...register("description")} placeholder="What this controls" />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
