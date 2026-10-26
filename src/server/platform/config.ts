import { z } from "zod";

// Подесувањата се читаат и проверуваат ЛЕНО (кога се бараат), не при увоз на модулот,
// за да не пукне `next build` на компјутер без база.

const schema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "is required")
    .refine((v) => v.startsWith("mysql://"), "must start with mysql://"),
  DB_POOL_SIZE: z.coerce.number().int().min(1).max(50).default(5),
});

export type AppConfig = z.infer<typeof schema>;

/** Проверува променливи на околината. Пораките за грешка никогаш не ги содржат вредностите (лозинки). */
export function loadConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `${i.path.join(".") || "env"} ${i.message}`).join("; ");
    throw new Error(`Invalid configuration: ${problems}`);
  }
  return parsed.data;
}

let cached: AppConfig | undefined;

export function getConfig(): AppConfig {
  return (cached ??= loadConfig());
}

export const isDatabaseConfigured = () => Boolean(process.env.DATABASE_URL);
