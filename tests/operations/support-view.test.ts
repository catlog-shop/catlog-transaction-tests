import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createOperationsHarness } from "./catlog.integration";
import {
  assertFixture, assertSettledOnce, externalIds, key, record, request, settlement,
} from "./fixtures";
import {
  REQUIRED_ROUTES, TEST_POLICY,
  type OperationRecord, type OperationsHarness, type RouteId, type SupportRow,
  type SupportState,
} from "./harness";

// Acceptance coverage for the authenticated API backing the support view.
// A browser renderer is not exercised. All states originate in Catlog services
// and workers; only the external provider boundary is simulated.
describe("Catlog support view API", () => {
  let h: OperationsHarness | undefined;

  beforeEach(async () => {
    h = await createOperationsHarness();
    await assertFixture(h);
  });

  afterEach(async () => {
    const current = h;
    h = undefined;
    await current?.close();
  });

  function displayState(transaction: OperationRecord): SupportState {
    if (transaction.status === "PENDING" &&
      transaction.recovery.state !== "NONE") {
      return "RECOVERABLE";
    }
    return transaction.status;
  }

  function expectView(row: SupportRow, transaction: OperationRecord): void {
    expect(row).toMatchObject({
      id: transaction.id,
      merchantId: transaction.merchantId,
      routeId: transaction.routeId,
      financialStatus: transaction.status,
      state: displayState(transaction),
      externalIds: transaction.externalIds,
      recovery: transaction.recovery,
    });
  }

  async function pending(routeId: RouteId, merchantId = h!.fixture.merchantId) {
    const value = request(h!, routeId, merchantId);
    const ids = externalIds(routeId);
    await h!.provider.plan(key(value), [{ result: "ACCEPTED", externalIds: ids }]);
    await h!.provider.observe(key(value), { status: "PENDING", externalIds: ids });
    const transaction = await h!.createTransfer(value);
    await h!.workers.runDue();
    expect(record(await h!.snapshot(), transaction.id)).toMatchObject({
      ...value, status: "PENDING", externalIds: ids, recovery: { state: "NONE" },
    });
    return { ...transaction, value, ids };
  }

  async function completed(routeId: RouteId) {
    const transaction = await pending(routeId);
    const receipt = settlement(transaction.value, transaction.ids);
    await h!.provider.observe(key(transaction.value), { status: "COMPLETED", settlement: receipt });
    await h!.provider.deliver(key(transaction.value), { status: "COMPLETED", settlement: receipt });
    await h!.workers.runDue();
    await assertSettledOnce(h!, transaction.id, receipt);
    return { ...transaction, receipt };
  }

  async function failed(routeId: RouteId) {
    const transaction = await pending(routeId);
    const failure = { status: "FAILED" as const, externalIds: transaction.ids, code: "TRANSFER_REJECTED" };
    await h!.provider.observe(key(transaction.value), failure);
    await h!.provider.deliver(key(transaction.value), failure);
    await h!.workers.runDue();
    const state = await h!.snapshot();
    expect(record(state, transaction.id).status).toBe("FAILED");
    expect(state.settlements.filter(row => row.transactionId === transaction.id)).toHaveLength(0);
    return transaction;
  }

  async function recoverable(routeId: RouteId, manual: boolean) {
    const value = request(h!, routeId);
    await h!.provider.plan(key(value), Array.from({ length: TEST_POLICY.maxAttempts }, () => ({
      result: "TRANSIENT_ERROR" as const, code: "PROVIDER_UNAVAILABLE",
    })));
    const transaction = await h!.createTransfer(value);
    await h!.workers.runDue();
    if (manual) {
      for (let attempt = 1; attempt < TEST_POLICY.maxAttempts; attempt += 1) {
        const scheduled = record(await h!.snapshot(), transaction.id);
        expect(scheduled.recovery.state).toBe("SCHEDULED");
        expect(scheduled.recovery.nextAttemptAtMs).not.toBeNull();
        await h!.clock.advanceTo(scheduled.recovery.nextAttemptAtMs!);
        await h!.workers.runDue();
      }
    }
    expect(record(await h!.snapshot(), transaction.id)).toMatchObject({
      status: "PENDING", recovery: { state: manual ? "MANUAL_REQUIRED" : "SCHEDULED" },
    });
    return { ...transaction, value };
  }

  async function lostResponse(routeId: RouteId, merchantId = h!.fixture.merchantId) {
    const value = request(h!, routeId, merchantId);
    const ids = externalIds(routeId);
    await h!.provider.plan(key(value), [{ result: "ACCEPTED_RESPONSE_LOST", externalIds: ids }]);
    await h!.provider.observe(key(value), { status: "PENDING", externalIds: ids });
    const transaction = await h!.createTransfer(value);
    await h!.workers.runDue();
    expect(record(await h!.snapshot(), transaction.id)).toMatchObject({
      ...value, status: "PENDING", recovery: { state: "SCHEDULED" },
    });
    return { ...transaction, value, ids };
  }

  test("filters all routes by support state and matches persisted records in lists and details", async () => {
    // Exhaust retry budgets before creating scheduled rows, so advancing the
    // injected clock cannot accidentally move those rows into another state.
    for (const route of REQUIRED_ROUTES) await recoverable(route.id, true);
    for (const route of REQUIRED_ROUTES) {
      await pending(route.id);
      await completed(route.id);
      await failed(route.id);
    }
    await pending(REQUIRED_ROUTES[0].id, h!.fixture.otherMerchantId);
    for (const route of REQUIRED_ROUTES) await recoverable(route.id, false);

    const persisted = (await h!.snapshot()).transactions;
    const all = await h!.support.list("support", { limit: 100 });
    expect(all.nextCursor).toBeNull();
    expect(all.rows.map(row => row.id).sort()).toEqual(persisted.map(row => row.id).sort());
    for (const row of all.rows) {
      const transaction = persisted.find(item => item.id === row.id)!;
      expectView(row, transaction);
      expectView(await h!.support.detail("support", row.id), transaction);
    }
    expect(new Set(all.rows.map(row => row.merchantId))).toEqual(
      new Set([h!.fixture.merchantId, h!.fixture.otherMerchantId]),
    );

    for (const state of ["PENDING", "COMPLETED", "FAILED", "RECOVERABLE"] as const) {
      const filtered = await h!.support.list("support", { state, limit: 100 });
      const expected = persisted.filter(row => displayState(row) === state);
      expect(expected.length).toBeGreaterThan(0);
      expect(filtered.nextCursor).toBeNull();
      expect(filtered.rows.map(row => row.id).sort()).toEqual(expected.map(row => row.id).sort());
      for (const route of REQUIRED_ROUTES) {
        const byRoute = await h!.support.list("support", { state, routeId: route.id, limit: 100 });
        const routeExpected = expected.filter(row => row.routeId === route.id);
        expect(routeExpected.length).toBeGreaterThan(0);
        expect(byRoute.nextCursor).toBeNull();
        expect(byRoute.rows.map(row => row.id).sort()).toEqual(routeExpected.map(row => row.id).sort());
        for (const row of byRoute.rows) expectView(row, routeExpected.find(item => item.id === row.id)!);
      }
    }

    const recoveryRows = all.rows.filter(row => row.state === "RECOVERABLE");
    expect(new Set(recoveryRows.map(row => row.recovery.state))).toEqual(new Set(["SCHEDULED", "MANUAL_REQUIRED"]));
    expect(recoveryRows.every(row => row.financialStatus === "PENDING")).toBe(true);
  });

  test("paginates equal-time transactions across all routes without duplicates or omissions", async () => {
    for (const route of REQUIRED_ROUTES) {
      for (let index = 0; index < 3; index += 1) await pending(route.id);
    }
    const stored = await h!.snapshot();
    const persisted = stored.transactions;
    expect(new Set(persisted.map(row => row.createdAtMs)).size).toBe(1);

    const walk = async () => {
      const ids: string[] = [];
      const cursors = new Set<string>();
      let cursor: string | undefined;
      for (let pageNumber = 0; pageNumber <= persisted.length; pageNumber += 1) {
        const query = { limit: 2, ...(cursor ? { cursor } : {}) };
        const page = await h!.support.list("support", query);
        expect(await h!.support.list("support", query)).toEqual(page);
        expect(page.rows.length).toBeGreaterThan(0);
        expect(page.rows.length).toBeLessThanOrEqual(2);
        for (const row of page.rows) {
          expectView(row, record(stored, row.id));
          expect(ids).not.toContain(row.id);
          ids.push(row.id);
        }
        if (page.nextCursor === null) return ids;
        expect(page.nextCursor).toBeTruthy();
        expect(cursors.has(page.nextCursor)).toBe(false);
        cursors.add(page.nextCursor);
        cursor = page.nextCursor;
      }
      throw new Error("Support pagination did not terminate");
    };

    const first = await walk();
    expect([...first].sort()).toEqual(persisted.map(row => row.id).sort());
    expect(await walk()).toEqual(first);
  });

  describe.each(REQUIRED_ROUTES)("$id", route => {
    test("searches exact Catlog and external identifiers, including execution and bridge message IDs", async () => {
      const target = await completed(route.id);
      await completed(route.id);
      const transaction = record(await h!.snapshot(), target.id);
      expect(transaction.externalIds.providerExecutionId).toBeTruthy();
      if (route.provider === "CCTP") expect(transaction.externalIds.bridgeMessageId).toBeTruthy();
      const identifiers = [transaction.id, ...Object.values(transaction.externalIds).filter((value): value is string => value !== null)];

      for (const identifier of identifiers) {
        const results = await h!.support.list("support", { search: identifier, limit: 100 });
        expect(results.rows).toHaveLength(1);
        expect(results.nextCursor).toBeNull();
        expectView(results.rows[0], transaction);
        expectView(await h!.support.detail("support", results.rows[0].id), transaction);
      }

    });

    test("denies anonymous and merchant access to support list, detail and retry without side effects", async () => {
      const own = await lostResponse(route.id);
      const other = await lostResponse(route.id, h!.fixture.otherMerchantId);
      const before = await h!.snapshot();
      const remoteBefore = await h!.provider.snapshot();
      for (const actor of ["anonymous", "merchant"] as const) {
        const code = actor === "anonymous" ? "UNAUTHENTICATED" : "FORBIDDEN";
        await expect(h!.support.list(actor)).rejects.toMatchObject({ code });
        for (const transaction of [own, other]) {
          await expect(h!.support.detail(actor, transaction.id)).rejects.toMatchObject({ code });
          await expect(h!.support.retry(actor, transaction.id)).rejects.toMatchObject({ code });
        }
      }
      expect(await h!.snapshot()).toEqual(before);
      expect(await h!.provider.snapshot()).toEqual(remoteBefore);
    });

    test("deduplicates concurrent support retries and reconciles the original transfer key", async () => {
      const transaction = await lostResponse(route.id);
      const receipt = settlement(transaction.value, transaction.ids);
      await h!.provider.observe(key(transaction.value), { status: "COMPLETED", settlement: receipt });
      expectView(await h!.support.detail("support", transaction.id), record(await h!.snapshot(), transaction.id));

      await Promise.all(Array.from({ length: 8 }, () => h!.support.retry("support", transaction.id)));
      const queued = await h!.snapshot();
      const activeReconciliation = queued.jobs.filter(job => job.transactionId === transaction.id &&
        job.kind === "RECONCILE" && ["READY", "WAITING", "LEASED"].includes(job.state));
      expect(activeReconciliation).toHaveLength(1);
      await h!.workers.runDue({ concurrency: 8 });
      await assertSettledOnce(h!, transaction.id, receipt);
      expect(await h!.createTransfer(transaction.value)).toEqual({ id: transaction.id });

      const state = await h!.snapshot();
      expect(state.transactions).toHaveLength(1);
      expect(record(state, transaction.id).idempotencyKey).toBe(transaction.value.idempotencyKey);
      const remote = await h!.provider.snapshot();
      expect(remote.calls.filter(call => call.operation === "SUBMIT")).toHaveLength(1);
      expect(remote.calls.some(call => call.operation === "LOOKUP")).toBe(true);
      for (const call of remote.calls) expect(call.key).toEqual(key(transaction.value));
      const detail = await h!.support.detail("support", transaction.id);
      expectView(detail, record(state, transaction.id));
      expect(detail.state).toBe("COMPLETED");
      expect((await h!.support.list("support", { state: "RECOVERABLE" })).rows).toHaveLength(0);
    });

    test("rejects support retry for completed and financially failed transactions", async () => {
      const complete = await completed(route.id);
      const rejected = await failed(route.id);
      const before = await h!.snapshot();
      const remoteBefore = await h!.provider.snapshot();
      for (const transaction of [complete, rejected]) {
        await expect(h!.support.retry("support", transaction.id)).rejects.toMatchObject({ code: "NOT_RECOVERABLE" });
      }
      expect(await h!.snapshot()).toEqual(before);
      expect(await h!.provider.snapshot()).toEqual(remoteBefore);
    });
  });
});
