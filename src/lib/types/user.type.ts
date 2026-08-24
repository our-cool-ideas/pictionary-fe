import type { USER_TYPE } from "@/lib/enums/role.enum";

/**
 * Global — used by the auth module (login/me responses), the users module,
 * and the global sidebar. Not owned by any single module.
 */
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: USER_TYPE;
  totalPoints: number;
  gamesPlayed: number;
  wins: number;
  createdAt: string;
  updatedAt: string;
}
