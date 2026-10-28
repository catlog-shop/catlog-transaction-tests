import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["handoff-tests/**/*.test.ts"], retry: 0, allowOnly: false },
});
