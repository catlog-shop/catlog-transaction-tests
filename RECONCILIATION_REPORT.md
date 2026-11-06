# Catlog reconciliation report

**Result: 19 reconciliation cases passed, 0 failed, 0 skipped.** The complete backend acceptance run passed all 71 cases.

This report combines the 6 November 2026 automated test results with blockchain transactions verified on 28 October 2026.

## Verified blockchain transactions

**23 mainnet transfers and 1 CCTP testnet transfer verified by chain receipt. All 24 destination amounts matched their provider output or CCTP net amount.** Two further Catlog checkout payments (Tron and Polygon → Stellar) are recorded from provider execution records and Catlog payment records.

Stellar-bound evidence checked on 28 October 2026 at 21:12:47 UTC (22:12:47 WAT). The Polygon → Base receipt was additionally checked at 21:46:47 UTC (22:46:47 WAT).

Recorded EVM wallet: [`0xBeA94bAA9B17De76a1dA7B9070aa2A86c4706117`](https://etherscan.io/address/0xBeA94bAA9B17De76a1dA7B9070aa2A86c4706117) — [Ethereum token history](https://etherscan.io/tokentxns?a=0xBeA94bAA9B17De76a1dA7B9070aa2A86c4706117) · [Base token history](https://basescan.org/tokentxns?a=0xBeA94bAA9B17De76a1dA7B9070aa2A86c4706117). Both displayed pages of token history were inspected on Ethereum and Base. The first table covers transfers matched to Stellar USDC receipts, followed by the two Catlog checkout payments and the Stellar → Base receipts. Ethereum → Base and Polygon → Base receipts are in the appendix.

### Mainnet transfers into Stellar

| ID | Source time (UTC) | Provider | Source chain | USDC sent | Expected Stellar USDC | Received Stellar USDC | Difference | Source transaction | Stellar transaction |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| [L01](docs/evidence/live-transfers-2026-10-28/proofs/L01.json) | 2026-09-20 13:52:47 | NEAR | Ethereum | 2.000000 | 1.9803069 | 1.9803069 | 0.0000000 | [0x205d385ad9…5a837e9f](https://etherscan.io/tx/0x205d385ad96cf1e8af0b889c516ef09c96d63b94041bf76e764b27415a837e9f) | [c8ffe915bae2…22bd68c5](https://stellar.expert/explorer/public/tx/c8ffe915bae2f6aa0386ef58e99bfd5ee76f52e7a959c3e878317c4f22bd68c5) |
| [L02](docs/evidence/live-transfers-2026-10-28/proofs/L02.json) | 2026-09-20 14:12:23 | CCTP | Ethereum | 2.000000 | 1.9998000 | 1.9998000 | 0.0000000 | [0x9ca1046ce3…ee6e31a9](https://etherscan.io/tx/0x9ca1046ce38ce84908f792c343e6ed7a779bd2d5a5ebcff3465f4d24ee6e31a9) | [ac6e18976dfa…2a2cab84](https://stellar.expert/explorer/public/tx/ac6e18976dfa8c9ae0f0d18037eae148f571416d1dda769468a1eb542a2cab84) |
| [L03](docs/evidence/live-transfers-2026-10-28/proofs/L03.json) | 2026-09-25 20:38:11 | NEAR | Base | 4.996439 | 4.9729154 | 4.9729154 | 0.0000000 | [0x3edc183f36…95f3c4fe](https://basescan.org/tx/0x3edc183f364fed5e43dbec14c496e2298371a227e0539ce6f47f41c495f3c4fe) | [dc42a73f8bfe…d7920d39](https://stellar.expert/explorer/public/tx/dc42a73f8bfe4a6d3a646e3d1491e4fa98ae1486242e5b0ac86b80e5d7920d39) |
| [L04](docs/evidence/live-transfers-2026-10-28/proofs/L04.json) | 2026-09-27 09:00:47 | NEAR | Ethereum | 2.000000 | 1.9775694 | 1.9775694 | 0.0000000 | [0x0ad66c0927…e8b94356](https://etherscan.io/tx/0x0ad66c0927dee202cd7f2fe6414124fc500df2c013d18510e08a77b9e8b94356) | [2d9c4ac9e49d…0eb5e15f](https://stellar.expert/explorer/public/tx/2d9c4ac9e49dfef4950f8872ec1dc72af8b842c3e95639ec95ce73a10eb5e15f) |
| [L05](docs/evidence/live-transfers-2026-10-28/proofs/L05.json) | 2026-09-30 12:57:29 | NEAR | Base | 1.000000 | 0.9764279 | 0.9764279 | 0.0000000 | [0x13147c27b2…ea4c7ace](https://basescan.org/tx/0x13147c27b22ee4de282409a0084854cb8054ae5abd112b230c7fb462ea4c7ace) | [f9df35e55bb7…e335b88b](https://stellar.expert/explorer/public/tx/f9df35e55bb764009cc813c4d30c3966da0a5c616135b0a89262577ce335b88b) |
| [L06](docs/evidence/live-transfers-2026-10-28/proofs/L06.json) | 2026-09-30 13:01:15 | CCTP | Base | 1.000000 | 1.0000000 | 1.0000000 | 0.0000000 | [0xff1cc9c8f0…a52e3eae](https://basescan.org/tx/0xff1cc9c8f0a4a0f79cec2bd6f7dacfff4695814e91fcd73806d0de80a52e3eae) | [4c3fbb600d08…06e12513](https://stellar.expert/explorer/public/tx/4c3fbb600d080ac9febd510f850e6b7a1609f25d0905b6d54e778dc306e12513) |
| [L07](docs/evidence/live-transfers-2026-10-28/proofs/L07.json) | 2026-09-30 13:18:09 | NEAR | Base | 2.000000 | 1.9761384 | 1.9761384 | 0.0000000 | [0xde2cee145f…4a83a854](https://basescan.org/tx/0xde2cee145fba4c0a0b6e5d547027ea1a3fc7a0567ade07ddc6b9b6754a83a854) | [80fead79c3d0…de2fdfb6](https://stellar.expert/explorer/public/tx/80fead79c3d011a8112abd645de2b199b309b7440093dbafdd0a472bde2fdfb6) |
| [L08](docs/evidence/live-transfers-2026-10-28/proofs/L08.json) | 2026-10-07 18:43:11 | CCTP | Ethereum | 6.000000 | 6.0000000 | 6.0000000 | 0.0000000 | [0x8b3ec7cc2a…ab22a7b4](https://etherscan.io/tx/0x8b3ec7cc2acb4f8b69c7a2626f8ae368c5133a22f04a391711fc3a03ab22a7b4) | [6bbbe890e59e…ffd3e830](https://stellar.expert/explorer/public/tx/6bbbe890e59efbd834a3d7d41532fc5a9d2425db6275c9946cba575bffd3e830) |
| [L09](docs/evidence/live-transfers-2026-10-28/proofs/L09.json) | 2026-10-20 14:12:59 | CCTP | Ethereum | 5.000000 | 4.9995000 | 4.9995000 | 0.0000000 | [0x8a3afa7a3f…5d552988](https://etherscan.io/tx/0x8a3afa7a3f11719374e23d5618796ae5fd1c73d8e6736b9f9f4320c45d552988) | [6ee5e62f9fd7…8c0e8690](https://stellar.expert/explorer/public/tx/6ee5e62f9fd7838234285e1b0847c9ca52b16e6ecc128aaecbf88d0f8c0e8690) |
| [L10](docs/evidence/live-transfers-2026-10-28/proofs/L10.json) | 2026-10-20 14:52:01 | CCTP | Base | 3.000000 | 2.9996100 | 2.9996100 | 0.0000000 | [0x0bb1cc2528…f1f2468b](https://basescan.org/tx/0x0bb1cc252856caed84921f5924009d74302dd45d5df5ac8d3037e908f1f2468b) | [e8a0ecebc249…4978cf5a](https://stellar.expert/explorer/public/tx/e8a0ecebc249d71d94374d755af454b6032432ce02600a97786592654978cf5a) |
| [L11](docs/evidence/live-transfers-2026-10-28/proofs/L11.json) | 2026-10-25 18:57:59 | NEAR | Ethereum | 10.000000 | 9.9808406 | 9.9808406 | 0.0000000 | [0xa8f949caab…bf323fa9](https://etherscan.io/tx/0xa8f949caab7e92c0d02985f181c6acf975a17840e0805db81febd2a7bf323fa9) | [61d30d2c1a54…0ee93246](https://stellar.expert/explorer/public/tx/61d30d2c1a54c7ef8995690e010165f885c148aa8f3d7461c6fb9a6e0ee93246) |
| [L12](docs/evidence/live-transfers-2026-10-28/proofs/L12.json) | 2026-10-28 10:08:35 | NEAR | Ethereum | 1.027879 | 1.0000000 | 1.0000000 | 0.0000000 | [0x7a8be0376c…c3f8ca95](https://etherscan.io/tx/0x7a8be0376c703dc23d6938a0b9ce0f0dcd6ac7fa24a4e4c0728f85f6c3f8ca95) | [a319bc90c5bc…9aca1117](https://stellar.expert/explorer/public/tx/a319bc90c5bcb6fa8b123c7c157207758f17a78cd867a2cb6166c5c29aca1117) |

Expected receipt is the burn amount minus Circle's executed fee for CCTP, or 1Click's reported settled output for NEAR. Difference is the on-chain Stellar receipt minus that expected amount. For example, the 5 USDC Ethereum CCTP burn executed a 0.000500 USDC fee and delivered 4.9995000 USDC; the 3 USDC Base burn executed a 0.000390 USDC fee and delivered 2.9996100 USDC.

| Route | Transfers | USDC sent | Stellar USDC received |
| --- | ---: | ---: | ---: |
| CCTP: Ethereum → Stellar mainnet | 3 | 13.000000 | 12.9993000 |
| NEAR: Ethereum → Stellar mainnet | 4 | 15.027879 | 14.9387169 |
| CCTP: Base → Stellar mainnet | 2 | 4.000000 | 3.9996100 |
| NEAR: Base → Stellar mainnet | 3 | 7.996439 | 7.9254817 |
| **Stellar-bound mainnet transfers** | **12** | **40.024318** | **39.8631086** |

### Catlog checkout payments into Stellar

These two payments were made through the Catlog storefront checkout and are the NEAR routes reviewed in the Tranche 2 submission. Each has a Catlog payment reference. Source and destination hashes, amounts and settlement times are taken from the provider's execution record for each deposit; the Catlog payment status and paid-at time are from the Catlog payment record. Chain receipts for these two rows were not re-fetched by RPC for this report.

| ID | Catlog reference | Paid at (UTC) | Provider | Source chain / asset | Source amount | Received Stellar USDC | Settled at (UTC) | Source transaction | Stellar transaction | Provider execution ID |
| --- | --- | --- | --- | --- | ---: | ---: | --- | --- | --- | --- |
| [C01](docs/evidence/checkout-payments-2026-10/payments.json) | `CLGPAY-46093824` | 2026-10-05 08:57:01 | NEAR | Tron / USDT | 173.000000 | 172.8156800 | 2026-10-07 12:00:21 | [896edd8225e8…cc7b489f](https://tronscan.org/#/transaction/896edd8225e8ac9d4208daf9b5f833ce3dfca552cf12340a8e093178cc7b489f) | [b74e4e27b4d9…e8d71e5e](https://stellar.expert/explorer/public/tx/b74e4e27b4d9a46f7276869e1571637315ad32d3594966fb79be5502e8d71e5e) | [EdjXUday9su2…SSQBChCV](https://pikespeak.ai/intents/EdjXUday9su2gsgvRvFayAqQci2hPCmiLWTuSSQBChCV) |
| [C02](docs/evidence/checkout-payments-2026-10/payments.json) | `CLGPAY-57633157` | 2026-10-07 11:00:06 | NEAR | Polygon / USDC | 6.071000 | 6.0494948 | 2026-10-08 12:10:04 | [0xcfe9d94be3…878c2b5e](https://polygonscan.com/tx/0xcfe9d94be31d262b408e64025327a21e0f9b7708db14e774b0fee041878c2b5e) | [06d9aae0bc37…cc1db5d3](https://stellar.expert/explorer/public/tx/06d9aae0bc370648ad621f64e8ef97fdf897af9c3f0fcc2bf791d94ecc1db5d3) | [BdvC3XTLZ6fC…qZrjpMCk](https://pikespeak.ai/intents/BdvC3XTLZ6fCbV6KM754tNXXrGabH2S9haQQqZrjpMCk) |

| Catlog reference | Catlog payment status | Amount due | Amount received | Note |
| --- | --- | ---: | ---: | --- |
| `CLGPAY-46093824` | completed | 172.700000 USDT | 173.000000 USDT | Paid in full. |
| `CLGPAY-57633157` | partial-payment | 6.191000 USDC | 6.071000 USDC | Under-paid by 0.120000 USDC; the received amount was bridged to Stellar. |

Together with L11 (Ethereum → Stellar, 25 October 2026), these give the three required NEAR routes into Stellar USDC: Tron (non-EVM), Polygon (EVM) and Ethereum (EVM). The NEAR deposit and swap hashes for C01 and C02 are in the [checkout payment evidence](docs/evidence/checkout-payments-2026-10/payments.json).

### Stellar to Base receipts

Source Stellar account: `GDQSTT6A6PDQR5JNHW34U5E4LCBFB3LE662YCJGBJDQ3QIS3EOHJTAF5`. All four transfers delivered canonical Base USDC to `0xBeA94bAA9B17De76a1dA7B9070aa2A86c4706117`.

Checked on 28 October 2026 at 21:56:10 UTC (22:56:10 WAT).

| ID | Provider | Source time (UTC) | Stellar USDC sent | Expected Base USDC | Received Base USDC | Difference | Stellar source receipt | Base receiving receipt |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| [S01](docs/evidence/stellar-base-2026-10-28/proofs/S01.json) | CCTP | 2026-09-30 12:52:52 | 1.0000000 | 0.927086 | 0.927086 | 0.000000 | [d406fdf73d31…48415067](https://stellar.expert/explorer/public/tx/d406fdf73d310016813afa377f3409fdd9ba32a5bade114170e2fb1f48415067) | [0x5135a2141c…b194b632](https://basescan.org/tx/0x5135a2141c6b0420e239a404115db0e70c2c96d73183946ebc083b98b194b632) |
| [S02](docs/evidence/stellar-base-2026-10-28/proofs/S02.json) | NEAR | 2026-09-30 13:10:37 | 1.0000000 | 0.997398 | 0.997398 | 0.000000 | [64c568968ef0…07badcc9](https://stellar.expert/explorer/public/tx/64c568968ef05f3b04b44a3428944f5861a77d10d82c9a544aa6703407badcc9) | [0x0c0bf9c21f…bef7b18f](https://basescan.org/tx/0x0c0bf9c21f826fa3be42a3d02c0afd2f48f23b2478bae7de92ca7b25bef7b18f) |
| [S03](docs/evidence/stellar-base-2026-10-28/proofs/S03.json) | NEAR | 2026-09-30 18:52:27 | 5.0000000 | 4.996590 | 4.996590 | 0.000000 | [4f6031e4f343…b9cde392](https://stellar.expert/explorer/public/tx/4f6031e4f343b82d13a23a1b00e3cb38978fdea33d32f55c10287795b9cde392) | [0x496a04aedb…2504a3fd](https://basescan.org/tx/0x496a04aedbd0ca8ad2d6e93db7c52f3c3bb21e7f20437afdcfa09db42504a3fd) |
| [S04](docs/evidence/stellar-base-2026-10-28/proofs/S04.json) | CCTP | 2026-10-20 14:32:58 | 4.0000000 | 3.940448 | 3.940448 | 0.000000 | [72e65a7953cb…07341ae8](https://stellar.expert/explorer/public/tx/72e65a7953cbe4296dc04dfb62795285abc5252b8fd349c60227ba9207341ae8) | [0xf64032d060…5783092c](https://basescan.org/tx/0xf64032d0608fff21039bdad8b93058d34cd2225f69ea1033aaeb7eb15783092c) |

For CCTP, expected Base USDC is the source burn minus Circle's executed fee. The fees were **0.072914 USDC** for S01 and **0.059552 USDC** for S04. For NEAR, expected Base USDC is the provider's reported settled output. Each received amount was checked against the canonical Base USDC transfer log.

| Provider | Transfers | Stellar USDC sent | Base USDC received |
| --- | ---: | ---: | ---: |
| CCTP | 2 | 5.0000000 | 4.867534 |
| NEAR | 2 | 6.0000000 | 5.993988 |
| **Total** | **4** | **11.0000000** | **10.861522** |

The [Stellar to Base evidence index](docs/evidence/stellar-base-2026-10-28/transfers.json) links each source transaction to its Base receipt. Each proof includes the successful Stellar transaction, provider linkage, finalized Base receipt and decoded USDC transfer. CCTP proofs also retain the Stellar burn and message events matched to Circle's attestation and the Base message nonce. File hashes are in [Stellar to Base SHA256SUMS](docs/evidence/stellar-base-2026-10-28/SHA256SUMS). These historical rows have no claimed backend ledger match.

### CCTP Arc-to-Stellar testnet transfer

The completed testnet payment used the managed Arc deposit wallet `0x761365291876710283235388724e2a366b8e29a7`.

| ID | Source time (UTC) | Test USDC burned | Expected test USDC | Received test USDC | Difference | Arc transaction | Stellar transaction |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| [T01](docs/evidence/live-transfers-2026-10-28/proofs/T01.json) | 2026-10-28 11:25:14 | 1.000000 | 1.0000000 | 1.0000000 | 0.0000000 | [0xc1abe21747…3edab566](https://explorer.testnet.arc.io/tx/0xc1abe217470db81c193813fdb209e3b7e64b12e037e85038a29c31183edab566) | [ab1464aebf15…e296fad9](https://stellar.expert/explorer/testnet/tx/ab1464aebf1532fba2d421dcbb5d85ee0b22dabd3d5dc6bc1da290ffe296fad9) |

### Live backend record comparison

| Live row | Backend transaction ID | Backend status | Recorded credit (USDC) | On-chain receipt (USDC) | Difference |
| --- | --- | --- | ---: | ---: | ---: |
| L12 | `1b8133e8-bbda-49eb-9498-b99fe1b87175` | COMPLETED | 1.0000000 | 1.0000000 | 0.0000000 |
| T01 | `c36d2f20-1809-4d7c-8bdd-a4b32c8e6ca8` | COMPLETED | 1.0000000 | 1.0000000 | 0.0000000 |

The current backend completion and credit records match the two rows above. C01 and C02 are linked to Catlog payment records by their `CLGPAY` references (see the checkout table). The remaining historical wallet transfers are included as blockchain evidence, with no backend ledger entry asserted for those rows.

### Public verification evidence

The [Stellar-bound live transfer index](docs/evidence/live-transfers-2026-10-28/transfers.json) contains full transaction hashes, recipients, canonical asset identifiers, source block finality, received amounts and backend matches. Each linked row retains its public RPC receipt, provider response, Horizon transaction and Stellar Expert transaction metadata. File hashes are listed in [SHA256SUMS](docs/evidence/live-transfers-2026-10-28/SHA256SUMS).

The [Polygon → Base proof](docs/evidence/polygon-base-2026-10-28/transfer.json) additionally retains the finalized Polygon and Base receipts, the native POL transfer, the matching provider response and the decoded Base USDC transfer. Its checksum is in [Polygon → Base SHA256SUMS](docs/evidence/polygon-base-2026-10-28/SHA256SUMS).

For the Stellar-bound records, verification checked successful source receipts on the expected chain, canonical USDC transfer logs from the recorded sender, source block finality, and the corresponding successful Stellar transaction. Stellar envelopes were hashed with the network passphrase, and received amounts were decoded from events emitted by the canonical USDC contract. CCTP source-message fields were matched to Circle's attested message and its nonce in the destination transaction; NEAR source/destination hashes and amounts were matched to 1Click status.

## Automated test run and evidence

| Field | Recorded value |
| --- | --- |
| Workflow | [Catlog backend API tests, run 42198221579](https://github.com/catlog-shop/catlog-transaction-tests/actions/runs/42198221579) — successful |
| Test source revision | [`bc5b3a8029c369364f44b14e9eb60759ecd540af`](https://github.com/catlog-shop/catlog-transaction-tests/commit/bc5b3a8029c369364f44b14e9eb60759ecd540af) |
| Backend revision reported at run start | `c5d7a7d7d91b41fef28c9ae493d9a3eb0b76df7d` |
| Test run ID | `catlog-2026-11-06T09-52-00.962Z-411ae538` |
| Full run started, UTC | `2026-11-06T09:52:00.963Z` |
| Full run finished, UTC | `2026-11-06T09:54:23.712Z` |
| Full run, WAT (UTC+1) | 6 November 2026, 10:52:00–10:54:23 |
| Full run elapsed time | 142.749 seconds |
| Backend origin | https://catlog-backend.throbbing-cloud-0f8e.workers.dev |
| Execution environment | Cloudflare backend accessed over HTTP |
| Provider responses | Controlled fixtures |
| On-chain transfers in this run | None (`onchainTransfers: false`) |
| Source artifact | `catlog-test-reports`, GitHub artifact ID `13493082541` (retained by GitHub until 4 February 2027) |

The [run summary](docs/evidence/reconciliation-2026-11-06/summary.json) and [complete Vitest results](docs/evidence/reconciliation-2026-11-06/results.json) are committed with this report. They are byte-for-byte copies downloaded from the workflow artifact, so the evidence remains available in the repository after that artifact expires. They contain no API keys, session credentials or wallet signing keys.

| Evidence file | SHA-256 |
| --- | --- |
| `summary.json` | `6004248a1c248ace7df92f96b8c754111aef8221915624a3111235cf6657f8ee` |
| `results.json` | `c2726fc2cca89bc856bd4295a8463882606601154f0c66e20b6a243a9fb0b989` |
| `reconciliation-records.json` | `5b5b41cabed376f91139ce1f242d057b7168733adf99853b52f341f66e4961d0` |

The [reconciliation records](docs/evidence/reconciliation-2026-11-06/reconciliation-records.json) retain the captured final ledger, balance and provider records for all 19 cases. Each captured file is identified by its source filename and SHA-256. The tables below were checked against these records.

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

## Automated ledger table

**21 transaction records reconciled: 18 completed credits and 3 failed transactions with no credit. All amount differences are zero.**

Amounts below are destination USDC using the fixture convention of seven decimal places. `Expected net` is gross minus the recorded fee for a completed transaction, and zero for a failed transaction. `Ledger credit` comes from the stored credit row. Each case has an isolated session and the fixture merchant `merchant-one`.

| Case | Route | Transaction ID | Status | Gross | Fee | Expected net | Ledger credit | Difference | Ledger record ID |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| R01 | `cctp.arc-to-stellar` | `ed594d31-9753-4321-bc1f-6b49e978acf3` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `7f88d0e2-e775-4996-93e5-5c1b21a1faff` |
| R02 | `cctp.arc-to-stellar` | `5ca18eab-0142-42ff-9ef4-11607df62984` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `297b9fcd-669b-4c44-bde8-8fe4f5468951` |
| R03 | `cctp.arc-to-stellar` | `a65ffd49-56b5-4bc5-8f93-444bf4ca263e` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `1e5325e4-a3aa-4407-b248-9f1e9d863b92` |
| R04 | `cctp.arc-to-stellar` | `bf9aec11-77f7-4c1f-b64c-4046f9550d45` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `4cf241f5-6505-47ca-9996-d359416a33f4` |
| R05 | `cctp.arc-to-stellar` | `78c6ddbd-2845-4043-8e0c-83d30a58930a` | FAILED | 10.0000000 | — | 0.0000000 | 0.0000000 | 0.0000000 | — |
| R06 | `cctp.arc-to-stellar` | `8b150211-17f7-4a73-8bf9-027da4040dc4` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `f4ee2f04-479a-4722-bccc-24c89fc2850e` |
| R07 | `cctp.stellar-to-arc` | `98f04e37-c425-40dc-9250-31931c410171` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `6a34400e-7cfb-4342-9482-7223452ad768` |
| R08 | `cctp.stellar-to-arc` | `b8150829-975c-424c-9b7c-18fbf7b11e14` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `a19e4ac9-41dd-45ec-8edb-70021fbd5a0c` |
| R09 | `cctp.stellar-to-arc` | `70e06092-f3bc-4650-81ba-7651e213dc0f` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `5b646aa7-7550-4ac7-b143-281d6bac37ee` |
| R10 | `cctp.stellar-to-arc` | `bcd49eb7-1fe8-447b-9f15-70c165c8a5f4` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `3ecb654a-4a6a-4eef-8035-c90f47d6c6a7` |
| R11 | `cctp.stellar-to-arc` | `e59be2a5-60c7-41b3-8ac5-d1e178c676ec` | FAILED | 10.0000000 | — | 0.0000000 | 0.0000000 | 0.0000000 | — |
| R12 | `cctp.stellar-to-arc` | `1d0d49f1-00c3-432a-8964-137b3faffbde` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `899d1bce-1fc2-48dd-8a83-b4c040e57e24` |
| R13 | `near.to-stellar` | `8801bb04-c278-4d74-bde3-7b7e49ea60ef` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `cc3dc8c5-a7b6-489a-8397-8b1af9e182b9` |
| R14 | `near.to-stellar` | `512e3789-e1ad-4336-8524-306222b94279` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `9a421069-dc63-46f9-8c10-8063173e323f` |
| R15 | `near.to-stellar` | `c3ce2ba4-6a31-4d43-8aa2-4b614d33a14a` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `4d356025-a18d-474b-a2f3-8ff0a4bed08a` |
| R16 | `near.to-stellar` | `1b3d21d7-30d3-42b6-bd29-abc8f38830ec` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `783ffe8b-178c-4e55-934e-519996aad1a0` |
| R17 | `near.to-stellar` | `64413f7a-cbb0-4817-90a8-f0082adb024e` | FAILED | 10.0000000 | — | 0.0000000 | 0.0000000 | 0.0000000 | — |
| R18 | `near.to-stellar` | `67249eba-fa5a-466c-8e4f-90fb09d4448c` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `dac8549e-6ea5-4e71-a3e6-98217baa140e` |
| R19-1 | `cctp.arc-to-stellar` | `29f2867e-54b7-47ab-8270-da79d3340ffb` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `949dacb9-5f5f-4bc8-a594-6e60e217a71e` |
| R19-2 | `cctp.stellar-to-arc` | `355cc8f4-fd3c-4ef0-ac65-74d0d77d5911` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `2833f0da-f892-4820-8d27-587ab79274d6` |
| R19-3 | `near.to-stellar` | `af5eadd8-def3-46d7-99a8-7fd7cf62b8d0` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `10758fe2-5519-4d99-a0fe-13e610c66d40` |

### Ledger and balance totals by destination asset

These totals sum the isolated case records. Credit sums were also compared with the stored balance separately for every session and asset.

| Destination asset | Committed credits | Ledger total | Sum of case balances | Difference |
| --- | ---: | ---: | ---: | ---: |
| Stellar USDC | 12 | 118.8000000 | 118.8000000 | 0.0000000 |
| Arc USDC | 6 | 59.4000000 | 59.4000000 | 0.0000000 |

## Automated fixture chain table

| Fixture route | Source chain | Source asset | Destination chain | Destination asset | Source effects | Destination effects |
| --- | --- | --- | --- | --- | ---: | ---: |
| `cctp.arc-to-stellar` | `arc-testnet` | USDC | `stellar-testnet` | USDC | 7 | 6 |
| `cctp.stellar-to-arc` | `stellar-testnet` | USDC | `arc-testnet` | USDC | 7 | 6 |
| `near.to-stellar` | `ethereum-sepolia` | WETH | `stellar-testnet` | USDC | 7 | 6 |

### Source and destination references

References and effect counts come from the recorded controlled-provider transactions. Full provider execution, bridge message and destination event identifiers are retained in `reconciliation-records.json`.

| Case | Transaction ID | Source transaction reference | Destination transaction reference | Source effects | Destination effects |
| --- | --- | --- | --- | ---: | ---: |
| R01 | `ed594d31-9753-4321-bc1f-6b49e978acf3` | `0x6e7a6f31b054427f82f188d3ffe4975c6e7a6f31b054427f82f188d3ffe4975c` | `f21a03c919b64536b5db091255f87f51f21a03c919b64536b5db091255f87f51` | 1 | 1 |
| R02 | `5ca18eab-0142-42ff-9ef4-11607df62984` | `0xdfd7efd39fdd4f59af16dabd5af06525dfd7efd39fdd4f59af16dabd5af06525` | `6dd7f7b7f75b4a8caa5f15cd8a27ee606dd7f7b7f75b4a8caa5f15cd8a27ee60` | 1 | 1 |
| R03 | `a65ffd49-56b5-4bc5-8f93-444bf4ca263e` | `0x192c8e3e8957499c870fc3399fe98441192c8e3e8957499c870fc3399fe98441` | `b96c174fb00641bd8cc2a2b54549d214b96c174fb00641bd8cc2a2b54549d214` | 1 | 1 |
| R04 | `bf9aec11-77f7-4c1f-b64c-4046f9550d45` | `0x839d8441073945888a523fe3ddb5b9f2839d8441073945888a523fe3ddb5b9f2` | `1a160a7f224b48818398d4026ecaa2501a160a7f224b48818398d4026ecaa250` | 1 | 1 |
| R05 | `78c6ddbd-2845-4043-8e0c-83d30a58930a` | `0x7b46c61ceb9a4a38bdcdf265f1bce1a27b46c61ceb9a4a38bdcdf265f1bce1a2` | — | 1 | 0 |
| R06 | `8b150211-17f7-4a73-8bf9-027da4040dc4` | `0xad9fd18098034b61992cc6197828e55ead9fd18098034b61992cc6197828e55e` | `150d63a702764d7487029200590fda7a150d63a702764d7487029200590fda7a` | 1 | 1 |
| R07 | `98f04e37-c425-40dc-9250-31931c410171` | `3c134c8e527e4916b5c897601b87c4be3c134c8e527e4916b5c897601b87c4be` | `0x0faad22d1b5045d5be4813f21c4f79ae0faad22d1b5045d5be4813f21c4f79ae` | 1 | 1 |
| R08 | `b8150829-975c-424c-9b7c-18fbf7b11e14` | `aebc6c26d54f4b67b50ef4810b5e48a1aebc6c26d54f4b67b50ef4810b5e48a1` | `0x8635cfca09d14695b8e5ada2d6fe74638635cfca09d14695b8e5ada2d6fe7463` | 1 | 1 |
| R09 | `70e06092-f3bc-4650-81ba-7651e213dc0f` | `be95d4b1d6794b138fb3d937d04c8dcebe95d4b1d6794b138fb3d937d04c8dce` | `0xd44bb2684135482188b3ce938b84b41ed44bb2684135482188b3ce938b84b41e` | 1 | 1 |
| R10 | `bcd49eb7-1fe8-447b-9f15-70c165c8a5f4` | `5dea3e8b69b24370ac369ebfbc1339d65dea3e8b69b24370ac369ebfbc1339d6` | `0xbb6d948f8f1d486ea941366044840fc0bb6d948f8f1d486ea941366044840fc0` | 1 | 1 |
| R11 | `e59be2a5-60c7-41b3-8ac5-d1e178c676ec` | `3537f222eeab4eb9a2e78d9b6a581f6e3537f222eeab4eb9a2e78d9b6a581f6e` | — | 1 | 0 |
| R12 | `1d0d49f1-00c3-432a-8964-137b3faffbde` | `e713406206d64dcf85f291484780407de713406206d64dcf85f291484780407d` | `0xe5be79d11c3e47fb887103b6ee069046e5be79d11c3e47fb887103b6ee069046` | 1 | 1 |
| R13 | `8801bb04-c278-4d74-bde3-7b7e49ea60ef` | `e4d069483536409f9cafa791af6c3b1fe4d069483536409f9cafa791af6c3b1f` | `733a921f95dc40afaae2b05c00cdb655733a921f95dc40afaae2b05c00cdb655` | 1 | 1 |
| R14 | `512e3789-e1ad-4336-8524-306222b94279` | `07234cf6fa634381804a4f4ef16dab5407234cf6fa634381804a4f4ef16dab54` | `c10bc09af2414abdbf25d3f58823cf11c10bc09af2414abdbf25d3f58823cf11` | 1 | 1 |
| R15 | `c3ce2ba4-6a31-4d43-8aa2-4b614d33a14a` | `963f8b2ab80a472585419a4e0503edd5963f8b2ab80a472585419a4e0503edd5` | `a3e67165af8b4f37906e83604e3395e7a3e67165af8b4f37906e83604e3395e7` | 1 | 1 |
| R16 | `1b3d21d7-30d3-42b6-bd29-abc8f38830ec` | `f8e042b942384bceb9d55dbc5d653c16f8e042b942384bceb9d55dbc5d653c16` | `599965dfc9a54b2f8702cae26e1b0a9b599965dfc9a54b2f8702cae26e1b0a9b` | 1 | 1 |
| R17 | `64413f7a-cbb0-4817-90a8-f0082adb024e` | `df1ef54287624c17b43ff873e7d71f94df1ef54287624c17b43ff873e7d71f94` | — | 1 | 0 |
| R18 | `67249eba-fa5a-466c-8e4f-90fb09d4448c` | `206c6fbc66144e1eb622e86385ee4b5f206c6fbc66144e1eb622e86385ee4b5f` | `c765618164134865b1fe7d4c426bd433c765618164134865b1fe7d4c426bd433` | 1 | 1 |
| R19-1 | `29f2867e-54b7-47ab-8270-da79d3340ffb` | `0xf746817b3c61431dacc6e80a7e4fda04f746817b3c61431dacc6e80a7e4fda04` | `0da0b9b89d704e028e9c4d787d1a5ac50da0b9b89d704e028e9c4d787d1a5ac5` | 1 | 1 |
| R19-2 | `355cc8f4-fd3c-4ef0-ac65-74d0d77d5911` | `9ade50fa56b5485d8175f9846cd678e19ade50fa56b5485d8175f9846cd678e1` | `0x89cec2267b604f47983012807bd2901189cec2267b604f47983012807bd29011` | 1 | 1 |
| R19-3 | `af5eadd8-def3-46d7-99a8-7fd7cf62b8d0` | `f3613c3b3b7f4f29a4c0c0ab1d1dac32f3613c3b3b7f4f29a4c0c0ab1d1dac32` | `795935f686844c149f61548a7d00cf5e795935f686844c149f61548a7d00cf5e` | 1 | 1 |

R19-1, R19-2 and R19-3 are the three transfers in the single global scanner case. A failed transaction has no destination reference and no committed ledger credit.

## Conditions checked

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
| R01 | `cctp.arc-to-stellar` | recovers an accepted transfer after a lost response and worker restart without another source transfer | PASS | 4.127 |
| R02 | `cctp.arc-to-stellar` | finds a completed transfer whose webhook was missed using only the global scanner | PASS | 2.032 |
| R03 | `cctp.arc-to-stellar` | keeps an accepted source transfer pending until the destination completes without submitting another source transfer | PASS | 2.020 |
| R04 | `cctp.arc-to-stellar` | commits one settlement when duplicate completion webhooks race a reconciliation worker | PASS | 1.731 |
| R05 | `cctp.arc-to-stellar` | does not regress a confirmed terminal failure when a later lookup reports pending | PASS | 2.041 |
| R06 | `cctp.arc-to-stellar` | preserves completed status, destination identifiers and the ledger settlement after a later pending observation | PASS | 1.947 |
| R07 | `cctp.stellar-to-arc` | recovers an accepted transfer after a lost response and worker restart without another source transfer | PASS | 2.277 |
| R08 | `cctp.stellar-to-arc` | finds a completed transfer whose webhook was missed using only the global scanner | PASS | 1.910 |
| R09 | `cctp.stellar-to-arc` | keeps an accepted source transfer pending until the destination completes without submitting another source transfer | PASS | 3.139 |
| R10 | `cctp.stellar-to-arc` | commits one settlement when duplicate completion webhooks race a reconciliation worker | PASS | 1.653 |
| R11 | `cctp.stellar-to-arc` | does not regress a confirmed terminal failure when a later lookup reports pending | PASS | 2.178 |
| R12 | `cctp.stellar-to-arc` | preserves completed status, destination identifiers and the ledger settlement after a later pending observation | PASS | 2.081 |
| R13 | `near.to-stellar` | recovers an accepted transfer after a lost response and worker restart without another source transfer | PASS | 1.986 |
| R14 | `near.to-stellar` | finds a completed transfer whose webhook was missed using only the global scanner | PASS | 1.669 |
| R15 | `near.to-stellar` | keeps an accepted source transfer pending until the destination completes without submitting another source transfer | PASS | 2.783 |
| R16 | `near.to-stellar` | commits one settlement when duplicate completion webhooks race a reconciliation worker | PASS | 1.533 |
| R17 | `near.to-stellar` | does not regress a confirmed terminal failure when a later lookup reports pending | PASS | 2.229 |
| R18 | `near.to-stellar` | preserves completed status, destination identifiers and the ledger settlement after a later pending observation | PASS | 1.505 |
| R19 | `all routes` | one global scanner pass discovers and settles missed completions across every required route | PASS | 2.493 |

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

The restricted API key and hosted backend URL are sufficient. Each new run saves `summary.json`, `results.json` and `junit.xml` under a fresh ignored `reports/catlog-.../` directory. Its `reconciliation/` subfolder retains the final transaction, ledger-credit, balance and provider records for each reconciliation case. A focused run is labelled as a subset. A new run may report a different backend revision or result; this committed report remains a snapshot of the workflow identified above.

## Appendix: additional Base-bound receipts

These transfers deliver USDC to Base rather than Stellar. They are not required by the Tranche 2 deliverables and are kept here as supplementary evidence of the same wallet's bridge activity.

### Ethereum to Base receipts

All six transfers were paid from `0xBeA94bAA9B17De76a1dA7B9070aa2A86c4706117` on Ethereum and received as canonical USDC at the same address on Base. The CCTP source payments used USDC; the NEAR source payments used USDT.

Checked on 28 October 2026 at 22:02:41 UTC (23:02:41 WAT).

| ID | Route | Source time (UTC) | Source payment | Expected Base USDC | Received Base USDC | Difference | Ethereum source receipt | Base receiving receipt |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| [E01](docs/evidence/ethereum-base-2026-10-28/proofs/E01.json) | CCTP v2 | 2026-09-20 13:57:47 | 2.000000 USDC | 1.944862 | 1.944862 | 0.000000 | [0x86f7758100…d0167570](https://etherscan.io/tx/0x86f77581007f9dfc9f083bf51a4d3431c900f15ecd3f6f806d9f0279d0167570) | [0xcd30d31b3b…f24d88ec](https://basescan.org/tx/0xcd30d31b3bbd514da48d35139affae4e83d82b50f77eb264143cdbddf24d88ec) |
| [E02](docs/evidence/ethereum-base-2026-10-28/proofs/E02.json) | Allbridge CCTP v1 | 2026-09-20 13:58:23 | 2.000000 USDC | 1.694931 | 1.694931 | 0.000000 | [0x01ec3f4fe7…a36ea205](https://etherscan.io/tx/0x01ec3f4fe797778b6f78636ed5285c8c48c5a943d62fef9d10232fa6a36ea205) | [0x4af3643deb…dc17d801](https://basescan.org/tx/0x4af3643deb22287af200c08df7eebccfd193720f8c346df08cc1a14edc17d801) |
| [E03](docs/evidence/ethereum-base-2026-10-28/proofs/E03.json) | NEAR 1Click | 2026-09-25 20:13:47 | 5.000000 USDT | 4.996439 | 4.996439 | 0.000000 | [0xabe194d7ee…a8e033e5](https://etherscan.io/tx/0xabe194d7eeb1843f2a2fc3dda908a3a83ae389f5b55f5ca33c85b0caa8e033e5) | [0xb84b07d97c…0803c3b4](https://basescan.org/tx/0xb84b07d97cf4adadc7c95cf2de9ac6d82df1e60b20ad470b0ad1c26a0803c3b4) |
| [E04](docs/evidence/ethereum-base-2026-10-28/proofs/E04.json) | NEAR 1Click | 2026-09-25 20:23:23 | 10.000000 USDT | 9.995315 | 9.995315 | 0.000000 | [0x9a9b244cdc…d09b285d](https://etherscan.io/tx/0x9a9b244cdc5996a961fb04cccea55fa2e847afc2173666cfd7130b2ed09b285d) | [0x25018c558d…12b9eeb2](https://basescan.org/tx/0x25018c558d070a4b0e97b23576e563de12f84db534546970d587969212b9eeb2) |
| [E05](docs/evidence/ethereum-base-2026-10-28/proofs/E05.json) | Allbridge CCTP v1 | 2026-09-30 12:40:35 | 2.000000 USDC | 1.664623 | 1.664623 | 0.000000 | [0xdd386633e8…f7b088e9](https://etherscan.io/tx/0xdd386633e80732594ea9924edbad1d4ebb72efa3ace3707f2f13580af7b088e9) | [0xee4d53763d…6884a916](https://basescan.org/tx/0xee4d53763dacdd76cf10ec898a1153548658eef52ed2626b9ffcb8a16884a916) |
| [E06](docs/evidence/ethereum-base-2026-10-28/proofs/E06.json) | NEAR 1Click | 2026-09-30 13:30:35 | 5.000000 USDT | 4.994970 | 4.994970 | 0.000000 | [0x8667783021…80dbb6b2](https://etherscan.io/tx/0x8667783021840a6137b6a0bc5bd2dc67a392631e31f8c0fe097cc35d80dbb6b2) | [0x4eacfa93de…29e0cdd1](https://basescan.org/tx/0x4eacfa93ded8ae737b1654d5c0476e20a31f974594ca781e6e8f860929e0cdd1) |

For Allbridge CCTP v1, expected Base USDC equals the amount in Circle's attested burn message: **1.694931 USDC** and **1.664623 USDC**, following source payments of 2 USDC each. The reductions before the CCTP burns were **0.305069 USDC** and **0.335377 USDC**. For the direct CCTP v2 transfer, the 2 USDC burn executed a **0.055138 USDC** fee and delivered **1.944862 USDC**. For NEAR, expected Base USDC is the provider's reported settled output. Every destination amount was checked against its Base USDC transfer log.

| Provider | Source asset | Transfers | Source amount | Base USDC received |
| --- | --- | ---: | ---: | ---: |
| CCTP | USDC | 3 | 6.000000 | 5.304416 |
| NEAR | USDT | 3 | 20.000000 | 19.986724 |
| **Total receipts** | | **6** | | **25.291140** |

The [Ethereum to Base evidence index](docs/evidence/ethereum-base-2026-10-28/transfers.json) retains full hashes and links to each proof. Each proof includes successful, finalized Ethereum and Base receipts, canonical token transfer logs and the Circle attestation or NEAR completion record linking the pair. File hashes are in [Ethereum to Base SHA256SUMS](docs/evidence/ethereum-base-2026-10-28/SHA256SUMS). These historical rows have no claimed backend ledger match.

### Polygon → Base NEAR receipt

This payment used native POL on Polygon and received canonical USDC on Base. The provider's completed record links the two transaction hashes.

| ID | Source receipt | Source amount | Base receipt | Expected Base USDC | Received Base USDC | Difference |
| --- | --- | ---: | --- | ---: | ---: | ---: |
| [P01](docs/evidence/polygon-base-2026-10-28/transfer.json) | [Polygon: 0xd2682e51f0a8…387a1c70](https://polygonscan.com/tx/0xd2682e51f0a8b0810e27d3a75b622e45df472b66265ddd28013aaaf1387a1c70) | 8.2 POL | [Base: 0x48ee100cf25c…666d539e](https://basescan.org/tx/0x48ee100cf25c70266c9a941f93c960a904dd929aeac1b8b28c070bbb666d539e) | 0.977244 | 0.977244 | 0.000000 |

- Source wallet and Base recipient: `0xBeA94bAA9B17De76a1dA7B9070aa2A86c4706117`.
- Source confirmed: **30 September 2026, 13:22:57 UTC**; Base receipt confirmed: **13:23:21 UTC**.
- Polygon chain ID: `137`; Base chain ID: `8453`. Both blocks were finalized when checked.
- Base USDC contract: `0x833589fcd6edb6e08f4c7c32d4f71b54bda02913`; receipt transfer log index: `922`.
- Provider: NEAR 1Click, status `SUCCESS`. This historical row has no claimed backend ledger match.
