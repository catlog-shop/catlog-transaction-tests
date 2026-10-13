# Catlog Shared Transaction Layer Tests

TypeScript tests for Catlog's shared transaction layer, built with Vitest.

## What's tested

- Idempotency for repeated and concurrent deposit requests.
- Conflicts when an idempotency key is reused with different payment details.
- Transaction status transitions and handling of stale provider updates.
- Merchant isolation, ledger credits, balances and Stellar transaction references.
- Duplicate settlement events and recovery after a lost provider response.
- Deposit feature-flag enforcement.

## Setup

Use Node.js 24 and an isolated test database.

```sh
npm ci
```

Implement `createHarness()` in `tests/catlog.integration.ts` using the interface in
`tests/harness.ts`. Connect it to Catlog's transaction services, workers and database
queries. Create a fresh fixture for each test and simulate only the external provider.

Until this connection is implemented, tests fail with `CATLOG_SETUP_REQUIRED`.
The separate live Stellar test below runs without the Catlog backend connection.

## Run tests

```sh
npm run typecheck
npm test
```

To save a JUnit report:

```sh
npm run test:report
```

The report is written to `reports/junit.xml`.

## Real Stellar testnet payment

```sh
npm run test:testnet
```

Each run creates two temporary wallets, funds them through Friendbot, and sends
1 test XLM on Stellar testnet. It verifies the confirmed payment's sender, recipient,
asset, amount and balance changes. It then resubmits the same signed transaction and
checks that no second transfer or fee occurs.

The test generates keys in memory and uses fixed testnet endpoints. No wallet secrets
or real funds are needed. Public transaction details and the result are saved to
`reports/stellar-testnet.json`; the test report is `reports/stellar-testnet-junit.xml`.

This checks the direct Stellar payment path and same-transaction replay. Catlog's
transaction records, merchant credits, USDC and cross-chain routes require their own
integration tests. Friendbot or network problems fail this test. Testnet records may
be reset, so each run creates a fresh transaction.

## Test conventions

- Idempotency keys are scoped to each merchant.
- Statuses are normalized to `PENDING`, `COMPLETED` and `FAILED`.
- Completed transactions and confirmed failures are terminal; unknown outcomes remain pending.
- Amounts use integer `bigint` values at seven decimal places.
- The Catlog service tests use simulated provider results and transaction hashes.
  The separate `test:testnet` command makes a real Stellar testnet payment.

## Continuous integration

The GitHub Actions workflow runs on pushes, pull requests and manual requests, and
uploads test reports. Configure the test database, migrations and application services
required by the harness before the test step.

The separate **Stellar testnet payment** workflow runs manually from the Actions tab.
It runs the live test and uploads its public transaction details and test report.
