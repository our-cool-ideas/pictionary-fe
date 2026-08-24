import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(80)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase, alphanumeric, hyphen-separated"),
  icon: z.string().max(16),
  isActive: z.boolean(),
});
