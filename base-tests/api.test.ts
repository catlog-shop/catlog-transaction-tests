import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { ROUTES } from "./contract";
import { BaseClient } from "./client";

const url = process.env.BASE_URL;
const reviewerKey = process.env.CATLOG_TEST_API_KEY ?? "";
if (!url) throw new Error("Run npm test or npm run test:base.");
const api = new BaseClient(url, "", undefined, reviewerKey);
let session: BaseClient;
beforeEach(async () => { session = await api.open(); });
afterEach(async () => { await session?.close(); });

describe.each(ROUTES)("BASE TEST — synthetic %s", route => {
  test("successful path credits synthetic net value once and exposes synthetic identifiers", async () => {
    const created = await session.create(route, "success");
    expect(created.status).toBe("PENDING");
    expect((await session.ledger()).totalAtomic).toBe("0");
    const { transaction } = await session.process(created.id);
    expect(transaction).toMatchObject({ status: "COMPLETED", attempts: 1, recovery: "NONE" });
    expect(transaction.history.map(item => item.status)).toEqual(["PENDING", "COMPLETED"]);
    expect(transaction.externalIds.sourceTransactionId).toMatch(/^base-source-/);
    expect(transaction.externalIds.destinationTransactionId).toMatch(/^base-destination-/);
    expect(transaction.externalIds.bridgeMessageId === null).toBe(route.startsWith("near"));
    const ledger = await session.ledger();
    expect(ledger.totalAtomic).toBe("99000000");
    expect(ledger.credits).toEqual([expect.objectContaining({ transactionId: created.id, merchantId: created.merchantId, asset: "USDC", amountAtomic: "99000000" })]);
    expect((await session.process(created.id)).processed).toBe(false);
    expect(await session.ledger()).toEqual(ledger);
    expect((await session.list("COMPLETED")).transactions.map(item => item.id)).toEqual([created.id]);
  });
  test("failed path is terminal and never credits a synthetic merchant", async () => {
    const created = await session.create(route, "failure");
    expect((await session.process(created.id)).transaction).toMatchObject({ status: "FAILED", lastErrorCode: "BASE_TRANSFER_REJECTED" });
    expect((await session.event(created.id, "COMPLETED")).applied).toBe(false);
    expect((await session.get(created.id)).status).toBe("FAILED");
    expect((await session.ledger()).totalAtomic).toBe("0");
    expect((await session.list("FAILED")).transactions).toHaveLength(1);
  });
  test("retried path respects the due time before completing once", async () => {
    const created = await session.create(route, "retry");
    const first = (await session.process(created.id)).transaction;
    expect(first).toMatchObject({ status: "PENDING", recovery: "SCHEDULED", attempts: 1, nextAttemptAtMs: created.createdAtMs + 1000 });
    expect((await session.list("RECOVERABLE")).transactions).toHaveLength(1);
    expect((await session.ledger()).credits).toHaveLength(0);
    await session.advance(999);
    expect((await session.process(created.id)).processed).toBe(false);
    expect((await session.get(created.id)).attempts).toBe(1);
    await session.advance(1);
    expect((await session.process(created.id)).transaction).toMatchObject({ status: "COMPLETED", recovery: "NONE", attempts: 2, nextAttemptAtMs: null });
    expect((await session.ledger()).credits).toHaveLength(1);
  });
  test("expired path stays pending before expiry, then rejects a late completion", async () => {
    const created = await session.create(route, "expiry", { ttlMs: 1000 });
    await session.advance(999);
    expect((await session.process(created.id)).transaction.status).toBe("PENDING");
    await session.advance(1);
    expect((await session.process(created.id)).transaction).toMatchObject({ status: "EXPIRED", attempts: 0 });
    expect((await session.event(created.id, "COMPLETED")).applied).toBe(false);
    expect((await session.get(created.id)).status).toBe("EXPIRED");
    expect((await session.ledger()).credits).toHaveLength(0);
    expect((await session.list("EXPIRED")).transactions).toHaveLength(1);
  });
  test("concurrent duplicate events and a new event ID still produce one synthetic credit", async () => {
    const created = await session.create(route, "success");
    const eventId = `base-event-${randomUUID()}`;
    const results = await Promise.all(Array.from({ length: 6 }, () => session.event(created.id, "COMPLETED", eventId)));
    expect(results.filter(item => item.applied)).toHaveLength(1);
    expect(results.filter(item => item.duplicate)).toHaveLength(5);
    const before = await session.ledger();
    expect(before.credits).toHaveLength(1);
    expect(before.totalAtomic).toBe("99000000");
    expect((await session.event(created.id, "COMPLETED")).applied).toBe(false);
    await session.event(created.id, "FAILED");
    expect((await session.get(created.id)).status).toBe("COMPLETED");
    expect(await session.ledger()).toEqual(before);
  });
  test("retry exhaustion is recoverable rather than a confirmed financial failure", async () => {
    const created = await session.create(route, "retry", { failuresBeforeSuccess: 3 });
    await session.process(created.id);
    await session.advance(1000);
    const second = (await session.process(created.id)).transaction;
    expect(second.nextAttemptAtMs).toBe(created.createdAtMs + 3000);
    await session.advance(2000);
    const final = (await session.process(created.id)).transaction;
    expect(final).toMatchObject({ status: "PENDING", recovery: "MANUAL_REQUIRED", attempts: 3, nextAttemptAtMs: null });
    expect((await session.process(created.id)).processed).toBe(false);
    expect((await session.ledger()).credits).toHaveLength(0);
  });
  test("concurrent repeated keys reuse one transaction and conflicting payloads fail", async () => {
    const idempotencyKey = randomUUID();
    const results = await Promise.all(Array.from({ length: 6 }, () => session.create(route, "success", { idempotencyKey })));
    expect(new Set(results.map(item => item.id)).size).toBe(1);
    expect((await session.list()).transactions).toHaveLength(1);
    await expect(session.create(route, "success", { idempotencyKey, amountAtomic: "200000000" }))
      .rejects.toMatchObject({ code: "IDEMPOTENCY_CONFLICT", status: 409 });
    await session.process(results[0].id);
    expect((await session.create(route, "success", { idempotencyKey })).id).toBe(results[0].id);
    expect((await session.ledger()).credits).toHaveLength(1);
  });
});

describe("BASE TEST — API boundaries", () => {
  test("health identifies the backend without authentication", async () => {
    const response = await fetch(new URL("/health", url));
    const envelope = await response.json() as { backend: boolean; data: { scenarios: string[]; routes: string[]; authentication: string } };
    expect(response.headers.get("x-catlog-backend")).toBe("true");
    expect(envelope.backend).toBe(true);
    const health = envelope.data;
    expect(health.scenarios).toEqual(["success", "failure", "retry", "expiry", "duplicate-event"]);
    expect(health.routes).toEqual([...ROUTES]);
    expect(health.authentication).toBe("reviewer-key");
  });
  test("missing and invalid tokens cannot access or mutate a session", async () => {
    for (const credential of ["", "invalid-test-credential"]) {
      await expect(api.call(session.path("/transactions"), "GET", undefined, credential)).rejects.toMatchObject({ status: 401 });
      await expect(api.call(session.path(), "DELETE", undefined, credential)).rejects.toMatchObject({ status: 401 });
    }
    expect((await session.list()).transactions).toHaveLength(0);
  });
  test("session credentials cannot read, modify or delete another session", async () => {
    const other = await api.open();
    try {
      expect(session.token === other.token).toBe(false);
      for (const [path, method, payload] of [
        [session.path("/transactions"), "GET", undefined],
        [session.path("/clock"), "POST", { advanceMs: 1000 }],
        [session.path(), "DELETE", undefined],
      ] as const) {
        await expect(other.call(path, method, payload)).rejects.toMatchObject({ status: 401 });
      }
      const [expiresAt, signature] = session.token.split(".");
      const tampered = `${Number(expiresAt) + 86400000}.${signature}`;
      await expect(api.call(session.path(), "GET", undefined, tampered)).rejects.toMatchObject({ status: 401 });
      expect((await session.list()).transactions).toHaveLength(0);
    } finally { await other.close(); }
  });
  test("session creation rejects caller-controlled session properties", async () => {
    for (const payload of [{ id: session.sessionId }, { deleteAtMs: 9999999999999 }, { token: "caller-chosen" }]) {
      await expect(api.call("/v1/base", "POST", payload, reviewerKey)).rejects.toMatchObject({ status: 400, code: "EMPTY_SESSION_REQUEST_REQUIRED" });
    }
  });
  test("separate sessions isolate identical request keys and synthetic balances", async () => {
    const other = await api.open();
    try {
      const idempotencyKey = randomUUID();
      const first = await session.create(ROUTES[0], "success", { idempotencyKey });
      const second = await other.create(ROUTES[0], "success", { idempotencyKey });
      expect(first.id).not.toBe(second.id);
      await session.process(first.id);
      expect((await other.ledger()).credits).toHaveLength(0);
      await expect(other.get(first.id)).rejects.toMatchObject({ status: 404 });
    } finally { await other.close(); }
  });
  test("an event ID cannot be reused for another transaction or outcome", async () => {
    const first = await session.create(ROUTES[0], "success");
    const second = await session.create(ROUTES[0], "success");
    const eventId = `base-event-${randomUUID()}`;
    await session.event(first.id, "COMPLETED", eventId);
    await expect(session.event(second.id, "COMPLETED", eventId)).rejects.toMatchObject({ code: "EVENT_ID_CONFLICT" });
    await expect(session.event(first.id, "FAILED", eventId)).rejects.toMatchObject({ code: "EVENT_ID_CONFLICT" });
    expect((await session.get(second.id)).status).toBe("PENDING");
    expect((await session.ledger()).credits).toHaveLength(1);
  });
  test("input validation rejects fractional amounts, invalid fees and non-synthetic merchants", async () => {
    for (const extra of [{ amountAtomic: "1.5" }, { amountAtomic: 100000000 }, { feeAtomic: "100000001" }, { merchantId: "real-merchant" }, { ttlMs: -1 }]) {
      await expect(session.create(ROUTES[0], "success", extra)).rejects.toMatchObject({ status: 400 });
    }
    await expect(session.advance(-1)).rejects.toMatchObject({ status: 400 });
    expect((await session.list()).transactions).toHaveLength(0);
  });
  test("deleting a session removes its transactions and synthetic ledger", async () => {
    const transaction = await session.create(ROUTES[0], "success");
    await session.process(transaction.id);
    await session.close();
    await expect(session.list()).rejects.toMatchObject({ code: "SESSION_NOT_FOUND" });
  });
  test("invalid reviewer keys cannot create sessions or access existing sessions", async () => {
    const invalidKey = `catlog_test_${"A".repeat(43)}`;
    await expect(api.call("/v1/base", "POST", {}, invalidKey)).rejects.toMatchObject({ status: 401 });
    await expect(api.call(session.path(), "GET", undefined, invalidKey)).rejects.toMatchObject({ status: 401 });
    await expect(api.call(session.path(), "GET", undefined, reviewerKey)).rejects.toMatchObject({ status: 401 });
    await expect(api.call("/v1/base", "POST", {}, "")).rejects.toMatchObject({ status: 401 });
    expect((await session.list()).transactions).toHaveLength(0);
  });
});
