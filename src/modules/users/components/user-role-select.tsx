"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { USER_TYPE } from "@/lib/enums/role.enum";

interface UserRoleSelectProps {
  role: USER_TYPE;
  disabled: boolean;
  onChange: (role: USER_TYPE) => void;
}

export function UserRoleSelect({ role, disabled, onChange }: UserRoleSelectProps) {
  return (
    <Select value={role} disabled={disabled} onValueChange={(val) => val && onChange(val as USER_TYPE)}>
      <SelectTrigger className="w-32">
        <SelectValue>{(value: USER_TYPE) => (value === USER_TYPE.ADMIN ? "Admin" : "Player")}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={USER_TYPE.PLAYER}>Player</SelectItem>
        <SelectItem value={USER_TYPE.ADMIN}>Admin</SelectItem>
      </SelectContent>
    </Select>
  );
}
