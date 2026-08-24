"use client";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserRoleSelect } from "@/modules/users/components/user-role-select";
import type { User } from "@/lib/types/user.type";
import type { USER_TYPE } from "@/lib/enums/role.enum";

interface UserTableProps {
  users: User[];
  currentUserId: string | undefined;
  isLoading: boolean;
  isUpdatingRole: boolean;
  onRoleChange: (id: string, role: USER_TYPE) => void;
}

export function UserTable({ users, currentUserId, isLoading, isUpdatingRole, onRoleChange }: UserTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Points</TableHead>
            <TableHead>Games</TableHead>
            <TableHead>Wins</TableHead>
            <TableHead className="w-40">Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={6}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))}

          {!isLoading && users.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                No users yet.
              </TableCell>
            </TableRow>
          )}

          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.name}
                  {isSelf && (
                    <Badge variant="outline" className="ml-2">
                      You
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                <TableCell>{user.totalPoints}</TableCell>
                <TableCell>{user.gamesPlayed}</TableCell>
                <TableCell>{user.wins}</TableCell>
                <TableCell>
                  <UserRoleSelect
                    role={user.role}
                    disabled={isSelf || isUpdatingRole}
                    onChange={(role) => onRoleChange(user.id, role)}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
