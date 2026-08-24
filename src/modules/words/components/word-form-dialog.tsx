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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { wordSchema } from "@/modules/words/validation/word.validation";
import { emptyWordFormValues } from "@/modules/words/constants/word.constant";
import { WORD_DIFFICULTY } from "@/modules/words/enums/word-difficulty.enum";
import type { Word, WordFormValues } from "@/modules/words/types/word.type";
import type { Category } from "@/modules/categories/types/category.type";

interface WordFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  word?: Word | null;
  categories: Category[];
  defaultCategoryId?: string;
  onSubmit: (values: WordFormValues) => void;
  isSubmitting: boolean;
}

/**
 * No effect resetting form state on open/word change — the caller
 * remounts this component with a fresh `key` every time it's opened, so
 * react-hook-form's defaultValues (only applied at mount) are enough.
 */
export function WordFormDialog({
  open,
  onOpenChange,
  word,
  categories,
  defaultCategoryId,
  onSubmit,
  isSubmitting,
}: WordFormDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<WordFormValues>({
    resolver: zodResolver(wordSchema),
    defaultValues: word
      ? { text: word.text, categoryId: word.categoryId, difficulty: word.difficulty, locale: word.locale, isActive: word.isActive }
      : emptyWordFormValues(defaultCategoryId),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>{word ? "Edit word" : "New word"}</DialogTitle>
            <DialogDescription>
              {word ? "Update this word's details." : "Add a word to a category's rotation."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="word-text">Word</Label>
              <Input id="word-text" {...register("text")} />
              {errors.text && <p className="text-sm text-destructive">{errors.text.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(val) => val && field.onChange(val)}>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(value: string) => {
                          const cat = categories.find((c) => c.id === value);
                          return cat ? `${cat.icon ?? ""} ${cat.name}`.trim() : "Select a category";
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.icon} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Difficulty</Label>
              <Controller
                name="difficulty"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(val) => val && field.onChange(val)}>
                    <SelectTrigger className="w-full">
                      <SelectValue>{(value: WORD_DIFFICULTY) => <span className="capitalize">{value}</span>}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(WORD_DIFFICULTY).map((d) => (
                        <SelectItem key={d} value={d} className="capitalize">
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="word-active" className="cursor-pointer">
                Active
              </Label>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => <Switch id="word-active" checked={field.value} onCheckedChange={field.onChange} />}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : word ? "Save changes" : "Create word"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
