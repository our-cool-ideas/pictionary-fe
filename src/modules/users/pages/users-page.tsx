"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { UserTable } from "@/modules/users/components/user-table";
import { useUsers, useUpdateUserRole } from "@/modules/users/hooks/use-users";

export function UsersPage() {
  const { data, isLoading } = useUsers();
  const { data: currentUserData } = useCurrentUser();
  const updateRole = useUpdateUserRole();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">Logged-in players and admins. Points/wins are lifetime totals.</p>
      </div>

      <UserTable
        users={data?.users ?? []}
        currentUserId={currentUserData?.user.id}
        isLoading={isLoading}
        isUpdatingRole={updateRole.isPending}
        onRoleChange={(id, role) => updateRole.mutate({ id, role })}
      />
    </div>
  );
}
