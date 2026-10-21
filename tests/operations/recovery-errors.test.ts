import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createOperationsHarness } from "./catlog.integration";
import { accepted, assertFixture, assertSettledOnce, key, record, request, scan, settlement } from "./fixtures";
import { REQUIRED_ROUTES, TEST_POLICY, type OperationsHarness } from "./harness";

describe.each(REQUIRED_ROUTES)("reconciliation retry budget: $id", route => {
  let h: OperationsHarness | undefined;
  beforeEach(async () => {
    h = await createOperationsHarness();
    await assertFixture(h);
  });
  afterEach(async () => {
    const fixture = h;
    h = undefined;
    await fixture?.close();
  });

  test("lookup outages exhaust into recoverable state and support recovery keeps the original source transfer", async () => {
    const value = request(h!, route.id);
    const transaction = await accepted(h!, value);
    await h!.provider.failLookups(key(value), TEST_POLICY.maxAttempts, "LOOKUP_UNAVAILABLE");
    const offset = (await h!.provider.snapshot()).calls.length;
    await scan(h!);

    for (let attempt = 1; attempt < TEST_POLICY.maxAttempts; attempt += 1) {
      const state = await h!.snapshot();
      const pending = record(state, transaction.id);
      const delay = Math.min(TEST_POLICY.baseDelayMs * 2 ** (attempt - 1), TEST_POLICY.maxDelayMs);
      const due = (await h!.clock.nowMs()) + delay;
      expect(pending).toMatchObject({ status: "PENDING", externalIds: transaction.ids,
        recovery: { state: "SCHEDULED", attempts: attempt, nextAttemptAtMs: due, lastErrorCode: "LOOKUP_UNAVAILABLE" } });
      expect(state.settlements).toHaveLength(0);
      const beforeEarly = await h!.provider.snapshot();
      await h!.clock.advanceTo(due - 1);
      await h!.workers.runDue();
      expect(await h!.provider.snapshot()).toEqual(beforeEarly);
      await h!.clock.advanceTo(due);
      await h!.workers.runDue();
    }

    const exhausted = await h!.snapshot();
    expect(record(exhausted, transaction.id)).toMatchObject({ status: "PENDING", externalIds: transaction.ids,
      recovery: { state: "MANUAL_REQUIRED", attempts: TEST_POLICY.maxAttempts, nextAttemptAtMs: null, lastErrorCode: "LOOKUP_UNAVAILABLE" } });
    expect(exhausted.settlements).toHaveLength(0);
    expect(exhausted.jobs.filter(job => job.transactionId === transaction.id && job.kind === "RECONCILE"))
      .toEqual([expect.objectContaining({ state: "DEAD", attempts: TEST_POLICY.maxAttempts })]);
    expect((await h!.provider.snapshot()).calls.slice(offset).filter(call => call.operation === "LOOKUP"))
      .toHaveLength(TEST_POLICY.maxAttempts);
    const beforeScan = await h!.provider.snapshot();
    await scan(h!);
    expect(await h!.provider.snapshot()).toEqual(beforeScan);
    expect(await h!.support.detail("support", transaction.id)).toMatchObject({
      state: "RECOVERABLE", financialStatus: "PENDING", externalIds: transaction.ids,
    });

    const receipt = settlement(value, transaction.ids);
    await h!.provider.observe(key(value), { status: "COMPLETED", settlement: receipt });
    await h!.support.retry("support", transaction.id);
    await h!.workers.runDue();
    await assertSettledOnce(h!, transaction.id, receipt);
    const remote = await h!.provider.snapshot();
    expect(remote.calls.filter(call => call.operation === "SUBMIT")).toHaveLength(1);
    expect(remote.calls.filter(call => call.operation === "LOOKUP").length).toBeGreaterThan(TEST_POLICY.maxAttempts);
  });
});
