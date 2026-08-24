import { jwtVerify } from "jose";
import { env } from "@/lib/env";
import { USER_TYPE } from "@/lib/enums/role.enum";

export interface JwtPayload {
  sub: string;
  role: USER_TYPE;
}

const secretKey = new TextEncoder().encode(env.jwtSecret);

/**
 * Verifies the token's signature (not just decodes it) using the same
 * secret the backend signs with. This is a UX-layer gate for proxy.ts only
 * — the real security boundary is the backend's own requireAdmin check on
 * every request, which happens independently regardless of what this says.
 */
export async function verifyAuthToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    if (typeof payload.sub !== "string") return null;
    if (payload.role !== USER_TYPE.PLAYER && payload.role !== USER_TYPE.ADMIN) return null;
    return { sub: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}
