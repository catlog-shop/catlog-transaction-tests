# Catlog Shared Transaction Layer Tests

TypeScript tests for Catlog's shared transaction layer, built with Vitest.

## Quick start

Use Node.js 24. Copy the privately supplied `.env.reviewer` file into the
repository root, then run:

```sh
npm ci
npm test
```

The default command connects to
[backend staging API](https://catlog-transaction-test.throbbing-cloud-0f8e.workers.dev/)
and runs 30 backend API tests. A reviewer API key is required; no local backend
checkout or Cloudflare account is needed. Internet access and an available Worker
are required. The `.env.reviewer` file contains `CATLOG_TEST_API_KEY=<provided-key>`
and is ignored by Git. You can also set that environment variable directly.

The reviewer key creates isolated sessions; each test receives its own temporary
session credential automatically. The reviewer key cannot read or change other
sessions. Share it privately and keep it out of commits and reports.
The suite covers synthetic success, failure, retry, expiry and duplicate-event
paths for the Arc-to-Stellar, Stellar-to-Arc and NEAR-to-Stellar route labels.
It also checks idempotency, ledger credits, input validation and session isolation.
These results validate the hosted Worker backend, not live transfers.

Runs print transaction status changes, retries and external IDs. JSON results,
JUnit and a summary are saved under a new `reports/base-.../` directory.
`npm run test:report` and `npm run test:base` run the same hosted suite.

The URL is configured in [config/base.json](config/base.json).
Set `BASE_URL` only when targeting another compatible backend. Sessions
expire after 24 hours and are deleted by the tests when they finish. A busy API
can return a rate-limit error; retry the run after a minute.

## Backend acceptance suite

The separate 71-case suite requires Catlog's actual backend and an isolated test
database. Its checks include:

- Merchant-scoped idempotency and conflicting payment details.
- Transaction status transitions and stale provider updates.
- Merchant isolation, ledger credits, balances and Stellar references.
- Duplicate settlement events and recovery after a lost provider response.
- Deposit feature flags.
- Durable retries, backoff, worker restarts and lease recovery.
- Reconciliation across both CCTP directions and the NEAR route.
- Support endpoint filters, external IDs and access controls.

Supply `createHarness()` and `createOperationsHarness()` through
`CATLOG_BACKEND_ADAPTER`. Both factories must connect to the real application
services, workers and database. These commands fail with an explicit setup error
until that connection exists:

```sh
npm run test:backend
npm run test:backend:report
```

The backend JUnit report is written to `reports/junit.xml`. For the full private
run with backend revision metadata and a shareable summary, use
`npm run test:private`. `npm run test:handoff` checks packaging utilities only.

## Retry queues, reconciliation and support view

```sh
npm run test:operations
```

This focused suite contains 54 acceptance cases. It is also included in `npm run test:backend`.
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
Results are written to `reports/operations-junit.xml`. These tests use controlled
external-provider fixtures. They do not implement a queue or support screen in this repository,
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
separate from the hosted Worker backend and private acceptance suites. Keep the wallet
file outside shared artifacts; the reports contain no private keys.

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
- The Catlog service tests use controlled provider results and test transaction hashes.
  The separate `test:testnet` command makes a real Stellar testnet payment;
  the `test:cctp` commands bridge real test USDC through CCTP.

## Continuous integration

The **Catlog base tests** workflow runs type checks, logging checks and
`npm test` on pushes, pull requests and manual requests. Configure the repository
secret `CATLOG_TEST_API_KEY` with the reviewer key. The workflow uploads a summary
identified as backend results. Forks and other checkouts do not inherit this
secret; testers must obtain the key privately.

The **Catlog backend acceptance tests (private adapter required)** workflow runs
only on manual request. Configure the private adapter, test database, migrations
and services before its backend test step. It cannot pass without those bindings.
Its standard JUnit upload is opt-in; private-run reports stay local.

The **Stellar testnet payment** workflow runs manually and uploads its public
transaction details and test report.
