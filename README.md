# Catlog Shared Transaction Layer Tests

TypeScript tests for Catlog's shared transaction layer, built with Vitest.

## Quick start

Use Node.js 24. Place the privately supplied `.env.catlog` file in this
repository root, then run:

```sh
npm ci
npm test
```

This runs all 71 original acceptance cases against the private Catlog backend on
Cloudflare using a restricted API key. No backend source, local backend,
Cloudflare account, admin key, signing key or funded wallet is needed. The test
repository contains only tests and an HTTP adapter. Each case creates its own
isolated, durable server-side session. Controlled external-provider responses
exercise the backend's actual API, SQLite ledger, job queue, retries, recovery,
reconciliation and support permissions. Worker restart tests evict a real server
instance and verify that durable records survive.

The automated suite does not send blockchain funds. CCTP testnet and NEAR mainnet
live sessions are separate API options described below.

The console shows individual assertions and changes read from server transaction
records, explicitly labelled CONTROLLED. Each run saves `summary.json`,
`results.json` and `junit.xml` under a fresh `reports/catlog-.../` folder, including
the backend revision and whether the full 71-case suite ran. To select cases:

```sh
npm test -- tests/operations/retry-queue.test.ts
npm test -- -t "lost submit response"
```

Subset reports are labelled as subsets. Set `CATLOG_TRANSACTION_LOGS=false` to
hide transaction traces. The restricted key is provided privately as
`CATLOG_API_KEY`; the configured backend origin is `CATLOG_BACKEND_URL`.
Session credentials are generated automatically, scoped to one session and expire
after at most 24 hours. The key cannot use production admin APIs. Key expiry,
network outages or quota exhaustion produce explicit errors and fail the run.

## Optional live funding sessions

These use the same API key and the hosted API, and are not part of `npm test`.
The API returns public funding instructions and transaction status. Signing keys
are never returned. Real NEAR mainnet deposits are sent from your own wallet.

- NEAR on Ethereum: Ethereum USDC → Stellar mainnet USDC; pay ETH gas separately.
- NEAR on Base: Base USDC → Stellar mainnet USDC; pay ETH gas on Base separately.
- NEAR on Tron: Tron USDT → Stellar mainnet USDC; pay TRX network costs separately.
- CCTP: fresh Arc testnet USDC wallet → Stellar testnet USDC. A Stellar testnet
  destination is generated automatically unless an existing address is supplied.

Examples (use your own public refund and receiving addresses):

```sh
npm run live:create -- near ethereum --refund-address 0xYOUR_ADDRESS --stellar-recipient GYOUR_MAINNET_ADDRESS --amount 1
npm run live:create -- near base --refund-address 0xYOUR_BASE_ADDRESS --stellar-recipient GYOUR_MAINNET_ADDRESS --amount 1
npm run live:create -- near tron --refund-address TYOUR_ADDRESS --stellar-recipient GYOUR_MAINNET_ADDRESS --amount 105 --max-source 120
npm run live:create -- cctp arc --amount 1
npm run live:status -- SESSION_ID
```

As checked on October 28, 2026, 1Click reports a temporary **$100 minimum for
Tron swaps**. The example requests 105 output USDC with a 120 USDT source cap;
it only prepares a quote. Review the exact amount and fund it only if you choose
to run that mainnet test. Smaller requests return the provider's minimum-amount
message. Ethereum and Base support small test quotes.

For NEAR, the Stellar mainnet receiving account must already exist and have the
canonical USDC trustline. The refund address must match the wallet funding the
deposit. The service provides a 1Click-generated deposit address with the exact
source amount and quote expiry. Send the indicated token on the indicated network
before that expiry. No mainnet funds are sent by this test package or the backend.

For CCTP, use Circle's Arc Testnet faucet to fund the generated Arc address. The
instructions include an additional 2 test USDC reserve for source-network gas;
only the requested bridge amount is burned. Test wallet keys are encrypted and
retained privately by the backend. Do not send mainnet tokens to these wallets.

The CLI saves private session credentials in ignored `.catlog-sessions/` files.
Keep the session file and reuse `live:status` after funding. Use the same
`--idempotency-key` to resume a creation request without generating another deposit.

## Catlog live API reference

See the [Catlog deposit and payment status API](docs/CATLOG_API.md) for the
complete API guide, including copyable requests for Ethereum USDC, Base USDC, Tron USDT and
Arc testnet USDC deposit addresses; authentication; payment status polling;
response fields; errors; expiry; and limits. No backend access is required.

## Backend acceptance suite

`npm test` runs the original 71 cases against Catlog's hosted backend. The API
creates an isolated database session for each case. Its checks include:

- Merchant-scoped idempotency and conflicting payment details.
- Transaction status transitions and stale provider updates.
- Merchant isolation, ledger credits, balances and Stellar references.
- Duplicate settlement events and recovery after a lost provider response.
- Deposit feature flags.
- Durable retries, backoff, worker restarts and lease recovery.
- Reconciliation across both CCTP directions and the NEAR route.
- Support endpoint filters, external IDs and access controls.

The runner loads the included `catlog/adapter.mjs` HTTP adapter automatically.
The supplied API key and backend URL are enough to run the suite. Each run saves
`summary.json`, `results.json` and `junit.xml` under `reports/catlog-.../`.
The `reconciliation/` subfolder retains final transaction, ledger-credit, balance
and provider-transfer records for each reconciliation case. Session credentials
are excluded from these evidence files.

The committed [reconciliation report](RECONCILIATION_REPORT.md) records the
28 October 2026 GitHub Actions run: all 19 reconciliation cases passed within the
71-case suite. It includes ledger and chain tables, balance comparisons, original
JSON evidence, source revisions and individual case results.
It also includes 23 verified mainnet CCTP and NEAR transfers across Ethereum,
Base, Polygon and Stellar, plus one completed Arc-to-Stellar testnet transfer, with
block explorer links, received amounts and available backend record comparisons.
The two Catlog storefront checkout payments from the Tranche 2 submission
(Tron → Stellar and Polygon → Stellar) are listed with their `CLGPAY` references
and provider execution IDs; together with the Ethereum → Stellar transfer they
cover the three required NEAR routes into Stellar USDC.

The [binding guide](tests/operations/README.md) describes the optional integration
contract for connecting a different backend. It is not required for the hosted
API run. `npm run test:handoff` checks adapter-loading and reporting utilities
locally; those checks are separate from the 71 backend cases.

## Retry queues, reconciliation and support view

```sh
npm test -- tests/operations
```

This focused suite contains 54 acceptance cases. All are also included in `npm test`.
It checks durable retries and backoff, exhaustion without incorrectly failing a
payment, worker restart and lease recovery, missed webhooks, concurrent settlement,
and recovery of accepted transfers without a second source payment.

Required routes are declared in `tests/operations/harness.ts`:

- CCTP: Arc testnet → Stellar testnet.
- CCTP: Stellar testnet → Arc testnet.
- NEAR execution provider: the configured source network → Stellar testnet.

The hosted test API supplies all three controlled-provider fixture routes. These
fixture network names describe the automated fault scenarios; live NEAR funding
sessions use mainnet as described above. One scanner test covers all routes
together, in addition to the cases repeated for each route.

Support endpoint tests cover pending, completed, failed and recoverable transactions,
external IDs, status/route filters, ID search, pagination, authorized retry and access
restrictions. Recoverable transactions remain financially pending. A confirmed final
failure cannot be retried as if it were a temporary error.

The focused run uses the same API key and saves reports under `reports/catlog-.../`,
labelled as a subset. These tests use controlled external-provider fixtures and
exercise the hosted backend's queue, recovery and support APIs. Browser rendering
and live NEAR transfers are outside this suite.

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
tests below cover USDC across chains. The hosted API suite checks Catlog transaction
records and merchant credits. Friendbot or network problems fail the live
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

GitHub Actions runs the workflows below in GitHub's hosted environment. The two
Catlog workflows use the deployed Cloudflare backend through its API. They do not
need backend source, a private adapter, database access or a Cloudflare account.

- **Catlog backend API tests** (`.github/workflows/backend-tests.yml`) runs on
  pushes, pull requests and manual requests. It installs dependencies, checks
  TypeScript types and runs all 71 acceptance cases with `npm test`. It uploads
  `summary.json`, `results.json` and `junit.xml` as the `catlog-test-reports`
  artifact, including available reports when a test fails.
- **Catlog backend acceptance tests** (`.github/workflows/catlog-tests.yml`) runs
  only when started manually. It performs the same type checks and 71-case API
  suite, and records the Git commit, run ID and time. Enable `upload_reports`
  when starting it to upload structured reports. Console output remains available
  in the Actions log regardless of that option.
- **Stellar testnet payment** (`.github/workflows/stellar-testnet.yml`) runs
  manually. It makes a real Stellar testnet payment and uploads the public
  transaction details and test report. This is separate from the 71-case API
  suite, which uses controlled external-provider responses.

Configure the repository secret `CATLOG_API_KEY` with the supplied API key for
both Catlog workflows; it is already configured in this repository. The key
allows access to the hosted test API. Forks must configure their own secret.
For local runs, load the privately supplied key through `.env.catlog` instead.
