# Queue, reconciliation and support view tests

These are acceptance tests for Catlog's existing backend. Implement
`createOperationsHarness()` in `catlog.integration.ts` using real services,
durable queue storage, the test database and the authenticated endpoints used by
the internal support view. The repository does not include those services or a
support screen. Unconnected tests fail with `CATLOG_OPERATIONS_SETUP_REQUIRED`.

## Required routes

| Route ID | Provider | Direction |
| --- | --- | --- |
| `cctp.arc-to-stellar` | CCTP | Arc testnet → Stellar testnet |
| `cctp.stellar-to-arc` | CCTP | Stellar testnet → Arc testnet |
| `near.to-stellar` | NEAR | Configured source network → Stellar testnet |

NEAR names the execution provider; it does not imply that the source chain is
NEAR. Supply the actual source network, supported assets and recipient in the
NEAR fixture. `REQUIRED_ROUTES` is checked in, and every harness must provide all
three entries. Add each additional required direction as its own entry and fixture;
do not select routes dynamically from a provider's available-route response.

## Backend binding

- Start a clean namespace with two merchants and paused workers. The real transfer
  API persists the transaction and initial submission job; it does not run a worker
  inline in this fixture. Repeated merchant-scoped keys return the canonical ID.
- Use `TEST_POLICY`: three attempts including the initial attempt, delays of one
  and 1.5 seconds, a 1.5-second delay cap, five-second leases and one-second
  reconciliation intervals. Disable jitter for these deterministic tests.
- Advance the injected application and queue clock through `clock.advanceTo`.
  `runDue` processes jobs eligible at that instant, at most once per job per call.
  It must not sleep, advance time or swallow worker errors. Restarting workers
  preserves transactions, logical jobs, attempts and provider observations.
- Map the actual durable queue into `QueueJob`. A retryable error schedules the
  same logical job as `WAITING`; exhaustion makes it `DEAD` and the transaction
  `PENDING` with `MANUAL_REQUIRED`. The scanner must not reset an exhausted
  budget automatically; an authorized support action is required. A confirmed
  rejection is terminal `FAILED`.
- Simulate only the provider boundary. `plan` controls submissions for one
  merchant/route/key. `observe` changes a remote lookup result without delivering
  a webhook. `failLookups` injects transient lookup errors without changing remote
  transfer state. `deliver` goes through the real verified webhook handler. A lost
  response means the provider accepted exactly one source transfer. Lookup or
  resumption must retain its identity and must not perform another source burn.
  Record the actual signed transaction/envelope identity on SUBMIT/RESUME calls.
  Do not deduplicate solely by Catlog's key unless the real provider guarantees
  that behavior; otherwise a simulator could hide a duplicate burn.
- For CCTP, `readyToResume` makes lookup return pending with a ready destination
  action. Only a real RESUME boundary call may produce the simulated destination
  effect. This tests Catlog submitting the remaining mint. NEAR completion is
  observed through its execution provider, without inventing a NEAR mint API.
- Read transaction, queue and settlement records from real storage. Settlement
  rows represent committed ledger effects, not counters maintained by the test
  helper. Normalize amounts to seven-decimal integer units and retain the real
  ledger reference and owning merchant. Count logical source and destination
  transfers separately, from their actual submission identities.
- Bind support reads and actions to the authenticated API used by the internal
  view. Map real failures to `Error` objects with a string `code` such as
  `UNAUTHENTICATED`, `FORBIDDEN` or `NOT_RECOVERABLE`. Do not implement a second
  filter, search function or authorization check inside the harness.

## Support view contract

The view exposes Catlog IDs, merchant and route, financial status, recovery state,
retry attempts, next attempt, last error and available external IDs. External IDs
distinguish the source transaction, provider execution, CCTP message, destination
transaction and destination event. Pending rows retain missing IDs as `null`;
NEAR rows retain the NEAR execution ID without inventing a CCTP message ID.

`RECOVERABLE` is a support state for a financially `PENDING` transaction with
scheduled, active or manually required recovery. `COMPLETED` and confirmed
`FAILED` records are terminal. Only authorized support callers can access this
view or request a retry. Retry actions are deduplicated and reconcile the existing
transfer before any new submission is considered.

These tests exercise the view's backing endpoints. They do not test browser
rendering, and simulated provider observations are not live NEAR transfer evidence.

## Run

```sh
npm run typecheck
npm run test:operations
```

The focused command writes `reports/operations-junit.xml`. `npm test` and the
standard CI job also include these tests. Passing requires the real backend
binding; a setup error is not a successful feature test.
