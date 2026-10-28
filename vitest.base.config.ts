import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

const directory = process.env.BASE_REPORT_DIR;
const url = process.env.BASE_URL;
if (!directory || !url) throw new Error("Use npm run test:base or npm run test:base:remote.");
export default defineConfig({
  test: { name: "catlog-base-tests", environment: "node", include: ["base-tests/**/*.test.ts"],
    // Vite also defines BASE_URL; preserve the API origin supplied by the runner.
    env: { BASE_URL: url },
    fileParallelism: false, allowOnly: false, passWithNoTests: false, retry: 0,
    testTimeout: 60000, hookTimeout: 30000, reporters: ["verbose", "json", "junit"],
    outputFile: { json: resolve(directory, "base-results.json"), junit: resolve(directory, "base-junit.xml") } },
});
