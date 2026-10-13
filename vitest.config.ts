import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/live/**"],
    testTimeout: 20_000,
    hookTimeout: 20_000,
    fileParallelism: false,
    retry: 0,
    reporters: ["verbose"],
  },
});
