import { z } from "zod";
import { APP_CONFIG_TYPE } from "@/modules/app-config/enums/app-config-type.enum";

export const appConfigSchema = z.object({
  key: z
    .string()
    .min(1, "Key is required")
    .max(120)
    .regex(/^[a-z0-9_]+$/, "Lowercase, alphanumeric, underscore-separated"),
  value: z.string().min(1, "Value is required"),
  type: z.enum(APP_CONFIG_TYPE),
  description: z.string().max(280),
});
