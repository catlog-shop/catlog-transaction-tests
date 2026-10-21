import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createOperationsHarness } from "./catlog.integration";
import { assertFixture, externalIds, key, record, request } from "./fixtures";
import {
  REQUIRED_ROUTES, START_TIME_MS, TEST_POLICY,
  type OperationsHarness, type Snapshot, type TransferRequest,
} from "./harness";

describe.each(REQUIRED_ROUTES)("durable retry queue: $id", route => {
  let h: OperationsHarness | undefined;
  let input: TransferRequest;

  beforeEach(async () => {
    h = await createOperationsHarness();
    await assertFixture(h);
    input = request(h, route.id);
  });

  afterEach(async () => {
    const current = h;
    h = undefined;
    await current?.close();
  });

  function submitJob(state: Snapshot, transactionId: string) {
    const jobs = state.jobs.filter(job =>
      job.transactionId === transactionId && job.kind === "SUBMIT",
    );
    expect(jobs, "Keep one durable submission job across its retries").toHaveLength(1);
    expect(jobs[0].routeId).toBe(input.routeId);
    return jobs[0];
  }

  async function assertProviderEffects(submitCalls: number, sourceTransfers: number) {
    const remote = await h!.provider.snapshot();
    const calls = remote.calls.filter(call =>
      call.key.merchantId === input.merchantId && call.key.routeId === input.routeId &&
      call.key.idempotencyKey === input.idempotencyKey && call.operation === "SUBMIT",
    );
    expect(calls).toHaveLength(submitCalls);
    const effects = remote.transfers.filter(transfer =>
      transfer.key.merchantId === input.merchantId && transfer.key.routeId === input.routeId &&
      transfer.key.idempotencyKey === input.idempotencyKey,
    );
    expect(effects.reduce((sum, transfer) => sum + transfer.sourceTransfers, 0))
      .toBe(sourceTransfers);
    expect(effects.reduce((sum, transfer) => sum + transfer.destinationTransfers, 0))
      .toBe(0);
    if (sourceTransfers === 1) expect(effects).toHaveLength(1);
  }

  async function assertScheduled(id: string, attempts: number, dueAt: number, code: string) {
    const state = await h!.snapshot();
    expect(state.transactions).toHaveLength(1);
    expect(record(state, id)).toMatchObject({
      ...input, status: "PENDING",
      recovery: {
        state: "SCHEDULED", attempts, maxAttempts: TEST_POLICY.maxAttempts,
        nextAttemptAtMs: dueAt, lastErrorCode: code,
      },
    });
    expect(state.settlements).toHaveLength(0);
    const job = submitJob(state, id);
    expect(job).toMatchObject({
      state: "WAITING", attempts, nextAttemptAtMs: dueAt,
      leaseUntilMs: null, lastErrorCode: code,
    });
    return job;
  }

  async function assertAccepted(id: string) {
    const state = await h!.snapshot();
    expect(state.transactions).toHaveLength(1);
    expect(record(state, id)).toMatchObject({ ...input, status: "PENDING" });
    expect(state.settlements).toHaveLength(0);
    expect(submitJob(state, id)).toMatchObject({
      state: "SUCCEEDED", nextAttemptAtMs: null, leaseUntilMs: null,
    });
  }

  test("pre-acceptance failures persist bounded backoff and never run early", async () => {
    const ids = externalIds(route.id);
    await h!.provider.plan(key(input), [
      { result: "TRANSIENT_ERROR", code: "PROVIDER_UNAVAILABLE" },
      { result: "TRANSIENT_ERROR", code: "PROVIDER_UNAVAILABLE" },
      { result: "ACCEPTED", externalIds: ids },
    ]);
    const tx = await h!.createTransfer(input);
    await h!.workers.runDue();
    const firstDue = START_TIME_MS + TEST_POLICY.baseDelayMs;
    const firstJob = await assertScheduled(tx.id, 1, firstDue, "PROVIDER_UNAVAILABLE");
    await assertProviderEffects(1, 0);

    await h!.clock.advanceTo(firstDue - 1);
    await h!.workers.runDue();
    await assertProviderEffects(1, 0);
    expect((await assertScheduled(tx.id, 1, firstDue, "PROVIDER_UNAVAILABLE")).id)
      .toBe(firstJob.id);

    await h!.clock.advanceTo(firstDue);
    await h!.workers.runDue();
    const secondDelay = Math.min(TEST_POLICY.baseDelayMs * 2, TEST_POLICY.maxDelayMs);
    const secondDue = firstDue + secondDelay;
    expect((await assertScheduled(tx.id, 2, secondDue, "PROVIDER_UNAVAILABLE")).id)
      .toBe(firstJob.id);
    await assertProviderEffects(2, 0);

    await h!.clock.advanceTo(secondDue - 1);
    await h!.workers.runDue();
    await assertProviderEffects(2, 0);
    await h!.clock.advanceTo(secondDue);
    await h!.workers.runDue();
    await assertProviderEffects(3, 1);
    await assertAccepted(tx.id);
    expect(record(await h!.snapshot(), tx.id).externalIds).toEqual(ids);
  });

  test("three failed attempts exhaust the budget without failing or crediting the payment", async () => {
    await h!.provider.plan(key(input), [
      ...Array.from({ length: TEST_POLICY.maxAttempts }, () => ({
        result: "TRANSIENT_ERROR" as const, code: "PROVIDER_UNAVAILABLE",
      })),
      // A fourth attempt would create a detectable external effect.
      { result: "ACCEPTED", externalIds: externalIds(route.id) },
    ]);
    const tx = await h!.createTransfer(input);
    let dueAt = START_TIME_MS;
    for (let attempt = 1; attempt <= TEST_POLICY.maxAttempts; attempt += 1) {
      await h!.clock.advanceTo(dueAt);
      await h!.workers.runDue();
      await assertProviderEffects(attempt, 0);
      if (attempt < TEST_POLICY.maxAttempts) {
        dueAt += Math.min(
          TEST_POLICY.baseDelayMs * 2 ** (attempt - 1), TEST_POLICY.maxDelayMs,
        );
        await assertScheduled(tx.id, attempt, dueAt, "PROVIDER_UNAVAILABLE");
      }
    }

    const exhausted = await h!.snapshot();
    expect(record(exhausted, tx.id)).toMatchObject({
      status: "PENDING",
      recovery: {
        state: "MANUAL_REQUIRED", attempts: TEST_POLICY.maxAttempts,
        maxAttempts: TEST_POLICY.maxAttempts, nextAttemptAtMs: null,
        lastErrorCode: "PROVIDER_UNAVAILABLE",
      },
    });
    expect(submitJob(exhausted, tx.id)).toMatchObject({
      state: "DEAD", attempts: TEST_POLICY.maxAttempts,
      nextAttemptAtMs: null, leaseUntilMs: null,
    });
    expect(exhausted.settlements).toHaveLength(0);
    const remote = await h!.provider.snapshot();
    await h!.workers.runDue({ concurrency: 4 });
    await h!.clock.advanceTo(dueAt + TEST_POLICY.leaseMs + TEST_POLICY.maxDelayMs);
    await h!.workers.runDue({ concurrency: 4 });
    expect(await h!.provider.snapshot()).toEqual(remote);
    expect(await h!.snapshot()).toEqual(exhausted);
  });

  test("a scheduled retry survives worker restart and keeps the original request identity", async () => {
    const ids = externalIds(route.id);
    await h!.provider.plan(key(input), [
      { result: "TRANSIENT_ERROR", code: "RETRYABLE_CONNECTION_FAILURE" },
      { result: "ACCEPTED", externalIds: ids },
    ]);
    const tx = await h!.createTransfer(input);
    await h!.workers.runDue();
    const dueAt = START_TIME_MS + TEST_POLICY.baseDelayMs;
    const originalJob = await assertScheduled(tx.id, 1, dueAt, "RETRYABLE_CONNECTION_FAILURE");
    await h!.workers.restart();
    expect((await assertScheduled(tx.id, 1, dueAt, "RETRYABLE_CONNECTION_FAILURE")).id)
      .toBe(originalJob.id);
    expect(await h!.createTransfer(input)).toEqual(tx);
    await h!.workers.runDue();
    await assertProviderEffects(1, 0);

    await h!.clock.advanceTo(dueAt);
    await h!.workers.runDue();
    expect(await h!.createTransfer(input)).toEqual(tx);
    await h!.workers.runDue();
    await assertProviderEffects(2, 1);
    await assertAccepted(tx.id);
    const state = await h!.snapshot();
    expect(submitJob(state, tx.id).id).toBe(originalJob.id);
    expect(record(state, tx.id).externalIds).toEqual(ids);
  });

  test("concurrent workers submit a queued payment only once", async () => {
    const ids = externalIds(route.id);
    await h!.provider.plan(key(input), [
      { result: "ACCEPTED", externalIds: ids },
    ]);
    const tx = await h!.createTransfer(input);
    await h!.workers.runDue({ concurrency: 4 });
    await h!.workers.runDue({ concurrency: 4 });
    await assertProviderEffects(1, 1);
    await assertAccepted(tx.id);
    expect(record(await h!.snapshot(), tx.id).externalIds).toEqual(ids);
  });

  test("an abandoned durable lease blocks early work and is reclaimed exactly once", async () => {
    const ids = externalIds(route.id);
    await h!.provider.plan(key(input), [
      { result: "ACCEPTED", externalIds: ids },
    ]);
    const tx = await h!.createTransfer(input);
    const claimed = await h!.workers.claimAndCrash();
    const leased = submitJob(await h!.snapshot(), tx.id);
    const leaseUntil = START_TIME_MS + TEST_POLICY.leaseMs;
    expect(leased).toMatchObject({
      id: claimed.jobId, state: "LEASED", leaseUntilMs: leaseUntil,
    });
    await assertProviderEffects(0, 0);
    await h!.workers.restart();
    await h!.clock.advanceTo(leaseUntil - 1);
    await h!.workers.runDue({ concurrency: 4 });
    await assertProviderEffects(0, 0);
    expect(submitJob(await h!.snapshot(), tx.id)).toMatchObject({
      id: claimed.jobId, state: "LEASED", leaseUntilMs: leaseUntil,
    });

    await h!.clock.advanceTo(leaseUntil);
    await h!.workers.runDue({ concurrency: 4 });
    await h!.workers.runDue({ concurrency: 4 });
    await assertProviderEffects(1, 1);
    await assertAccepted(tx.id);
    const state = await h!.snapshot();
    expect(submitJob(state, tx.id).id).toBe(claimed.jobId);
    expect(record(state, tx.id).externalIds).toEqual(ids);
  });

  test("confirmed provider rejection is terminal and never retried automatically", async () => {
    await h!.provider.plan(key(input), [
      { result: "REJECTED", code: "CONFIRMED_PROVIDER_REJECTION" },
      // If the terminal rejection is incorrectly retried, this produces an effect.
      { result: "ACCEPTED", externalIds: externalIds(route.id) },
    ]);
    const tx = await h!.createTransfer(input);
    await h!.workers.runDue();
    const failed = await h!.snapshot();
    expect(record(failed, tx.id)).toMatchObject({
      status: "FAILED", recovery: { state: "NONE", nextAttemptAtMs: null },
    });
    expect(failed.settlements).toHaveLength(0);
    const job = submitJob(failed, tx.id);
    expect(["DEAD", "SUCCEEDED"]).toContain(job.state);
    expect(job).toMatchObject({ attempts: 1, nextAttemptAtMs: null, leaseUntilMs: null });
    await assertProviderEffects(1, 0);
    expect(await h!.createTransfer(input)).toEqual(tx);
    await h!.clock.advanceTo(START_TIME_MS + TEST_POLICY.leaseMs + TEST_POLICY.maxDelayMs);
    await h!.workers.runDue({ concurrency: 4 });
    await assertProviderEffects(1, 0);
    expect(await h!.snapshot()).toEqual(failed);
  });
});
