const fields = (value, names) => Object.fromEntries(names.map(name => [name, value[name] ?? null]));
const externalIds = value => fields(value ?? {}, [
  "sourceTransactionId", "providerExecutionId", "bridgeMessageId",
  "destinationTransactionId", "destinationEventId",
]);

// Persist financial evidence only; never serialize the session or raw API replies.
export function reconciliationEvidence({ sessionId, testName, routes, state, provider, balances }) {
  return {
    schemaVersion: 1,
    testFile: "tests/operations/reconciliation.test.ts",
    testName,
    sessionId,
    providerMode: "controlled",
    onchainTransfers: false,
    routes: routes.map(route => fields(route, [
      "id", "provider", "sourceNetwork", "destinationNetwork", "sourceAsset", "destinationAsset",
    ])),
    transactions: state.transactions.map(transaction => ({
      ...fields(transaction, [
        "id", "merchantId", "idempotencyKey", "routeId", "sourceAsset", "destinationAsset",
        "recipient", "amountAtomic", "feeAtomic", "creditedAtomic", "status",
      ]),
      externalIds: externalIds(transaction.externalIds),
    })),
    credits: state.credits.map(credit => fields(credit, [
      "id", "transactionId", "merchantId", "asset", "amountAtomic",
    ])),
    transfers: provider.transfers.map(transfer => ({
      key: fields(transfer.key, ["merchantId", "routeId", "idempotencyKey"]),
      sourceTransfers: transfer.sourceTransfers,
      destinationTransfers: transfer.destinationTransfers,
    })),
    balances: balances.map(balance => fields(balance, ["merchantId", "asset", "amountAtomic"])),
  };
}
