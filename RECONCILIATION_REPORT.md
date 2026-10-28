# Catlog reconciliation report

**Result: 19 reconciliation cases passed, 0 failed, 0 skipped.** The complete backend acceptance run passed all 71 cases.

This report was generated from the existing GitHub Actions test results on 28 October 2026.

## Run and evidence

| Field | Recorded value |
| --- | --- |
| Workflow | [Catlog backend API tests, run 40699857415](https://github.com/flarcos/catlog-transaction-tests/actions/runs/40699857415) — successful |
| Test source revision | [`837563dce37220a8e4e1465424bfcf2aca78a38c`](https://github.com/flarcos/catlog-transaction-tests/tree/837563dce37220a8e4e1465424bfcf2aca78a38c) |
| Backend revision reported at run start | `43f3b3faa3e37641c7a1b4ce9170fe80410e92d9` |
| Test run ID | `catlog-2026-10-28T13-48-58.474Z-5e843f1b` |
| Full run started, UTC | `2026-10-28T13:48:58.475Z` |
| Full run finished, UTC | `2026-10-28T13:51:45.884Z` |
| Full run, WAT (UTC+1) | 28 October 2026, 14:48:58–14:51:45 |
| Full run elapsed time | 167.409 seconds |
| Backend origin | https://catlog-backend.throbbing-cloud-0f8e.workers.dev |
| Execution environment | Cloudflare backend accessed over HTTP |
| Provider responses | Controlled fixtures |
| On-chain transfers in this run | None (`onchainTransfers: false`) |
| Source artifact | `catlog-test-reports`, GitHub artifact ID `12821761208` |

The [run summary](docs/evidence/reconciliation-2026-10-28/summary.json) and [complete Vitest results](docs/evidence/reconciliation-2026-10-28/results.json) are committed with this report. They are byte-for-byte copies downloaded from the workflow artifact, so the evidence remains available in the repository after that artifact expires. They contain no API keys, session credentials or wallet signing keys.

| Evidence file | SHA-256 |
| --- | --- |
| `summary.json` | `1c5c1e63e4d3fba70d03d089d915d09c34c8b983a90715021df2f5e04526d49f` |
| `results.json` | `031adeff8caccb856338cbfa13afecd8eb1255eebd36b9aeb830c9a8d00a70cc` |

All five test-file hashes recorded in `summary.json` matched the test sources used to prepare this report. The reconciliation source hash is `d65f7e875541a75ce7e6b29b340a46151f31a24e9cdebe90f4975c5dfd391ac8`.

## Complete acceptance run

| Test file | Passed | Failed | Skipped |
| --- | ---: | ---: | ---: |
| [tests/transactions.test.ts](tests/transactions.test.ts) | 17 | 0 | 0 |
| [tests/operations/retry-queue.test.ts](tests/operations/retry-queue.test.ts) | 18 | 0 | 0 |
| [tests/operations/reconciliation.test.ts](tests/operations/reconciliation.test.ts) | 19 | 0 | 0 |
| [tests/operations/recovery-errors.test.ts](tests/operations/recovery-errors.test.ts) | 3 | 0 | 0 |
| [tests/operations/support-view.test.ts](tests/operations/support-view.test.ts) | 14 | 0 | 0 |
| **Total** | **71** | **0** | **0** |

## Reconciliation coverage

The dedicated reconciliation suite has six scenarios for each of three fixture routes, plus one global scanner scenario. Each case uses its own isolated backend session and durable records.

| Fixture route | Passed | Failed | Skipped |
| --- | ---: | ---: | ---: |
| `cctp.arc-to-stellar` — Arc testnet → Stellar testnet | 6 | 0 | 0 |
| `cctp.stellar-to-arc` — Stellar testnet → Arc testnet | 6 | 0 | 0 |
| `near.to-stellar` — configured source → Stellar testnet fixture | 6 | 0 | 0 |
| One scanner pass across all three routes | 1 | 0 | 0 |
| **Total** | **19** | **0** | **0** |

### Conditions checked

- A lost provider response followed by a worker restart recovers the accepted transfer, preserves its identifiers and avoids a second source transfer.
- The global scanner discovers completed transfers even when their completion webhooks never arrive.
- A transfer stays pending without a ledger credit while its destination remains incomplete. CCTP destination execution resumes when required; NEAR completion is recovered from the provider observation.
- Concurrent duplicate completion webhooks and a reconciliation worker produce exactly one committed settlement.
- A confirmed failure remains failed after a stale pending observation, with no settlement credit.
- A completed transfer retains its status, destination identifiers and committed ledger effect after a stale pending observation.
- One global scanner pass finds missed completions across all three required routes, with one distinct ledger reference per transfer.

For completed cases, the shared `assertSettledOnce` helper checks the persisted route, recipient, destination asset, completed status and external identifiers; one credit for the correct merchant, asset and expected net amount; and one logical source and destination transfer in the controlled provider. These assertions are in the [reconciliation source](tests/operations/reconciliation.test.ts) and [shared fixtures](tests/operations/fixtures.ts).

### Individual recorded results

Test names, routes, statuses and durations below come from `results.json`. Durations are rounded to milliseconds.

| Case | Fixture route | Recorded test name | Result | Duration (seconds) |
| --- | --- | --- | --- | ---: |
| R01 | `cctp.arc-to-stellar` | recovers an accepted transfer after a lost response and worker restart without another source transfer | PASS | 3.188 |
| R02 | `cctp.arc-to-stellar` | finds a completed transfer whose webhook was missed using only the global scanner | PASS | 1.921 |
| R03 | `cctp.arc-to-stellar` | keeps an accepted source transfer pending until the destination completes without submitting another source transfer | PASS | 3.496 |
| R04 | `cctp.arc-to-stellar` | commits one settlement when duplicate completion webhooks race a reconciliation worker | PASS | 1.567 |
| R05 | `cctp.arc-to-stellar` | does not regress a confirmed terminal failure when a later lookup reports pending | PASS | 1.398 |
| R06 | `cctp.arc-to-stellar` | preserves completed status, destination identifiers and the ledger settlement after a later pending observation | PASS | 1.800 |
| R07 | `cctp.stellar-to-arc` | recovers an accepted transfer after a lost response and worker restart without another source transfer | PASS | 2.931 |
| R08 | `cctp.stellar-to-arc` | finds a completed transfer whose webhook was missed using only the global scanner | PASS | 1.685 |
| R09 | `cctp.stellar-to-arc` | keeps an accepted source transfer pending until the destination completes without submitting another source transfer | PASS | 2.138 |
| R10 | `cctp.stellar-to-arc` | commits one settlement when duplicate completion webhooks race a reconciliation worker | PASS | 1.588 |
| R11 | `cctp.stellar-to-arc` | does not regress a confirmed terminal failure when a later lookup reports pending | PASS | 1.656 |
| R12 | `cctp.stellar-to-arc` | preserves completed status, destination identifiers and the ledger settlement after a later pending observation | PASS | 2.092 |
| R13 | `near.to-stellar` | recovers an accepted transfer after a lost response and worker restart without another source transfer | PASS | 10.332 |
| R14 | `near.to-stellar` | finds a completed transfer whose webhook was missed using only the global scanner | PASS | 1.832 |
| R15 | `near.to-stellar` | keeps an accepted source transfer pending until the destination completes without submitting another source transfer | PASS | 2.766 |
| R16 | `near.to-stellar` | commits one settlement when duplicate completion webhooks race a reconciliation worker | PASS | 1.507 |
| R17 | `near.to-stellar` | does not regress a confirmed terminal failure when a later lookup reports pending | PASS | 3.168 |
| R18 | `near.to-stellar` | preserves completed status, destination identifiers and the ledger settlement after a later pending observation | PASS | 2.985 |
| R19 | `all routes` | one global scanner pass discovers and settles missed completions across every required route | PASS | 2.799 |

## Findings

No reconciliation assertion failures were reported in these 19 cases. The tested recovery, idempotency, terminal-state preservation and ledger-settlement conditions all passed for this recorded run.

## Reproduce the checks

Use Node.js 24 and the privately supplied `.env.catlog` file. From the repository root:

```sh
npm ci
npm run typecheck
npm test
```

To run only the 19 reconciliation cases:

```sh
npm test -- tests/operations/reconciliation.test.ts
```

The restricted API key and hosted backend URL are sufficient. Each new run saves `summary.json`, `results.json` and `junit.xml` under a fresh ignored `reports/catlog-.../` directory. A focused run is labelled as a subset. A new run may report a different backend revision or result; this committed report remains a snapshot of the workflow identified above.
