"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AppConfigRow } from "@/modules/app-config/types/app-config.type";

interface AppConfigTableProps {
  config: AppConfigRow[];
  isLoading: boolean;
  onEdit: (config: AppConfigRow) => void;
  onDelete: (config: AppConfigRow) => void;
}

export function AppConfigTable({ config, isLoading, onEdit, onDelete }: AppConfigTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Key</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-24 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={5}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))}

          {!isLoading && config.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                No config keys yet.
              </TableCell>
            </TableRow>
          )}

          {config.map((row) => (
            <TableRow key={row.key}>
              <TableCell className="font-mono text-sm font-medium">{row.key}</TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">{row.value}</TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {row.type}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{row.description}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => onEdit(row)}>
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(row)}>
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
