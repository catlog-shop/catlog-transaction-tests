import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/cctp/arc-stellar.test.ts"],
    testTimeout: 1_200_000,
    fileParallelism: false,
    retry: 0,
    reporters: ["verbose", "junit"],
    outputFile: { junit: "reports/cctp-testnet-junit.xml" },
  },
});
