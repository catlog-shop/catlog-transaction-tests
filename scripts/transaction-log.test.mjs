import assert from "node:assert/strict";
import test from "node:test";
import { TransactionLog } from "../base-tests/transaction-log.ts";

const created = () => ({
  id: "base-tx-example", routeId: "cctp.arc-to-stellar", scenario: "retry", asset: "USDC",
  merchantId: "base-merchant-SENSITIVE-MERCHANT", idempotencyKey: "SENSITIVE-KEY",
  amountAtomic: "100000000", feeAtomic: "1000000", ttlMs: 60000, failuresBeforeSuccess: 1,
  status: "PENDING", attempts: 0, maxAttempts: 3, recovery: "NONE",
  createdAtMs: 1000, expiresAtMs: 61000, nextAttemptAtMs: 1000, lastErrorCode: null,
  history: [{ status: "PENDING", atMs: 1000, reason: "BASE_CREATED" }],
  externalIds: { sourceTransactionId: null, destinationTransactionId: null, bridgeMessageId: null, providerExecutionId: "base-cctp-example" },
});
const retry = () => {
  const transaction = created();
  return { ...transaction, attempts: 1, recovery: "SCHEDULED", nextAttemptAtMs: 2000,
    lastErrorCode: "BASE_PROVIDER_UNAVAILABLE",
    history: [...transaction.history, { status: "PENDING", atMs: 1000, reason: "BASE_RETRY_SCHEDULED" }] };
};
const completed = () => {
  const transaction = retry();
  return { ...transaction, status: "COMPLETED", attempts: 2, recovery: "NONE", nextAttemptAtMs: null, lastErrorCode: null,
    history: [...transaction.history, { status: "COMPLETED", atMs: 2000, reason: "BASE_COMPLETED" }],
    externalIds: { sourceTransactionId: "base-source-example", destinationTransactionId: "base-destination-example",
      bridgeMessageId: "base-message-example", providerExecutionId: "base-cctp-example" } };
};
function capture() {
  const messages = [];
  return { messages, log: new TransactionLog(message => messages.push(message)) };
}

test("prints observed retry progression and external IDs, suppressing repeated reads", () => {
  const { log, messages } = capture();
  log.observe(created(), { operation: "create" });
  log.observe(retry(), { operation: "process", processed: true });
  log.observe(retry(), { operation: "read" });
  log.observe(completed(), { operation: "process", processed: true });
  assert.equal(messages.length, 3);
  assert.match(messages[0], /status: \(created\) -> PENDING/);
  assert.match(messages[1], /BASE_RETRY_SCHEDULED/);
  assert.match(messages[1], /attempts=1\/3 retryAttempts=0 recovery=SCHEDULED/);
  assert.match(messages[1], /nextAttemptAtMs=2000/);
  assert.match(messages[2], /status: PENDING -> COMPLETED/);
  assert.match(messages[2], /attempts=2\/3 retryAttempts=1 recovery=NONE/);
  assert.match(messages[2], /"destinationTransactionId":"base-destination-example"/);
});

test("late responses cannot regress the printed status or attempts", () => {
  const { log, messages } = capture();
  log.observe(completed(), { operation: "event", duplicate: false, applied: true });
  log.observe(created(), { operation: "create" });
  log.observe(retry(), { operation: "read" });
  assert.equal(messages.length, 2);
  assert.match(messages[1], /ignored=older-snapshot/);
  assert.doesNotMatch(messages[1], /status:|attempts=/);
  log.observe(completed(), { operation: "read" });
  assert.equal(messages.length, 2);
});

test("duplicate events and skipped processing print outcomes without another transition", () => {
  const { log, messages } = capture();
  log.observe(completed(), { operation: "event", duplicate: false, applied: true });
  log.observe(completed(), { operation: "event", duplicate: true, applied: false });
  log.observe(completed(), { operation: "process", processed: false });
  assert.match(messages[1], /duplicate=true applied=false state=unchanged/);
  assert.match(messages[2], /processed=false state=unchanged/);
  assert.doesNotMatch(messages.slice(1).join("\n"), /status:|externalIds=/);
});

test("logs only allowed fields and clears observations between sessions", () => {
  const { log, messages } = capture();
  log.observe({ ...created(), token: "SENSITIVE-TOKEN", headers: { authorization: "SENSITIVE-AUTH" } }, { operation: "create" });
  assert.doesNotMatch(messages.join("\n"), /SENSITIVE|idempotencyKey|merchantId|authorization/);
  assert.match(messages[0], /^\[BASE\]/);
  log.clear();
  log.observe(created(), { operation: "create" });
  assert.match(messages[1], /status: \(created\) -> PENDING/);
});
