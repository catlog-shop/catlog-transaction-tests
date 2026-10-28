import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, openSync, closeSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, spawn } from "node:child_process";
import { evaluateReport } from "./private-report.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(readFileSync(join(root, "scripts/backend-suite.json"), "utf8"));
const git = (cwd, ...args) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const hash = data => createHash("sha256").update(data).digest("hex");

async function run() {
  const adapterValue = process.env.CATLOG_BACKEND_ADAPTER;
  const backendValue = process.env.CATLOG_BACKEND_ROOT;
  const label = process.env.CATLOG_TEST_ENVIRONMENT;
  if (!adapterValue || !backendValue || !label || !/^[a-zA-Z0-9_-]{1,64}$/.test(label)) {
    throw new Error("Set CATLOG_BACKEND_ADAPTER, CATLOG_BACKEND_ROOT and CATLOG_TEST_ENVIRONMENT (a short label, not a URL).");
  }
  const adapter = resolve(adapterValue);
  const backend = resolve(backendValue);
  if (!existsSync(adapter)) throw new Error("The private adapter file does not exist.");
  const metadata = {
    backendRevision: git(backend, "rev-parse", "HEAD"),
    backendDirty: Boolean(git(backend, "status", "--porcelain")),
    testsRevision: git(root, "rev-parse", "HEAD"),
    testsDirty: Boolean(git(root, "status", "--porcelain")),
    adapterSha256: hash(readFileSync(adapter)),
    testInputsSha256: hash(git(root, "ls-files", "-z").split("\0").filter(name =>
      /^(tests\/|scripts\/|vitest.*config\.ts$|package(?:-lock)?\.json$|tsconfig\.json$)/.test(name)
    ).sort().map(name => `${name}\0${hash(readFileSync(join(root, name)))}`).join("\n")),
  };
  process.umask(0o077);
  const startedAt = new Date().toISOString();
  const runId = `private-${startedAt.replaceAll(":", "-")}-${randomUUID().slice(0,8)}`;
  const directory = join(root, "reports", runId);
  const privateDirectory = join(directory, "private");
  mkdirSync(privateDirectory, { recursive: true, mode: 0o700 });
  const environment = { ...process.env, CATLOG_BACKEND_ADAPTER: adapter, CATLOG_PRIVATE_REPORT_DIR: privateDirectory };
  const execute = (entry, args, log) => new Promise(resolveExit => {
    const fd = openSync(join(privateDirectory, log), "wx", 0o600);
    const child = spawn(process.execPath, [join(root, entry), ...args], {
      cwd: root, env: environment, stdio: ["ignore", fd, fd],
    });
    child.once("error", () => { /* The close event records a failed launch. */ });
    child.once("close", code => { closeSync(fd); resolveExit(code ?? 2); });
  });
  console.log("Running Catlog backend tests. Detailed output stays in the private report directory.");
  const typecheckExitCode = await execute("node_modules/typescript/bin/tsc", ["--noEmit"], "typecheck.log");
  let testExitCode = null;
  if (typecheckExitCode === 0) testExitCode = await execute("node_modules/vitest/vitest.mjs", ["run", "--config", "vitest.private.config.ts"], "vitest.log");
  let report;
  try { report = JSON.parse(readFileSync(join(privateDirectory, "results.json"), "utf8")); } catch { /* A missing report is a failed run. */ }
  const result = evaluateReport(report, manifest, root, typecheckExitCode, testExitCode);
  const evidence = {};
  for (const name of ["results.json", "junit.xml"]) {
    const file = join(privateDirectory, name);
    if (existsSync(file)) evidence[name] = hash(readFileSync(file));
  }
  if (!evidence["junit.xml"] || !evidence["results.json"]) result.result = "failed";
  const summary = { schemaVersion: 1, runId, startedAt, finishedAt: new Date().toISOString(),
    environment: label, ...metadata, typecheckExitCode, testExitCode, ...result, reportSha256: evidence,
    scope: "Existing acceptance cases executed through developer-supplied private backend bindings",
    provenance: "Backend revision identifies the configured checkout. Developers must verify that the bound services use this revision. This runner does not attest deployment identity.",
  };
  writeFileSync(join(directory, "summary.json"), JSON.stringify(summary, null, 2) + "\n", { mode: 0o600, flag: "wx" });
  console.log(`Result: ${result.result}; ${result.passed}/${result.expected} passed, ${result.failed} failed, ${result.skipped} skipped.`);
  console.log(`Summary: reports/${runId}/summary.json`);
  console.log(`Private diagnostics: reports/${runId}/private/`);
  process.exitCode = result.result === "passed" ? 0 : 1;
}

run().catch(error => {
  // Never dump environment values or private paths in the console.
  console.error(error instanceof Error && !error.message.startsWith("Command failed")
    ? error.message : "Private run could not start. Verify that both directories are accessible Git checkouts.");
  process.exitCode = 2;
});
