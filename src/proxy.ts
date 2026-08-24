import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, ADMIN_LOGIN_PATH, ADMIN_HOME_PATH } from "@/lib/constants/auth.constant";
import { verifyAuthToken } from "@/lib/jwt";
import { USER_TYPE } from "@/lib/enums/role.enum";

/**
 * Gates every /admin/* page. This is a UX layer only — redirects a
 * logged-out or non-admin browser away before it ever sees the shell. The
 * backend independently re-verifies the JWT + role on every API call, which
 * remains the actual security boundary regardless of what happens here.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const payload = token ? await verifyAuthToken(token) : null;
  const isAuthedAdmin = payload?.role === USER_TYPE.ADMIN;

  if (pathname === ADMIN_LOGIN_PATH) {
    if (isAuthedAdmin) {
      return NextResponse.redirect(new URL(ADMIN_HOME_PATH, request.url));
    }
    return NextResponse.next();
  }

  if (!isAuthedAdmin) {
    return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
