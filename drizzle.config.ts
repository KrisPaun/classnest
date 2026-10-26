import { defineConfig } from "drizzle-kit";

// `npm run db:generate` создава SQL миграции во ./drizzle од шемата. Не бара врска со база.
export default defineConfig({
  dialect: "mysql",
  schema: "./src/server/db/schema",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "mysql://classnest:classnest@127.0.0.1:3306/classnest",
  },
});
