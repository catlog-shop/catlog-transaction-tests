import { environment } from "./environment.mjs";
import {
  routes,
  RECIPIENT,
  OTHER_RECIPIENT,
  STELLAR_ASSET,
} from "./fixtures.mjs";
import { json, transferKey } from "./wire.mjs";
const atomic = (value) => BigInt(value);
const wire = (value) => JSON.parse(json(value));
const operation = (t) => ({
  id: t.id,
  merchantId: t.merchantId,
  idempotencyKey: t.idempotencyKey,
  routeId: t.routeId,
  sourceAsset: t.sourceAsset,
  destinationAsset: t.destinationAsset,
  recipient: t.recipient,
  amountAtomic: atomic(t.amountAtomic),
  status: t.status,
  externalIds: t.externalIds,
  recovery: t.recovery,
  createdAtMs: t.createdAtMs,
});
export async function createOperationsHarness() {
  const e = await environment();
  const actorToken = (actor) =>
    actor === "support"
      ? e.supportToken
      : actor === "merchant"
        ? e.merchant.token
        : "";
  return {
    fixture: {
      merchantId: e.merchant.id,
      otherMerchantId: e.otherMerchant.id,
      routes: structuredClone(routes),
    },
    createTransfer: (value) =>
      e.call("/v1/transfers", "POST", value, e.tokenFor(value.merchantId)),
    async snapshot() {
      const state = await e.snapshot();
      return {
        transactions: state.transactions.map(operation),
        jobs: state.jobs.map(({ leaseToken: _token, ...job }) => ({
          ...job,
          routeId: job.routeId,
        })),
        settlements: state.credits.map((c) => ({
          transactionId: c.transactionId,
          merchantId: c.merchantId,
          ledgerReference: c.id,
          asset: c.asset,
          netAtomic: atomic(c.amountAtomic),
        })),
      };
    },
    clock: {
      async nowMs() {
        return e.clock.nowMs();
      },
      async advanceTo(time) {
        await e.clock.advanceTo(time);
      },
    },
    workers: {
      runDue: (options) => e.pool.runDue(options),
      restart: () => e.pool.restart(),
      claimAndCrash: () => e.pool.claimAndCrash(),
    },
    reconciliation: {
      async scan() {
        await e.scan();
      },
      async enqueue(id) {
        await e.enqueue(id);
      },
    },
    provider: {
      async plan(key, steps) {
        await e.provider.plan(key, steps);
      },
      async failLookups(key, count, code) {
        await e.provider.failLookups(key, count, code);
      },
      async observe(key, result) {
        await e.provider.observe(key, wire(result));
      },
      async readyToResume(key, s) {
        await e.provider.readyToResume(key, wire(s));
      },
      deliver: (key, result) => e.provider.deliver(key, wire(result)),
      async snapshot() {
        const snapshot = await await e.provider.snapshot();
        return {
          calls: snapshot.calls.map((c) => ({
            ...c,
            key: {
              ...c.key,
              routeId: c.key.routeId,
            },
          })),
          transfers: snapshot.transfers.map((t) => ({
            ...t,
            key: {
              ...t.key,
              routeId: t.key.routeId,
            },
          })),
        };
      },
    },
    support: {
      list: (actor, query = {}) => {
        const params = new URLSearchParams(
          Object.entries(query)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)]),
        );
        return e.call(
          `/v1/support/transactions?${params}`,
          "GET",
          undefined,
          actorToken(actor),
        );
      },
      detail: (actor, id) =>
        e.call(
          `/v1/support/transactions/${encodeURIComponent(id)}`,
          "GET",
          undefined,
          actorToken(actor),
        ),
      async retry(actor, id) {
        await e.call(
          `/v1/support/transactions/${encodeURIComponent(id)}/retry`,
          "POST",
          {},
          actorToken(actor),
        );
      },
    },
    close: () => e.close(),
  };
}
export async function createHarness() {
  const e = await environment();
  return {
    fixture: {
      merchantId: e.merchant.id,
      otherMerchantId: e.otherMerchant.id,
      asset: STELLAR_ASSET,
      otherAsset: `OTHER:${OTHER_RECIPIENT}`,
      recipient: RECIPIENT,
      otherRecipient: OTHER_RECIPIENT,
    },
    createDeposit: (value) =>
      e.call("/v1/deposits", "POST", value, e.tokenFor(value.merchantId)),
    drain: () => e.pool.runDue(),
    async snapshot() {
      const state = await e.snapshot();
      return {
        transactions: state.transactions.map((t) => ({
          id: t.id,
          merchantId: t.merchantId,
          idempotencyKey: t.idempotencyKey,
          network: "testnet",
          asset: t.destinationAsset,
          recipient: t.recipient,
          amountAtomic: atomic(t.amountAtomic),
          status: t.status,
          history: state.history[t.id],
          executionId: t.externalIds.providerExecutionId,
          stellarHash: t.externalIds.destinationTransactionId,
          operationOrEventId: t.externalIds.destinationEventId,
          feeAtomic: t.feeAtomic === null ? null : atomic(t.feeAtomic),
          creditedAtomic:
            t.creditedAtomic === null ? null : atomic(t.creditedAtomic),
        })),
        credits: state.credits.map((c) => ({
          ...c,
          amountAtomic: atomic(c.amountAtomic),
        })),
        balances: {
          [e.merchant.id]: await e.balance(e.merchant.id, STELLAR_ASSET),
          [e.otherMerchant.id]: await e.balance(
            e.otherMerchant.id,
            STELLAR_ASSET,
          ),
        },
        effectiveProviderTransfers: (
          await e.provider.snapshot()
        ).transfers.reduce((sum, t) => sum + t.sourceTransfers, 0),
      };
    },
    async setDepositsEnabled(enabled) {
      await e.call("/v1/admin/deposits-enabled", "POST", { enabled });
    },
    async reconcile(id) {
      await e.enqueue(id);
    },
    provider: {
      async emit(id, outcome) {
        const t = (await e.snapshot()).transactions.find((t) => t.id === id),
          key = transferKey(t),
          ids = await e.provider.remoteIds(key);
        const observation =
          outcome.status === "COMPLETED"
            ? {
                status: "COMPLETED",
                settlement: {
                  eventId: outcome.settlement.eventId,
                  routeId: t.routeId,
                  recipient: outcome.settlement.recipient,
                  asset: outcome.settlement.asset,
                  grossAtomic: String(outcome.settlement.grossAtomic),
                  feeAtomic: String(outcome.settlement.feeAtomic),
                  netAtomic: String(outcome.settlement.netAtomic),
                  externalIds: {
                    ...ids,
                    providerExecutionId: outcome.settlement.executionId,
                    destinationTransactionId: outcome.settlement.stellarHash,
                    destinationEventId: outcome.settlement.operationOrEventId,
                  },
                },
              }
            : outcome.status === "FAILED"
              ? { status: "FAILED", externalIds: ids, code: outcome.reason }
              : { status: "PENDING", externalIds: ids };
        await e.provider.deliver(key, observation);
      },
      async loseNextSubmissionResponse(executionId) {
        await e.provider.loseNextSubmissionResponse(executionId);
      },
    },
    close: () => e.close(),
  };
}
