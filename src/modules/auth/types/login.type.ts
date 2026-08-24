import type { z } from "zod";
import type { loginSchema } from "@/modules/auth/validation/login.validation";
import type { User } from "@/lib/types/user.type";

export type LoginFormValues = z.infer<typeof loginSchema>;

export interface LoginResult {
  user: User;
}
