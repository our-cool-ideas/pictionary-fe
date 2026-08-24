import { ApiError, type ApiResponse } from "@/lib/types/api-response.type";

/**
 * Every admin-panel API call goes through this, hitting our own
 * /api/proxy/* route handlers (never the Fastify backend directly) — see
 * app/api/proxy/[...path]/route.ts for why.
 */
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/proxy/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  const result = (await res.json()) as ApiResponse<T>;

  if (!res.ok) {
    throw new ApiError(result.status, result.error, result.message);
  }

  return result.data as T;
}

export const apiClient = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
