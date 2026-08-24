import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE_SECONDS } from "@/lib/constants/auth.constant";
import { USER_TYPE } from "@/lib/enums/role.enum";
import type { ApiResponse } from "@/lib/types/api-response.type";
import type { User } from "@/lib/types/user.type";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { status: 400, data: null, error: "BAD_REQUEST", message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const backendRes = await fetch(`${env.backendApiUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const result = (await backendRes.json()) as ApiResponse<{ user: User; token: string }>;

  if (!backendRes.ok || !result.data) {
    return NextResponse.json(result, { status: backendRes.status });
  }

  const { user, token } = result.data;

  // This is the admin panel's login — a valid player account isn't enough.
  // Reject before ever setting a cookie for a non-admin.
  if (user.role !== USER_TYPE.ADMIN) {
    return NextResponse.json(
      { status: 403, data: null, error: "FORBIDDEN", message: "This account does not have admin access." },
      { status: 403 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  });

  return NextResponse.json({ status: 200, data: { user }, error: null, message: result.message });
}
