# Catlog Shared Transaction Layer Tests

TypeScript tests for Catlog's shared transaction layer, built with Vitest.

## What's tested

- Idempotency for repeated and concurrent deposit requests.
- Conflicts when an idempotency key is reused with different payment details.
- Transaction status transitions and handling of stale provider updates.
- Merchant isolation, ledger credits, balances and Stellar transaction references.
- Duplicate settlement events and recovery after a lost provider response.
- Deposit feature-flag enforcement.
- Durable retry queues, bounded backoff, worker restarts and lease recovery.
- Reconciliation across both CCTP directions and the NEAR-to-Stellar route.
- Internal support view data, status filters, external IDs and access controls.

## Setup

Use Node.js 24 and an isolated test database.

```sh
npm ci
```

Implement `createHarness()` in `tests/catlog.integration.ts` using the interface in
`tests/harness.ts`. Connect it to Catlog's transaction services, workers and database
queries. Create a fresh fixture for each test and simulate only the external provider.

The operations suite has a separate connection in
`tests/operations/catlog.integration.ts` for the durable queue, reconciliation services
and authenticated support endpoints. Both suites require real backend connections;
unconfigured suites fail with an explicit setup error. The live Stellar and CCTP
tests below run separately.

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

## Retry queues, reconciliation and support view

```sh
npm run test:operations
```

This focused suite contains 54 acceptance cases. It is also included in `npm test`.
It checks durable retries and backoff, exhaustion without incorrectly failing a
payment, worker restart and lease recovery, missed webhooks, concurrent settlement,
and recovery of accepted transfers without a second source payment.

Required routes are declared in `tests/operations/harness.ts`:

- CCTP: Arc testnet → Stellar testnet.
- CCTP: Stellar testnet → Arc testnet.
- NEAR execution provider: the configured source network → Stellar testnet.

Every fixture must provide all three routes. NEAR identifies the provider; configure
the actual source network and assets in the backend fixture. One scanner test covers
all routes together, in addition to the cases repeated for each route.

Support endpoint tests cover pending, completed, failed and recoverable transactions,
external IDs, status/route filters, ID search, pagination, authorized retry and access
restrictions. Recoverable transactions remain financially pending. A confirmed final
failure cannot be retried as if it were a temporary error.

See [the binding guide](tests/operations/README.md) for the required backend contract.
Results are written to `reports/operations-junit.xml`. These tests simulate only the
external provider. They do not implement a queue or support screen in this repository,
test browser rendering, or prove a live NEAR transfer. They cannot pass until Catlog's
backend is connected.

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

This checks the direct Stellar payment path and same-transaction replay. The CCTP
tests below cover USDC across chains. Catlog transaction records and merchant credits
still require the backend connection. Friendbot or network problems fail the live
test. Testnet records may be reset, so each run creates a fresh transaction.

## USDC over CCTP: Arc testnet ↔ Stellar testnet

Create a test wallet file, which stores the generated Arc and Stellar keys locally
with owner-only permissions. The default filename is ignored by Git. The command
prints only public addresses and refuses to overwrite an existing file.

```sh
npm run wallet:testnet
export CCTP_TEST_WALLET_FILE="$PWD/.env.cctp-wallet.json"
```

Fund the printed Arc address with test USDC from [Circle's faucet](https://faucet.circle.com/),
selecting **Arc Testnet**. Arc uses USDC for gas as well as the transfer. The inbound
test funds the Stellar account with Friendbot and creates its Circle USDC trustline.

```sh
npm run test:cctp
npm run test:cctp:return
```

Run these commands in order with the same wallet file. The first bridges 1 USDC from
Arc into Stellar; the second bridges 0.5 USDC back to Arc. Each command submits new
transactions, waits for Circle's attestation, validates the message's route and
amount, and completes the destination mint. Both use canonical Circle test USDC.
The inbound Stellar leg uses CCTP's forwarder to credit the generated Stellar account.
See [Circle's Stellar CCTP guide](https://developers.circle.com/cctp/references/stellar)
and [testnet contract addresses](https://developers.circle.com/cctp/references/contract-addresses).

Checks include successful source and destination transactions, the attested amount
and bridge fee, and the received balance. On Arc, the balance check accounts for USDC
spent as network gas. Reports contain public addresses, transaction hashes, messages,
attestations, amounts and results:

- `reports/cctp-testnet.json` and `reports/cctp-testnet-junit.xml`
- `reports/cctp-return-testnet.json` and `reports/cctp-return-testnet-junit.xml`

These are direct CCTP integration tests. They do not connect to Catlog's backend or
prove its merchant ledger or application idempotency. The tests depend on available
testnet funding, Circle attestation, and network services. They are run explicitly,
separate from the default Catlog service suite. Keep the wallet file outside shared
artifacts; the reports contain no private keys.

If a run stops after its Arc burn is recorded but before a Stellar mint hash is
recorded, resume that burn instead of creating another one:

```sh
CCTP_RESUME_REPORT=reports/cctp-testnet.json npm run test:cctp
```

For the return leg, use `CCTP_RETURN_RESUME_REPORT=reports/cctp-return-testnet.json`
with `npm run test:cctp:return`. Use the same wallet file. Resume checks the saved
burn onchain and completes its attestation and mint. If a mint hash is already recorded, inspect that transaction
before retrying. Balance checks use each transaction's block; run the tests in order
without other transactions from the same wallets during a run.

## Test conventions

- Idempotency keys are scoped to each merchant.
- Statuses are normalized to `PENDING`, `COMPLETED` and `FAILED`.
- Completed transactions and confirmed failures are terminal; unknown outcomes remain pending.
  Recovery is tracked separately and can appear as `RECOVERABLE` in the support view.
- Catlog service amounts use integer `bigint` values at seven decimal places.
  CCTP messages use six decimals; the live tests convert explicitly for Stellar.
- The Catlog service tests use simulated provider results and transaction hashes.
  The separate `test:testnet` command makes a real Stellar testnet payment;
  the `test:cctp` commands bridge real test USDC through CCTP.

## Continuous integration

The GitHub Actions workflow runs on pushes, pull requests and manual requests, and
uploads test reports. Configure the test database, migrations and application services
required by the harness before the test step.

The separate **Stellar testnet payment** workflow runs manually from the Actions tab.
It runs the live test and uploads its public transaction details and test report.
