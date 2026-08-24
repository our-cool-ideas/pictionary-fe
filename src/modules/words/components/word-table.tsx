"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Word } from "@/modules/words/types/word.type";
import type { Category } from "@/modules/categories/types/category.type";

interface WordTableProps {
  words: Word[];
  categories: Category[];
  isLoading: boolean;
  onEdit: (word: Word) => void;
  onDelete: (word: Word) => void;
}

export function WordTable({ words, categories, isLoading, onEdit, onDelete }: WordTableProps) {
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Word</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Difficulty</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-24 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={5}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))}

          {!isLoading && words.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                No words yet.
              </TableCell>
            </TableRow>
          )}

          {words.map((word) => (
            <TableRow key={word.id}>
              <TableCell className="font-medium">{word.text}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{categoryName(word.categoryId)}</TableCell>
              <TableCell className="text-sm capitalize">{word.difficulty}</TableCell>
              <TableCell>
                <Badge variant={word.isActive ? "default" : "secondary"}>{word.isActive ? "Active" : "Inactive"}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => onEdit(word)}>
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(word)}>
                  <Trash2 className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
