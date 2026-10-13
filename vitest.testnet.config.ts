import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/live/**/*.test.ts"],
    testTimeout: 240_000,
    fileParallelism: false,
    retry: 0,
    reporters: ["verbose", "junit"],
    outputFile: { junit: "reports/stellar-testnet-junit.xml" },
  },
});
