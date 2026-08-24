import type { z } from "zod";
import type { appConfigSchema } from "@/modules/app-config/validation/app-config.validation";
import type { APP_CONFIG_TYPE } from "@/modules/app-config/enums/app-config-type.enum";

export interface AppConfigRow {
  key: string;
  value: string;
  type: APP_CONFIG_TYPE;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AppConfigFormValues = z.infer<typeof appConfigSchema>;
