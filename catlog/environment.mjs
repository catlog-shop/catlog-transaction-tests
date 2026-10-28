import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { routes } from "./fixtures.mjs";
import { reconciliationEvidence } from "./reconciliation-evidence.mjs";
const wire = (value) =>
  JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v));
export async function environment({ test } = {}) {
  const supplied = process.env.CATLOG_BACKEND_URL,
    key = process.env.CATLOG_API_KEY;
  if (!supplied || !key)
    throw Error(
      "Set CATLOG_BACKEND_URL and CATLOG_API_KEY to the supplied Catlog configuration.",
    );
  const origin = new URL(supplied);
  if (
    origin.username ||
    origin.password ||
    origin.search ||
    origin.hash ||
    origin.pathname !== "/" ||
    !(
      origin.protocol === "https:" ||
      (origin.protocol === "http:" &&
        ["127.0.0.1", "localhost"].includes(origin.hostname))
    )
  )
    throw Error("Use an HTTPS backend origin or local loopback.");
  const initial = await fetch(origin.origin + "/catlog/v1/sessions", {
    method: "POST",
    redirect: "error",
    headers: {
      authorization: "Bearer " + key,
      "content-type": "application/json",
    },
    body: wire({ idempotencyKey: randomUUID() }),
    signal: AbortSignal.timeout(30000),
  });
  const fixture = await initial.json();
  if (!initial.ok)
    throw Object.assign(Error(fixture.error ?? "SESSION_CREATION_FAILED"), {
      code: fixture.error,
      status: initial.status,
    });
  const url = origin.origin + "/catlog/v1/sessions/" + fixture.id;
  const call = async (
    path,
    method = "GET",
    data,
    token = fixture.adminToken,
  ) => {
    const response = await fetch(url + path, {
      method,
      redirect: "error",
      headers: {
        "x-catlog-session": fixture.sessionToken,
        ...(token ? { authorization: "Bearer " + token } : {}),
        ...(data === undefined ? {} : { "content-type": "application/json" }),
      },
      body: data === undefined ? undefined : wire(data),
      signal: AbortSignal.timeout(30000),
    });
    let result;
    try {
      result = await response.json();
    } catch {
      throw Object.assign(Error("CATLOG_RESPONSE_ERROR"), {
        status: response.status,
      });
    }
    if (!response.ok)
      throw Object.assign(Error(result.error ?? "CATLOG_API_ERROR"), {
        code: result.error,
        status: response.status,
      });
    return result;
  };
  const seen = new Map();
  const snapshot = async () => {
      const state = await call("/__controls/snapshot");
      if (process.env.CATLOG_TRANSACTION_LOGS !== "false")
        for (const tx of state.transactions) {
          const value = JSON.stringify([
            tx.status,
            tx.recovery,
            tx.externalIds,
          ]);
          if (seen.get(tx.id) !== value) {
            seen.set(tx.id, value);
            console.log(
              "[CONTROLLED " +
                tx.routeId +
                "] tx=" +
                tx.id +
                " status=" +
                tx.status +
                " recovery=" +
                tx.recovery.state +
                " attempts=" +
                tx.recovery.attempts +
                " source=" +
                (tx.externalIds.sourceTransactionId ?? "-") +
                " destination=" +
                (tx.externalIds.destinationTransactionId ?? "-"),
            );
          }
        }
      return state;
    },
    providerCall = (action, data = {}) =>
      call("/provider/" + action, "POST", data);
  const evict = async (path) => {
    try {
      await call(path, "POST", {});
      throw Error("WORKER_WAS_NOT_EVICTED");
    } catch (error) {
      if (error.status !== 500) throw error;
    }
  };
  return {
    url,
    call,
    snapshot,
    merchant: fixture.merchant,
    otherMerchant: fixture.otherMerchant,
    adminToken: fixture.adminToken,
    supportToken: fixture.supportToken,
    tokenFor: (id) =>
      id === fixture.merchant.id
        ? fixture.merchant.token
        : fixture.otherMerchant.token,
    balance: async (merchantId, asset) =>
      BigInt(
        (await call("/__controls/balance", "POST", { merchantId, asset }))
          .amountAtomic,
      ),
    clock: {
      nowMs: async () => (await call("/__controls/clock", "POST", {})).nowMs,
      advanceTo: async (time) => {
        await call("/__controls/clock", "POST", { time });
      },
    },
    pool: {
      runDue: async (options = {}) => {
        await call("/__controls/run", "POST", options);
      },
      restart: async () => {
        const before = await snapshot();
        await evict("/__controls/restart");
        const after = await snapshot();
        if (before.instance === after.instance)
          throw Error("WORKER_RESTART_DID_NOT_RECREATE_INSTANCE");
      },
      claimAndCrash: async () => {
        await evict("/__controls/crash");
        const leased = (await snapshot()).jobs.find(
          (j) => j.state === "LEASED",
        );
        if (!leased) throw Error("LEASE_NOT_PERSISTED");
        return { jobId: leased.id };
      },
    },
    scan: async () => {
      await call("/__controls/scan", "POST", {});
    },
    enqueue: async (id) => {
      await call("/__controls/enqueue", "POST", { id });
    },
    provider: {
      plan: (key, steps) => providerCall("plan", { key, steps }),
      failLookups: (key, count, code) =>
        providerCall("fail-lookups", { key, count, code }),
      observe: (key, observation) =>
        providerCall("observe", { key, observation }),
      readyToResume: (key, settlement) =>
        providerCall("ready", { key, settlement }),
      deliver: (key, observation) =>
        providerCall("deliver", { key, observation }),
      snapshot: () => providerCall("snapshot"),
      remoteIds: (key) => providerCall("ids", { key }),
      loseNextSubmissionResponse: (executionId) =>
        providerCall("lose-next", { executionId }),
    },
    close: async () => {
      try {
        const directory = process.env.CATLOG_REPORT_DIR;
        if (directory && test?.testPath?.replaceAll("\\", "/").endsWith("/tests/operations/reconciliation.test.ts")) {
          const state = await call("/__controls/snapshot");
          const provider = await providerCall("snapshot");
          const accounts = new Map(state.transactions.map(transaction => [
            JSON.stringify([transaction.merchantId, transaction.destinationAsset]),
            { merchantId: transaction.merchantId, asset: transaction.destinationAsset },
          ]));
          const balances = await Promise.all([...accounts.values()].map(async account => ({
            ...account,
            amountAtomic: (await call("/__controls/balance", "POST", account)).amountAtomic,
          })));
          const evidence = reconciliationEvidence({
            sessionId: fixture.id, testName: test.currentTestName, routes, state, provider, balances,
          });
          const folder = join(directory, "reconciliation");
          mkdirSync(folder, { recursive: true });
          writeFileSync(join(folder, randomUUID() + ".json"), JSON.stringify(evidence, null, 2) + "\n");
        }
      } finally {
        await call("/__controls/cleanup", "POST", {});
      }
    },
  };
}
