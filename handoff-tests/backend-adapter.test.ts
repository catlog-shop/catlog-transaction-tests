import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, test, vi } from "vitest";
import { backendFactory } from "../tests/backend-adapter";

const directories: string[] = [];
afterEach(async () => {
  vi.unstubAllEnvs();
  await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true })));
});
async function moduleFile(source: string, extension = "mjs") {
  const directory = await mkdtemp(join(tmpdir(), "catlog-adapter-check-"));
  directories.push(directory);
  const path = join(directory, `adapter.${extension}`);
  await writeFile(path, source);
  vi.stubEnv("CATLOG_BACKEND_ADAPTER", path);
}
test("requires an explicitly configured private adapter", async () => {
  vi.stubEnv("CATLOG_BACKEND_ADAPTER", "");
  await expect(backendFactory("createHarness")).rejects.toThrow("CATLOG_BACKEND_ADAPTER_REQUIRED");
});
test("rejects a module missing the requested export", async () => {
  await moduleFile("export const unrelated = true;");
  await expect(backendFactory("createOperationsHarness")).rejects.toThrow("CATLOG_BACKEND_EXPORT_REQUIRED");
});
test("delegates both factories and preserves backend failures", async () => {
  // These functions throw markers; no mock backend or passing backend result is supplied.
  await moduleFile(`export async function createHarness() { throw new Error('CORE_FACTORY_CALLED'); }
    export async function createOperationsHarness() { throw new Error('OPERATIONS_FACTORY_CALLED'); }`);
  await expect((await backendFactory("createHarness"))()).rejects.toThrow("CORE_FACTORY_CALLED");
  await expect((await backendFactory("createOperationsHarness"))()).rejects.toThrow("OPERATIONS_FACTORY_CALLED");
});
test("loads a TypeScript adapter outside the test checkout", async () => {
  await moduleFile("export async function createHarness(): Promise<never> { throw new Error('TYPESCRIPT_FACTORY_CALLED'); }", "ts");
  await expect((await backendFactory("createHarness"))()).rejects.toThrow("TYPESCRIPT_FACTORY_CALLED");
});
