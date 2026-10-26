import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Интеграциските тестови делат една база и сами ги извршуваат миграциите: не смеат да трчаат паралелно.
    fileParallelism: false,
  },
});
