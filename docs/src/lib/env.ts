import { z } from "zod";

export const zStringBoolean = z
  .enum(["true", "false"])
  .optional()
  .default("false")
  .transform((val: "true" | "false") => val === "true");

const envSchema = z.object({
  PUBLIC_ANALYTICS_BASE_URL: z.string().optional(),
  PUBLIC_TRACKING_SERVER_ENDPOINT: z.string().optional(),
  ENABLE_APP_TRACKING: zStringBoolean,
  APP_TRACKING_SITE_ID: z.string().optional().default(""),
});

export const env = envSchema.parse(process.env);

export const docsTrackingEnabled =
  process.env.NODE_ENV === "production" &&
  env.ENABLE_APP_TRACKING &&
  env.APP_TRACKING_SITE_ID.length > 0;
