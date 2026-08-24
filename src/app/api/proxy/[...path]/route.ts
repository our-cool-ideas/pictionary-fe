import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { AUTH_COOKIE_NAME } from "@/lib/constants/auth.constant";

/**
 * Generic reverse proxy: every admin-panel API call goes through here so
 * the browser never talks to the Fastify backend directly and never sees
 * its URL or the raw JWT. The httpOnly cookie is read server-side and
 * relayed as a Bearer token — the backend's own requireAdmin check is what
 * actually authorizes the request.
 */
async function forward(request: Request, path: string[]) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  const { search } = new URL(request.url);
  const targetUrl = `${env.backendApiUrl}/${path.join("/")}${search}`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const body = hasBody ? await request.text() : undefined;

  const backendRes = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: body && body.length > 0 ? body : undefined,
  });

  const responseBody = await backendRes.text();
  return new NextResponse(responseBody, {
    status: backendRes.status,
    headers: { "Content-Type": backendRes.headers.get("Content-Type") ?? "application/json" },
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, { params }: RouteContext) {
  return forward(request, (await params).path);
}
export async function POST(request: Request, { params }: RouteContext) {
  return forward(request, (await params).path);
}
export async function PATCH(request: Request, { params }: RouteContext) {
  return forward(request, (await params).path);
}
export async function PUT(request: Request, { params }: RouteContext) {
  return forward(request, (await params).path);
}
export async function DELETE(request: Request, { params }: RouteContext) {
  return forward(request, (await params).path);
}
