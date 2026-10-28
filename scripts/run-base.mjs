import { createHash, randomBytes, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = fileURLToPath(new URL("../", import.meta.url));
const workerRoot = join(root, "backend-worker");
const mode = process.argv[2] ?? "--remote";
if (!["--local", "--remote"].includes(mode)) throw new Error("Choose --local or --remote.");
const runId = `base-${new Date().toISOString().replaceAll(":", "-")}-${randomUUID().slice(0,8)}`;
const directory = join(root, "reports", runId);
mkdirSync(directory, { recursive: true });
const startTime = Date.now();
const run = (entry, args, env = process.env) => new Promise(resolve => {
  const child = spawn(process.execPath, [join(root, entry), ...args], { cwd: root, env, stdio: "inherit" });
  child.once("error", () => {});
  child.once("close", code => resolve(code ?? 2));
});
let local;
let url;
let health;
let reviewerKey = process.env.CATLOG_TEST_API_KEY ?? "";
try {
  if (mode === "--local") {
    if (!existsSync(join(workerRoot, "wrangler.jsonc"))) {
      throw new Error("The local Worker source is private. Use npm run test:base for the hosted API, or supply the private Worker directory.");
    }
    const { Miniflare, convertV4MiniflareOptions } = await import("miniflare");
    const build = await run("node_modules/wrangler/bin/wrangler.js", ["deploy", "--dry-run", "--config", join(workerRoot, "wrangler.jsonc"), "--outdir", join(directory, "bundle")],
      { ...process.env, WRANGLER_SEND_METRICS: "false" });
    if (build !== 0) throw new Error("Base build failed.");
    const signingSecret = randomBytes(32).toString("hex");
    reviewerKey ||= `catlog_test_${randomBytes(32).toString("base64url")}`;
    local = new Miniflare({ ...convertV4MiniflareOptions({ modules: true, scriptPath: join(directory, "bundle/index.js"),
      compatibilityDate: "2026-10-27", host: "127.0.0.1", port: 0, cf: false,
      bindings: { BASE_API_TOKEN: signingSecret, BUILD_REVISION: "local-development",
        REVIEWER_API_KEY_SHA256: createHash("sha256").update(reviewerKey).digest("hex"), REQUIRE_REVIEWER_KEY: "true" },
      ratelimits: {
        SESSION_CREATION: { namespace_id: "2026102701", simple: { limit: 120, period: 60 } },
        SESSION_REQUESTS: { namespace_id: "2026102702", simple: { limit: 600, period: 60 } },
      },
      durableObjects: { BASE_SESSIONS: { className: "BaseSession", useSQLite: true } },
      durableObjectsPersist: join(directory, "local-state"),
    }), telemetry: { enabled: false } });
    url = (await local.ready).origin;
  } else {
    const endpoint = JSON.parse(readFileSync(join(root, "config/base.json"), "utf8"));
    url = process.env.BASE_URL || endpoint.url;
    if (!url) throw new Error("Set the hosted API URL in config/base.json or BASE_URL.");
  }
  const parsed = new URL(url);
  if ((parsed.protocol !== "https:" && !(parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname))) ||
      parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== "/") {
    throw new Error("Use an HTTPS backend origin, or local loopback HTTP, without embedded credentials or a path.");
  }
  url = parsed.origin;
  // Check the explicit backend identity before creating isolated test sessions.
  const healthResponse = await fetch(`${url}/health`, { redirect: "error", signal: AbortSignal.timeout(15000) });
  health = await healthResponse.json();
  if (!healthResponse.ok || healthResponse.headers.get("x-catlog-backend") !== "true" || health.backend !== true ||
      health.mode !== "base" || health.base !== true || health.service !== "catlog test") throw new Error("Target did not identify itself as the test backend.");
  if (health.data?.authentication !== "reviewer-key") throw new Error("This backend does not require reviewer-key authentication.");
  if (!reviewerKey) {
    throw new Error("Set CATLOG_TEST_API_KEY in the environment or place the provided .env.reviewer file in the repository root.");
  }
  if (reviewerKey && !/^catlog_test_[A-Za-z0-9_-]{43}$/.test(reviewerKey)) throw new Error("The reviewer API key has an invalid format.");
  console.log(`BASE TEST — test data — ${mode === "--local" ? "local Workers runtime" : "deployed Worker"}: ${url}`);
  const environment = { ...process.env, BASE_URL: url, BASE_REPORT_DIR: directory, CATLOG_TEST_API_KEY: reviewerKey };
  delete environment.BASE_API_TOKEN;
  const exitCode = await run("node_modules/vitest/vitest.mjs", ["run", "--config", "vitest.base.config.ts"],
    environment);
  let report;
  try { report = JSON.parse(readFileSync(join(directory, "base-results.json"), "utf8")); } catch {}
  const assertions = report?.testResults?.flatMap(file => file.assertionResults ?? []) ?? [];
  const success = exitCode === 0 && report?.success === true && report.numTotalTests === 30 &&
    report.numPassedTests === 30 && report.numFailedTests === 0 && report.numPendingTests === 0 && report.numTodoTests === 0 &&
    assertions.length === 30 && assertions.every(test => test.status === "passed");
  const validation = { backendValidated: success, onchainTransfers: false };
  const summary = { ...validation, service: "catlog test", backend: true, mode: health.mode,
    target: mode === "--local" ? "local-worker-runtime" : "cloudflare-worker",
    apiUrl: url, buildRevision: health.data?.buildRevision, runId, startedAt: new Date(startTime).toISOString(),
    finishedAt: new Date().toISOString(), result: success ? "passed" : "failed",
    collected: report?.numTotalTests ?? 0, passed: report?.numPassedTests ?? 0,
    failed: report?.numFailedTests ?? 0, skipped: (report?.numPendingTests ?? 0) + (report?.numTodoTests ?? 0),
    scope: "Catlog test Worker backend transaction and ledger scenarios over HTTP. Live payment providers and onchain transfers are not exercised." };
  writeFileSync(join(directory, "base-summary.json"), JSON.stringify(summary, null, 2) + "\n");
  console.log(JSON.stringify(validation, null, 2));
  console.log(`Backend summary: reports/${runId}/base-summary.json`);
  process.exitCode = success ? 0 : 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : "Base test run failed.");
  process.exitCode = 1;
} finally { await local?.dispose(); }
