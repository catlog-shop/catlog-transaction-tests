import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { createHarness } from "./catlog.integration";
import type { CatlogHarness, DepositRequest, Settlement, Snapshot } from "./harness";

describe("Catlog shared transaction layer", () => {
  let h: CatlogHarness | undefined;
  let baseline: Snapshot;
  let request: DepositRequest;

  beforeEach(async () => {
    h = await createHarness();
    baseline = await h.snapshot();
    expect(baseline.transactions).toHaveLength(0);
    expect(baseline.credits).toHaveLength(0);
    expect(baseline.effectiveProviderTransfers).toBe(0);
    expect(typeof baseline.balances[h.fixture.merchantId]).toBe("bigint");
    expect(typeof baseline.balances[h.fixture.otherMerchantId]).toBe("bigint");
    request = {
      merchantId: h.fixture.merchantId,
      idempotencyKey: randomUUID(),
      network: "testnet",
      asset: h.fixture.asset,
      recipient: h.fixture.recipient,
      amountAtomic: 100_000_000n,
    };
  });

  afterEach(async () => {
    const current = h;
    h = undefined;
    await current?.close();
  });

  function settlement(): Settlement {
    return {
      eventId: randomUUID(),
      executionId: `simulated-${randomUUID()}`,
      // Test-only transaction hash. No real Stellar transfer is made.
      stellarHash: "a".repeat(64),
      operationOrEventId: "simulated-operation-0",
      network: "testnet",
      recipient: request.recipient,
      asset: request.asset,
      grossAtomic: request.amountAtomic,
      feeAtomic: 1_000_000n,
      netAtomic: 99_000_000n,
    };
  }

  async function pending() {
    const tx = await h!.createDeposit(request);
    await h!.drain();
    const state = await h!.snapshot();
    expect(state.transactions.find(row => row.id === tx.id)?.status).toBe("PENDING");
    return tx;
  }

  async function complete(id: string, receipt = settlement()) {
    await h!.provider.emit(id, { status: "COMPLETED", settlement: receipt });
    await h!.drain();
    return receipt;
  }

  async function assertOneCredit(id: string, receipt: Settlement) {
    const state = await h!.snapshot();
    expect(state.transactions).toHaveLength(1);
    expect(state.credits).toHaveLength(1);
    expect(state.credits[0]).toMatchObject({
      transactionId: id,
      merchantId: request.merchantId,
      asset: request.asset,
      amountAtomic: receipt.netAtomic,
    });
    expect(state.balances[request.merchantId]).toBe(
      baseline.balances[request.merchantId] + receipt.netAtomic,
    );
    expect(state.balances[h!.fixture.otherMerchantId]).toBe(
      baseline.balances[h!.fixture.otherMerchantId],
    );
    expect(state.effectiveProviderTransfers).toBe(1);
    return state;
  }

  test("same key reuses the transaction before and after settlement", async () => {
    const first = await pending();
    expect(await h!.createDeposit(request)).toEqual(first);
    const receipt = await complete(first.id);
    expect(await h!.createDeposit(request)).toEqual(first);
    await h!.drain();
    await assertOneCredit(first.id, receipt);
  });

  test("10 simultaneous requests create one effective payment and credit", async () => {
    const responses = await Promise.all(
      Array.from({ length: 10 }, () => h!.createDeposit(request)),
    );
    expect(new Set(responses.map(tx => tx.id)).size).toBe(1);
    await h!.drain();
    const id = responses[0].id;
    const receipt = await complete(id);
    await assertOneCredit(id, receipt);
  });

  test.each(["amount", "recipient", "asset"] as const)(
    "same key with changed %s is rejected without side effects",
    async field => {
      await pending();
      const before = await h!.snapshot();
      const changed = { ...request };
      if (field === "amount") changed.amountAtomic += 1n;
      if (field === "recipient") changed.recipient = h!.fixture.otherRecipient;
      if (field === "asset") changed.asset = h!.fixture.otherAsset;
      await expect(h!.createDeposit(changed)).rejects.toMatchObject({
        code: "IDEMPOTENCY_CONFLICT",
      });
      await h!.drain();
      expect(await h!.snapshot()).toEqual(before);
    },
  );

  test("the same key under another merchant does not reuse private records", async () => {
    const first = await pending();
    const second = await h!.createDeposit({
      ...request,
      merchantId: h!.fixture.otherMerchantId,
    });
    await h!.drain();
    expect(second.id).not.toBe(first.id);
    const state = await h!.snapshot();
    expect(state.transactions).toHaveLength(2);
    expect(state.transactions.find(tx => tx.id === second.id)?.merchantId)
      .toBe(h!.fixture.otherMerchantId);
    expect(state.credits).toHaveLength(0);
    expect(state.balances).toEqual(baseline.balances);
    expect(state.effectiveProviderTransfers).toBe(2);
  });

  test("pending payments do not credit the merchant", async () => {
    await pending();
    const state = await h!.snapshot();
    expect(state.credits).toHaveLength(0);
    expect(state.balances).toEqual(baseline.balances);
  });

  test("success persists status history, Stellar mapping and exact net credit", async () => {
    const tx = await pending();
    const receipt = await complete(tx.id);
    const state = await assertOneCredit(tx.id, receipt);
    expect(state.transactions[0]).toMatchObject({
      ...request,
      id: tx.id,
      status: "COMPLETED",
      history: ["PENDING", "COMPLETED"],
      executionId: receipt.executionId,
      stellarHash: receipt.stellarHash,
      operationOrEventId: receipt.operationOrEventId,
      feeAtomic: receipt.feeAtomic,
      creditedAtomic: receipt.netAtomic,
    });
    expect(receipt.netAtomic + receipt.feeAtomic).toBe(receipt.grossAtomic);
  });

  test("confirmed failure records the failure transition without a credit", async () => {
    const tx = await pending();
    await h!.provider.emit(tx.id, {
      status: "FAILED", eventId: randomUUID(), reason: "confirmed-provider-failure",
    });
    await h!.drain();
    const state = await h!.snapshot();
    expect(state.transactions).toHaveLength(1);
    expect(state.transactions[0]).toMatchObject({
      id: tx.id, status: "FAILED", history: ["PENDING", "FAILED"],
    });
    expect(state.credits).toHaveLength(0);
    expect(state.balances).toEqual(baseline.balances);
  });

  test("simultaneous and later copies of completion do not credit twice", async () => {
    const tx = await pending();
    const receipt = settlement();
    await Promise.all(Array.from({ length: 5 }, () =>
      h!.provider.emit(tx.id, { status: "COMPLETED", settlement: receipt }),
    ));
    await h!.drain();
    const before = await assertOneCredit(tx.id, receipt);
    await complete(tx.id, receipt);
    expect(await h!.snapshot()).toEqual(before);
  });

  test.each(["PENDING", "FAILED"] as const)(
    "late %s update cannot regress a completed transaction",
    async status => {
      const tx = await pending();
      const receipt = await complete(tx.id);
      const before = await assertOneCredit(tx.id, receipt);
      const eventId = randomUUID();
      await h!.provider.emit(tx.id, status === "PENDING"
        ? { status, eventId }
        : { status, eventId, reason: "stale-provider-update" });
      await h!.drain();
      expect(await h!.snapshot()).toEqual(before);
    },
  );

  test("the same settlement with a new event ID does not credit twice", async () => {
    const tx = await pending();
    const receipt = await complete(tx.id);
    const before = await assertOneCredit(tx.id, receipt);
    await complete(tx.id, { ...receipt, eventId: randomUUID() });
    expect(await h!.snapshot()).toEqual(before);
  });

  test.each(["PENDING", "COMPLETED"] as const)(
    "confirmed terminal failure cannot change to %s",
    async status => {
      const tx = await pending();
      await h!.provider.emit(tx.id, {
        status: "FAILED", eventId: randomUUID(), reason: "confirmed-terminal-failure",
      });
      await h!.drain();
      const before = await h!.snapshot();
      expect(before.transactions[0]?.status).toBe("FAILED");
      expect(before.credits).toHaveLength(0);
      expect(before.balances).toEqual(baseline.balances);
      await h!.provider.emit(tx.id, status === "PENDING"
        ? { status, eventId: randomUUID() }
        : { status, settlement: settlement() });
      await h!.drain();
      expect(await h!.snapshot()).toEqual(before);
    },
  );

  test("lost submit response is recovered without a second effective payment", async () => {
    const receipt = settlement();
    await h!.provider.loseNextSubmissionResponse(receipt.executionId);
    const tx = await pending();
    const unknown = await h!.snapshot();
    expect(unknown.effectiveProviderTransfers).toBe(1);
    expect(unknown.credits).toHaveLength(0);
    expect(unknown.balances).toEqual(baseline.balances);
    expect(await h!.createDeposit(request)).toEqual(tx);
    await h!.reconcile(tx.id);
    await h!.drain();
    const recovered = await h!.snapshot();
    expect(recovered.transactions.find(row => row.id === tx.id)?.executionId)
      .toBe(receipt.executionId);
    expect(recovered.effectiveProviderTransfers).toBe(1);
    await complete(tx.id, receipt);
    const final = await assertOneCredit(tx.id, receipt);
    expect(final.transactions[0]).toMatchObject({
      executionId: receipt.executionId,
      stellarHash: receipt.stellarHash,
    });
  });

  test("disabled deposit API creates no transaction, transfer or credit", async () => {
    await h!.setDepositsEnabled(false);
    await expect(h!.createDeposit(request)).rejects.toMatchObject({
      code: "FEATURE_DISABLED",
    });
    await h!.drain();
    expect(await h!.snapshot()).toEqual(baseline);
  });
});
