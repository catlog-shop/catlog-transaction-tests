import { randomUUID } from "node:crypto";
import { expect } from "vitest";
import {
  REQUIRED_ROUTES, START_TIME_MS, TEST_POLICY,
  type ExternalIds, type OperationsHarness, type RouteId, type Settlement,
  type Snapshot, type TransferKey, type TransferRequest,
} from "./harness";

export async function assertFixture(h: OperationsHarness): Promise<void> {
  expect(h.fixture.merchantId).toBeTruthy();
  expect(h.fixture.otherMerchantId).toBeTruthy();
  expect(h.fixture.merchantId).not.toBe(h.fixture.otherMerchantId);
  expect(new Set(h.fixture.routes.map(route => route.id)).size).toBe(h.fixture.routes.length);
  for (const required of REQUIRED_ROUTES) {
    const route = h.fixture.routes.find(item => item.id === required.id);
    expect(route, `Missing required route: ${required.id}`).toBeDefined();
    expect(route!.provider).toBe(required.provider);
    expect(route!.destinationNetwork).toBe(required.destinationNetwork);
    if (required.sourceNetwork) expect(route!.sourceNetwork).toBe(required.sourceNetwork);
    expect(route!.sourceNetwork).toBeTruthy();
    expect(route!.sourceNetwork).not.toBe(route!.destinationNetwork);
    expect(route!.sourceAsset).toBeTruthy();
    expect(route!.destinationAsset).toBeTruthy();
    expect(route!.recipient).toBeTruthy();
  }
  expect(await h.clock.nowMs()).toBe(START_TIME_MS);
  expect(await h.snapshot()).toEqual({ transactions: [], jobs: [], settlements: [] });
  expect(await h.provider.snapshot()).toEqual({ calls: [], transfers: [] });
}
export function request(h: OperationsHarness, routeId: RouteId, merchantId = h.fixture.merchantId): TransferRequest {
  const route = h.fixture.routes.find(item => item.id === routeId);
  if (!route) throw new Error(`Missing required route: ${routeId}`);
  return { merchantId, routeId, idempotencyKey: randomUUID(), sourceAsset: route.sourceAsset,
    destinationAsset: route.destinationAsset, recipient: route.recipient, amountAtomic: 100_000_000n };
}
export const key = (value: TransferRequest): TransferKey => ({ merchantId: value.merchantId, routeId: value.routeId, idempotencyKey: value.idempotencyKey });
export function externalIds(routeId: RouteId, completed = false): ExternalIds {
  const id = randomUUID().replaceAll("-", "");
  const hash = id.repeat(2);
  const destinationHash = randomUUID().replaceAll("-", "").repeat(2);
  // Opaque simulated provider identifiers. These fixtures do not make live transfers.
  return { sourceTransactionId: routeId === "cctp.arc-to-stellar" ? `0x${hash}` : hash, providerExecutionId: `${routeId.startsWith("near") ? "near-execution" : "cctp-execution"}-${id}`,
    bridgeMessageId: routeId.startsWith("cctp") ? `0x${randomUUID().replaceAll("-", "").repeat(2)}` : null,
    destinationTransactionId: completed ? (routeId === "cctp.stellar-to-arc" ? `0x${destinationHash}` : destinationHash) : null,
    destinationEventId: completed ? `event-${id}` : null };
}
export function settlement(value: TransferRequest, ids: ExternalIds): Settlement {
  return { eventId: randomUUID(), routeId: value.routeId, recipient: value.recipient,
    asset: value.destinationAsset, grossAtomic: value.amountAtomic, feeAtomic: 1_000_000n,
    netAtomic: value.amountAtomic - 1_000_000n,
    externalIds: { ...ids, destinationTransactionId: ids.destinationTransactionId ?? externalIds(value.routeId, true).destinationTransactionId,
      destinationEventId: ids.destinationEventId ?? `event-${randomUUID()}` } };
}
export function record(state: Snapshot, id: string) {
  const result = state.transactions.find(row => row.id === id);
  expect(result, `Missing persisted transaction ${id}`).toBeDefined();
  return result!;
}
export async function accepted(h: OperationsHarness, value: TransferRequest, ids = externalIds(value.routeId)) {
  await h.provider.plan(key(value), [{ result: "ACCEPTED", externalIds: ids }]);
  const tx = await h.createTransfer(value);
  await h.workers.runDue();
  expect(record(await h.snapshot(), tx.id)).toMatchObject({ ...value, status: "PENDING" });
  return { ...tx, ids };
}
export async function scan(h: OperationsHarness): Promise<void> {
  await h.clock.advanceTo((await h.clock.nowMs()) + TEST_POLICY.reconcileIntervalMs);
  await h.reconciliation.scan();
  await h.workers.runDue();
}
export async function assertSettledOnce(h: OperationsHarness, id: string, receipt: Settlement): Promise<void> {
  const state = await h.snapshot();
  expect(record(state, id)).toMatchObject({ routeId: receipt.routeId, recipient: receipt.recipient, destinationAsset: receipt.asset, status: "COMPLETED", externalIds: receipt.externalIds, recovery: { state: "NONE" } });
  const effects = state.settlements.filter(row => row.transactionId === id);
  expect(effects).toHaveLength(1);
  expect(effects[0]).toMatchObject({ merchantId: record(state, id).merchantId, asset: receipt.asset, netAtomic: receipt.netAtomic });
  expect(effects[0].ledgerReference).toBeTruthy();
  const tx = record(state, id);
  const remote = (await h.provider.snapshot()).transfers.filter(row => row.key.merchantId === tx.merchantId && row.key.routeId === tx.routeId && row.key.idempotencyKey === tx.idempotencyKey);
  expect(remote).toHaveLength(1);
  expect(remote[0]).toMatchObject({ sourceTransfers: 1, destinationTransfers: 1 });
}
