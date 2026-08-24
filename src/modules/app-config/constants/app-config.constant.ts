import { APP_CONFIG_TYPE } from "@/modules/app-config/enums/app-config-type.enum";
import type { AppConfigFormValues } from "@/modules/app-config/types/app-config.type";

export const EMPTY_APP_CONFIG_FORM_VALUES: AppConfigFormValues = {
  key: "",
  value: "",
  type: APP_CONFIG_TYPE.STRING,
  description: "",
};

export const appConfigQueryKeys = {
  all: ["app-config"] as const,
};
