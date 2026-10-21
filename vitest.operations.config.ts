import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/operations/**/*.test.ts"],
    testTimeout: 20_000,
    hookTimeout: 20_000,
    fileParallelism: false,
    retry: 0,
    reporters: ["verbose", "junit"],
    outputFile: { junit: "reports/operations-junit.xml" },
  },
});
