import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import { defineConfig, mergeConfig } from "vitest/config";
import base from "./vitest.config";

const reportDir = process.env.CATLOG_PRIVATE_REPORT_DIR;
if (!reportDir) throw new Error("Use npm run test:private to create a fresh private report directory.");
const suite = JSON.parse(readFileSync(new URL("./scripts/backend-suite.json", import.meta.url), "utf8")) as { file: string }[];

export default mergeConfig(base, defineConfig({
  test: {
    include: suite.map(item => item.file),
    allowOnly: false,
    passWithNoTests: false,
    reporters: ["json", "junit"],
    outputFile: { json: resolve(reportDir, "results.json"), junit: resolve(reportDir, "junit.xml") },
  },
}));
