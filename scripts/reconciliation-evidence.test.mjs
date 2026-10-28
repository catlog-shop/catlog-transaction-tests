import { test } from "node:test";
import assert from "node:assert/strict";
import { reconciliationEvidence } from "../catlog/reconciliation-evidence.mjs";

test("financial evidence excludes credentials and raw response fields at every level", () => {
  const privateFields = { sessionToken: "PRIVATE_SECRET", adminToken: "PRIVATE_SECRET", privateKey: "PRIVATE_SECRET" };
  const evidence = reconciliationEvidence({
    ...privateFields,
    sessionId: "session-1", testName: "case-1",
    routes: [{ id: "route-1", ...privateFields }],
    state: {
      ...privateFields,
      transactions: [{ id: "transaction-1", externalIds: { sourceTransactionId: "source-1", ...privateFields }, ...privateFields }],
      credits: [{ id: "credit-1", ...privateFields }],
    },
    provider: { ...privateFields, transfers: [{ key: { routeId: "route-1", ...privateFields }, sourceTransfers: 1, destinationTransfers: 0, ...privateFields }] },
    balances: [{ asset: "USDC", ...privateFields }],
  });
  assert.equal(JSON.stringify(evidence).includes("PRIVATE_SECRET"), false);
  assert.equal(evidence.transactions[0].externalIds.sourceTransactionId, "source-1");
  assert.equal(evidence.providerMode, "controlled");
  assert.equal(evidence.onchainTransfers, false);
});

test("ledger evidence preserves exact atomic strings, credit references and missing settlement amounts", () => {
  const amount = "90071992547409931234567";
  const evidence = reconciliationEvidence({
    sessionId: "session-1", testName: "case-1", routes: [],
    state: {
      transactions: [{ id: "completed", amountAtomic: amount, feeAtomic: "1", creditedAtomic: "90071992547409931234566" }, { id: "failed", feeAtomic: null, creditedAtomic: null }],
      credits: [{ id: "credit-1", transactionId: "completed", merchantId: "merchant-1", asset: "USDC", amountAtomic: "90071992547409931234566" }],
    },
    provider: { transfers: [] },
    balances: [{ merchantId: "merchant-1", asset: "USDC", amountAtomic: "90071992547409931234566" }],
  });
  assert.equal(evidence.transactions[0].amountAtomic, amount);
  assert.equal(evidence.transactions[1].creditedAtomic, null);
  assert.equal(evidence.credits[0].id, "credit-1");
  assert.equal(evidence.credits[0].transactionId, evidence.transactions[0].id);
  assert.equal(evidence.balances[0].amountAtomic, evidence.credits[0].amountAtomic);
});
