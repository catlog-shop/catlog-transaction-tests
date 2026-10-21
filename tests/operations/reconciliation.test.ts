import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createOperationsHarness } from "./catlog.integration";
import {
  accepted, assertFixture, assertSettledOnce, externalIds, key, record,
  request, scan, settlement,
} from "./fixtures";
import {
  REQUIRED_ROUTES, TEST_POLICY,
  type OperationsHarness, type TransferRequest,
} from "./harness";

describe("Catlog shared transaction layer reconciliation", () => {
  let harness: OperationsHarness | undefined;
  const current = () => {
    if (!harness) throw new Error("Operations fixture is not initialized");
    return harness;
  };

  beforeEach(async () => {
    harness = await createOperationsHarness();
    await assertFixture(harness);
  });

  afterEach(async () => {
    const fixture = harness;
    harness = undefined;
    await fixture?.close();
  });

  async function assertOneSourceTransfer(value: TransferRequest): Promise<void> {
    const snapshot = await current().provider.snapshot();
    const matches = (item: { key: { merchantId: string; routeId: string; idempotencyKey: string } }) =>
      item.key.merchantId === value.merchantId && item.key.routeId === value.routeId &&
      item.key.idempotencyKey === value.idempotencyKey;
    const remote = snapshot.transfers.filter(matches);
    expect(remote).toHaveLength(1);
    expect(remote[0].sourceTransfers).toBe(1);
    expect(remote[0].destinationTransfers).toBeLessThanOrEqual(1);
    const submissions = snapshot.calls.filter(call => matches(call) && call.operation === "SUBMIT");
    expect(submissions.length).toBeGreaterThan(0);
    const identities = submissions.map(call => call.operation === "SUBMIT" ? call.submissionIdentity : "");
    expect(identities.every(identity => identity.length > 0)).toBe(true);
    expect(new Set(identities).size).toBe(1);
  }

  async function assertLookupSince(value: TransferRequest, callOffset: number): Promise<void> {
    const calls = (await current().provider.snapshot()).calls.slice(callOffset);
    expect(calls).toContainEqual({ operation: "LOOKUP", key: key(value) });
  }

  describe.each(REQUIRED_ROUTES)("$id", route => {
    test("recovers an accepted transfer after a lost response and worker restart without another source transfer", async () => {
      const h = current();
      const value = request(h, route.id);
      const ids = externalIds(route.id);
      await h.provider.plan(key(value), [{ result: "ACCEPTED_RESPONSE_LOST", externalIds: ids }]);
      const transaction = await h.createTransfer(value);
      await h.workers.runDue();

      const beforeRestart = await h.snapshot();
      expect(record(beforeRestart, transaction.id)).toMatchObject({ ...value, status: "PENDING" });
      expect(beforeRestart.settlements).toHaveLength(0);
      await assertOneSourceTransfer(value);

      await h.workers.restart();
      expect((await h.createTransfer(value)).id).toBe(transaction.id);
      expect((await h.snapshot()).transactions).toHaveLength(1);
      const callOffset = (await h.provider.snapshot()).calls.length;
      const receipt = settlement(value, ids);
      await h.provider.observe(key(value), { status: "COMPLETED", settlement: receipt });
      await scan(h);

      await assertLookupSince(value, callOffset);
      await assertOneSourceTransfer(value);
      await assertSettledOnce(h, transaction.id, receipt);
      expect(record(await h.snapshot(), transaction.id).externalIds).toMatchObject({
        sourceTransactionId: ids.sourceTransactionId,
        providerExecutionId: ids.providerExecutionId,
        bridgeMessageId: ids.bridgeMessageId,
      });
    });

    test("finds a completed transfer whose webhook was missed using only the global scanner", async () => {
      const h = current();
      const value = request(h, route.id);
      const transaction = await accepted(h, value);
      const receipt = settlement(value, transaction.ids);
      const callOffset = (await h.provider.snapshot()).calls.length;

      // Only the simulated remote state changes. Catlog receives no webhook.
      await h.provider.observe(key(value), { status: "COMPLETED", settlement: receipt });
      const beforeScan = await h.snapshot();
      expect(record(beforeScan, transaction.id).status).toBe("PENDING");
      expect(beforeScan.settlements).toHaveLength(0);
      await scan(h);

      await assertLookupSince(value, callOffset);
      await assertSettledOnce(h, transaction.id, receipt);
    });

    test("keeps an accepted source transfer pending until the destination completes without submitting another source transfer", async () => {
      const h = current();
      const value = request(h, route.id);
      const transaction = await accepted(h, value);
      await h.provider.observe(key(value), { status: "PENDING", externalIds: transaction.ids });
      const callOffset = (await h.provider.snapshot()).calls.length;

      await scan(h);
      await scan(h);
      const pending = await h.snapshot();
      expect(record(pending, transaction.id)).toMatchObject({
        status: "PENDING", externalIds: transaction.ids,
      });
      expect(pending.settlements).toHaveLength(0);
      await assertLookupSince(value, callOffset);
      await assertOneSourceTransfer(value);
      expect((await h.provider.snapshot()).calls.slice(callOffset)
        .filter(call => call.operation === "RESUME")).toHaveLength(0);

      const receipt = settlement(value, transaction.ids);
      const resumeOffset = (await h.provider.snapshot()).calls.length;
      if (route.provider === "CCTP") {
        // The simulator only completes this transfer after Catlog actually
        // submits the destination execution; a LOOKUP alone cannot complete it.
        await h.provider.readyToResume(key(value), receipt);
        expect((await h.provider.snapshot()).transfers.find(item =>
          item.key.idempotencyKey === value.idempotencyKey)?.destinationTransfers).toBe(0);
      } else {
        // NEAR owns execution; Catlog reconciles the provider's completion.
        await h.provider.observe(key(value), { status: "COMPLETED", settlement: receipt });
      }
      await scan(h);
      if (route.provider === "CCTP") {
        const resumes = (await h.provider.snapshot()).calls.slice(resumeOffset)
          .filter(call => call.operation === "RESUME");
        expect(resumes).toHaveLength(1);
        expect(resumes[0]).toMatchObject({ operation: "RESUME", key: key(value), submissionIdentity: expect.any(String) });
        if (resumes[0].operation === "RESUME") expect(resumes[0].submissionIdentity).toBeTruthy();
      }
      await assertOneSourceTransfer(value);
      await assertSettledOnce(h, transaction.id, receipt);
    });

    test("commits one settlement when duplicate completion webhooks race a reconciliation worker", async () => {
      const h = current();
      const value = request(h, route.id);
      const transaction = await accepted(h, value);
      const receipt = settlement(value, transaction.ids);
      const completion = { status: "COMPLETED" as const, settlement: receipt };
      await h.provider.observe(key(value), completion);
      await h.clock.advanceTo((await h.clock.nowMs()) + TEST_POLICY.reconcileIntervalMs);
      await h.reconciliation.scan();

      await Promise.all([
        h.workers.runDue({ concurrency: 3 }),
        h.provider.deliver(key(value), completion),
        h.provider.deliver(key(value), completion),
      ]);
      await h.workers.runDue();

      await assertSettledOnce(h, transaction.id, receipt);
      expect((await h.snapshot()).transactions).toHaveLength(1);
    });

    test("does not regress a confirmed terminal failure when a later lookup reports pending", async () => {
      const h = current();
      const value = request(h, route.id);
      const transaction = await accepted(h, value);
      await h.provider.observe(key(value), {
        status: "FAILED", externalIds: transaction.ids, code: "CONFIRMED_TERMINAL_FAILURE",
      });
      await scan(h);
      const failed = await h.snapshot();
      expect(record(failed, transaction.id)).toMatchObject({
        status: "FAILED", externalIds: transaction.ids,
      });
      expect(failed.settlements).toHaveLength(0);

      await h.provider.observe(key(value), { status: "PENDING", externalIds: transaction.ids });
      await scan(h);

      const afterStaleObservation = await h.snapshot();
      expect(record(afterStaleObservation, transaction.id)).toMatchObject({
        status: "FAILED", externalIds: transaction.ids,
      });
      expect(afterStaleObservation.settlements).toHaveLength(0);
      await assertOneSourceTransfer(value);
    });

    test("preserves completed status, destination identifiers and the ledger settlement after a later pending observation", async () => {
      const h = current();
      const value = request(h, route.id);
      const transaction = await accepted(h, value);
      const receipt = settlement(value, transaction.ids);
      await h.provider.observe(key(value), { status: "COMPLETED", settlement: receipt });
      await scan(h);
      await assertSettledOnce(h, transaction.id, receipt);
      const committedLedger = (await h.snapshot()).settlements;

      // The stale response lacks destination identifiers. It must not erase
      // identifiers that were already saved with the completed settlement.
      await h.provider.observe(key(value), { status: "PENDING", externalIds: transaction.ids });
      await scan(h);

      await assertSettledOnce(h, transaction.id, receipt);
      expect((await h.snapshot()).settlements).toEqual(committedLedger);
    });
  });

  test("one global scanner pass discovers and settles missed completions across every required route", async () => {
    const h = current();
    const transfers = [];
    for (const route of REQUIRED_ROUTES) {
      const value = request(h, route.id);
      const transaction = await accepted(h, value);
      transfers.push({ value, transaction, receipt: settlement(value, transaction.ids) });
    }
    for (const transfer of transfers) {
      await h.provider.observe(key(transfer.value), {
        status: "COMPLETED", settlement: transfer.receipt,
      });
    }
    const beforeScan = await h.snapshot();
    expect(beforeScan.transactions).toHaveLength(REQUIRED_ROUTES.length);
    expect(beforeScan.transactions.every(transaction => transaction.status === "PENDING")).toBe(true);
    expect(beforeScan.settlements).toHaveLength(0);
    const callOffset = (await h.provider.snapshot()).calls.length;

    // Exactly one scanner entry point: no per-route dispatch or webhook delivery.
    await scan(h);

    for (const transfer of transfers) {
      await assertLookupSince(transfer.value, callOffset);
      await assertSettledOnce(h, transfer.transaction.id, transfer.receipt);
    }
    const completed = await h.snapshot();
    expect(completed.transactions).toHaveLength(REQUIRED_ROUTES.length);
    expect(completed.settlements).toHaveLength(REQUIRED_ROUTES.length);
    expect(new Set(completed.settlements.map(effect => effect.ledgerReference)).size)
      .toBe(REQUIRED_ROUTES.length);
  });
});
