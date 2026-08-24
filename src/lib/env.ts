import { z } from "zod";

// Server-only — never prefixed with NEXT_PUBLIC_, so this is never bundled
// to the client. Read only from route handlers, proxy.ts, and other
// server-side code.
const schema = z.object({
  BACKEND_API_URL: z.string().url(),
  // Must match the Fastify backend's JWT_SECRET exactly — used here only to
  // verify (not issue) tokens, for the proxy.ts route-gating check.
  JWT_SECRET: z.string().min(32),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = {
  backendApiUrl: parsed.data.BACKEND_API_URL,
  jwtSecret: parsed.data.JWT_SECRET,
};
