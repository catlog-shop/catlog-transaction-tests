# Catlog reconciliation report

**Result: 19 reconciliation cases passed, 0 failed, 0 skipped.** The complete backend acceptance run passed all 71 cases.

This report combines the 28 October 2026 automated test results with blockchain transactions verified on 28 October 2026.

## Verified blockchain transactions

**23 mainnet transfers and 1 CCTP testnet transfer verified. All 24 destination amounts matched their provider output or CCTP net amount.**

Stellar-bound evidence checked on 28 October 2026 at 21:12:47 UTC (22:12:47 WAT). The Polygon → Base receipt was additionally checked at 21:46:47 UTC (22:46:47 WAT).

Recorded EVM wallet: [`0xBeA94bAA9B17De76a1dA7B9070aa2A86c4706117`](https://etherscan.io/address/0xBeA94bAA9B17De76a1dA7B9070aa2A86c4706117) — [Ethereum token history](https://etherscan.io/tokentxns?a=0xBeA94bAA9B17De76a1dA7B9070aa2A86c4706117) · [Base token history](https://basescan.org/tokentxns?a=0xBeA94bAA9B17De76a1dA7B9070aa2A86c4706117). Both displayed pages of token history were inspected on Ethereum and Base. The first table covers transfers matched to Stellar USDC receipts; the additional Ethereum → Base, Polygon → Base and Stellar → Base receipts appear below.

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

The current backend completion and credit records match the two rows above. The historical wallet transfers are included as blockchain evidence, with no backend ledger entry asserted for those historical rows.

### Public verification evidence

The [Stellar-bound live transfer index](docs/evidence/live-transfers-2026-10-28/transfers.json) contains full transaction hashes, recipients, canonical asset identifiers, source block finality, received amounts and backend matches. Each linked row retains its public RPC receipt, provider response, Horizon transaction and Stellar Expert transaction metadata. File hashes are listed in [SHA256SUMS](docs/evidence/live-transfers-2026-10-28/SHA256SUMS).

The [Polygon → Base proof](docs/evidence/polygon-base-2026-10-28/transfer.json) additionally retains the finalized Polygon and Base receipts, the native POL transfer, the matching provider response and the decoded Base USDC transfer. Its checksum is in [Polygon → Base SHA256SUMS](docs/evidence/polygon-base-2026-10-28/SHA256SUMS).

For the Stellar-bound records, verification checked successful source receipts on the expected chain, canonical USDC transfer logs from the recorded sender, source block finality, and the corresponding successful Stellar transaction. Stellar envelopes were hashed with the network passphrase, and received amounts were decoded from events emitted by the canonical USDC contract. CCTP source-message fields were matched to Circle's attested message and its nonce in the destination transaction; NEAR source/destination hashes and amounts were matched to 1Click status.

## Automated test run and evidence

| Field | Recorded value |
| --- | --- |
| Workflow | [Catlog backend API tests](https://github.com/catlog-shop/catlog-transaction-tests/actions/workflows/backend-tests.yml) — successful |
| Test source revision | [`ee64ee0490f5b4fb7bb3e1e7b6534ea4f0a58bd4`](https://github.com/catlog-shop/catlog-transaction-tests/commit/ee64ee0490f5b4fb7bb3e1e7b6534ea4f0a58bd4) |
| Backend revision reported at run start | `43f3b3faa3e37641c7a1b4ce9170fe80410e92d9` |
| Test run ID | `catlog-2026-10-28T20-56-52.630Z-3e295b3e` |
| Full run started, UTC | `2026-10-28T20:56:52.631Z` |
| Full run finished, UTC | `2026-10-28T21:00:02.613Z` |
| Full run, WAT (UTC+1) | 28 October 2026, 21:56:52–22:00:02 |
| Full run elapsed time | 189.982 seconds |
| Backend origin | https://catlog-backend.throbbing-cloud-0f8e.workers.dev |
| Execution environment | Cloudflare backend accessed over HTTP |
| Provider responses | Controlled fixtures |
| On-chain transfers in this run | None (`onchainTransfers: false`) |
| Source artifact | `catlog-test-reports`, GitHub artifact ID `12850643664` |

The [run summary](docs/evidence/reconciliation-2026-10-28/summary.json) and [complete Vitest results](docs/evidence/reconciliation-2026-10-28/results.json) are committed with this report. They are byte-for-byte copies downloaded from the workflow artifact, so the evidence remains available in the repository after that artifact expires. They contain no API keys, session credentials or wallet signing keys.

| Evidence file | SHA-256 |
| --- | --- |
| `summary.json` | `09d821eabc239bae11f962d55f32dffacf74283bfcb8de7153ec077b675e4a8f` |
| `results.json` | `503676350440ac89b4bc5bacbb6c1082b85940b74383468de543ef6130daacb8` |
| `reconciliation-records.json` | `bebaa50a4c6f6d02956765c26e2bb258d6372f46c0bdf628410dc06bc6ee5035` |

The [reconciliation records](docs/evidence/reconciliation-2026-10-28/reconciliation-records.json) retain the captured final ledger, balance and provider records for all 19 cases. Each captured file is identified by its source filename and SHA-256. The tables below were checked against these records.

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
| R01 | `cctp.arc-to-stellar` | `90ef84c6-5350-4f10-8b42-712d9d3a4b94` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `548151a4-0861-4cfd-a45c-c049612e93fa` |
| R02 | `cctp.arc-to-stellar` | `5712f340-900a-4910-8377-74edd8df7306` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `4b9596a7-6228-4eb8-99c3-a62ae23151cd` |
| R03 | `cctp.arc-to-stellar` | `3f0eca15-7f44-40d2-85b8-4a7a7a4eade6` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `977b5559-a373-474a-8bbc-19afe08a8925` |
| R04 | `cctp.arc-to-stellar` | `70db7af9-a0e7-4129-8e0f-0f0e4bf15291` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `4ecd53db-eb21-49b9-b88c-7d8c609042ab` |
| R05 | `cctp.arc-to-stellar` | `ab35df90-d9c6-4fd7-8e81-a169f826beaf` | FAILED | 10.0000000 | — | 0.0000000 | 0.0000000 | 0.0000000 | — |
| R06 | `cctp.arc-to-stellar` | `af79ab8e-ea81-4991-8952-a7872fa0422b` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `99419e28-d8f7-4355-948a-cbfddf083b70` |
| R07 | `cctp.stellar-to-arc` | `3450808c-f80a-4856-a116-e815c661bd4e` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `a9988419-5b31-4703-9982-97bc30271619` |
| R08 | `cctp.stellar-to-arc` | `4c105b6c-27cb-45cc-99ad-b8c9b210c4d4` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `a9b8ed2b-ec3f-4800-a4fa-fba6dcf1af0f` |
| R09 | `cctp.stellar-to-arc` | `8856ab65-5476-45eb-8ced-3875794c9909` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `b0ef352a-f542-4978-83f8-2fc212eda075` |
| R10 | `cctp.stellar-to-arc` | `5c33d277-cbb6-449a-bd35-a40205806a73` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `db8b30c1-18e1-4c19-b442-6de1ba9e573e` |
| R11 | `cctp.stellar-to-arc` | `5e9c9bd9-9821-4588-8be5-33b57d9b8721` | FAILED | 10.0000000 | — | 0.0000000 | 0.0000000 | 0.0000000 | — |
| R12 | `cctp.stellar-to-arc` | `62a27267-1c91-45df-9c6e-75b57a3fa703` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `f838c74f-a577-44da-b5e6-e9201ad784d3` |
| R13 | `near.to-stellar` | `019429c7-5b95-4b36-b9f0-9663d070dcbf` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `742ad1d9-d2c2-4087-81f4-e318d0cfa614` |
| R14 | `near.to-stellar` | `46f3a352-193e-454c-a2d8-3541d782154f` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `2e0c4dad-d077-4157-9c73-5a5e428c2831` |
| R15 | `near.to-stellar` | `d7084be6-9a4c-4a24-a930-1680d7fe21ca` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `33815973-8a87-493c-a35e-ee74b5bf6644` |
| R16 | `near.to-stellar` | `d7ff5621-0802-4082-927d-4a01cd36e375` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `fa490bf9-b3b7-48fe-88a2-9efd8e4a4951` |
| R17 | `near.to-stellar` | `aaf5e16b-3bec-446c-aeb7-bf450b365593` | FAILED | 10.0000000 | — | 0.0000000 | 0.0000000 | 0.0000000 | — |
| R18 | `near.to-stellar` | `e5ca6b89-e1cc-426f-af6a-87cae638ab48` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `d0d2252f-39ae-4e1f-8847-1b74f2b93fc9` |
| R19-1 | `cctp.stellar-to-arc` | `54b316e1-53b0-4b0f-9f1b-78e07a815915` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `261d328a-d39e-4ada-a3d5-0c0b76614f1d` |
| R19-2 | `near.to-stellar` | `7e6292db-62ae-46a9-af78-e37a1bae6634` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `2f48444b-0ec7-4d10-ad27-4361704b6760` |
| R19-3 | `cctp.arc-to-stellar` | `d9c49c4f-4e24-4de8-8c30-cd108732ad9a` | COMPLETED | 10.0000000 | 0.1000000 | 9.9000000 | 9.9000000 | 0.0000000 | `467a382f-fa0b-409a-8d90-ec203630734e` |

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
| R01 | `90ef84c6-5350-4f10-8b42-712d9d3a4b94` | `0x73d34d0443204c59964a892152fa26ed73d34d0443204c59964a892152fa26ed` | `3717555fec534571b9e18c3be565e97e3717555fec534571b9e18c3be565e97e` | 1 | 1 |
| R02 | `5712f340-900a-4910-8377-74edd8df7306` | `0xc4ec0a34ce3c4ac489dc9676163eac70c4ec0a34ce3c4ac489dc9676163eac70` | `3a0db8ef86324cfc9a85d2de4486e2973a0db8ef86324cfc9a85d2de4486e297` | 1 | 1 |
| R03 | `3f0eca15-7f44-40d2-85b8-4a7a7a4eade6` | `0xf7d4e61767c340c3a4b20787c1c3ec40f7d4e61767c340c3a4b20787c1c3ec40` | `e48e6655e2fc48678c4d8895a368de74e48e6655e2fc48678c4d8895a368de74` | 1 | 1 |
| R04 | `70db7af9-a0e7-4129-8e0f-0f0e4bf15291` | `0x810a98cb33734731b3f3633d19932d2b810a98cb33734731b3f3633d19932d2b` | `40e29375872e4902b057c6c0dcac803340e29375872e4902b057c6c0dcac8033` | 1 | 1 |
| R05 | `ab35df90-d9c6-4fd7-8e81-a169f826beaf` | `0xbfc1156c48c14d2fa74eb795edf91bb1bfc1156c48c14d2fa74eb795edf91bb1` | — | 1 | 0 |
| R06 | `af79ab8e-ea81-4991-8952-a7872fa0422b` | `0xd67b135993f64111833cac75a92a2806d67b135993f64111833cac75a92a2806` | `6bef09992dff43d9b484c4d12f75af6f6bef09992dff43d9b484c4d12f75af6f` | 1 | 1 |
| R07 | `3450808c-f80a-4856-a116-e815c661bd4e` | `943de20ffacf4f1695d3fc3f46028eab943de20ffacf4f1695d3fc3f46028eab` | `0x9ad2901daf604fddbdc0aba5def868c59ad2901daf604fddbdc0aba5def868c5` | 1 | 1 |
| R08 | `4c105b6c-27cb-45cc-99ad-b8c9b210c4d4` | `154eb34162b94c4ea827f7b914b9c335154eb34162b94c4ea827f7b914b9c335` | `0x5ab92bf6b27a467db0263be496ba5d555ab92bf6b27a467db0263be496ba5d55` | 1 | 1 |
| R09 | `8856ab65-5476-45eb-8ced-3875794c9909` | `a2600c820f9f43988207d1ffb66a980ba2600c820f9f43988207d1ffb66a980b` | `0x5b61da15336b47f19b993aeb6fedd3025b61da15336b47f19b993aeb6fedd302` | 1 | 1 |
| R10 | `5c33d277-cbb6-449a-bd35-a40205806a73` | `53efbbca2caa473f9933edbb85fd8d7653efbbca2caa473f9933edbb85fd8d76` | `0x3714d77ab80b4312bdbaae0615024bd93714d77ab80b4312bdbaae0615024bd9` | 1 | 1 |
| R11 | `5e9c9bd9-9821-4588-8be5-33b57d9b8721` | `b07b11050cab472b93cde9bf6b3ce8acb07b11050cab472b93cde9bf6b3ce8ac` | — | 1 | 0 |
| R12 | `62a27267-1c91-45df-9c6e-75b57a3fa703` | `e39836ba5868487d854d22b12ddc1a9ce39836ba5868487d854d22b12ddc1a9c` | `0x74c95bd3ee8d40ae8607dd8886ca04e374c95bd3ee8d40ae8607dd8886ca04e3` | 1 | 1 |
| R13 | `019429c7-5b95-4b36-b9f0-9663d070dcbf` | `93f889143fd84f439788fd525800029c93f889143fd84f439788fd525800029c` | `22b2787c705a45cea676f02dd5732f3d22b2787c705a45cea676f02dd5732f3d` | 1 | 1 |
| R14 | `46f3a352-193e-454c-a2d8-3541d782154f` | `b3d399c3e8d14d5b99253e78eaf13741b3d399c3e8d14d5b99253e78eaf13741` | `374b2cd9b608471d8d14dabc9d7d71fb374b2cd9b608471d8d14dabc9d7d71fb` | 1 | 1 |
| R15 | `d7084be6-9a4c-4a24-a930-1680d7fe21ca` | `7b8095b914a64fada19a707e558099387b8095b914a64fada19a707e55809938` | `35b7d5214d4349f4a7ea9fe7e92bbd9a35b7d5214d4349f4a7ea9fe7e92bbd9a` | 1 | 1 |
| R16 | `d7ff5621-0802-4082-927d-4a01cd36e375` | `dd81ca2bc610444bb98455b292a33b46dd81ca2bc610444bb98455b292a33b46` | `16ba178c05da4466bd04e45cbbdb931716ba178c05da4466bd04e45cbbdb9317` | 1 | 1 |
| R17 | `aaf5e16b-3bec-446c-aeb7-bf450b365593` | `4fa476b4db3f4935b81987c0800d0cdc4fa476b4db3f4935b81987c0800d0cdc` | — | 1 | 0 |
| R18 | `e5ca6b89-e1cc-426f-af6a-87cae638ab48` | `d597d3aacca248d391b9cc6cb29e26e6d597d3aacca248d391b9cc6cb29e26e6` | `f3d022f4190845fd929df01e41faec25f3d022f4190845fd929df01e41faec25` | 1 | 1 |
| R19-1 | `54b316e1-53b0-4b0f-9f1b-78e07a815915` | `143b587dd9034a40827a9d68adcf393d143b587dd9034a40827a9d68adcf393d` | `0x9a91641f63c142ae9b954353621a1e4c9a91641f63c142ae9b954353621a1e4c` | 1 | 1 |
| R19-2 | `7e6292db-62ae-46a9-af78-e37a1bae6634` | `23507703f1684d0891058a3ab3d36a3223507703f1684d0891058a3ab3d36a32` | `67f95203444f4033a96fa4fc2b68191167f95203444f4033a96fa4fc2b681911` | 1 | 1 |
| R19-3 | `d9c49c4f-4e24-4de8-8c30-cd108732ad9a` | `0x2207602d554942d89e201e86497c6d992207602d554942d89e201e86497c6d99` | `46907de56ce542529f1a72a1e130387046907de56ce542529f1a72a1e1303870` | 1 | 1 |

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
| R01 | `cctp.arc-to-stellar` | recovers an accepted transfer after a lost response and worker restart without another source transfer | PASS | 3.352 |
| R02 | `cctp.arc-to-stellar` | finds a completed transfer whose webhook was missed using only the global scanner | PASS | 2.156 |
| R03 | `cctp.arc-to-stellar` | keeps an accepted source transfer pending until the destination completes without submitting another source transfer | PASS | 2.991 |
| R04 | `cctp.arc-to-stellar` | commits one settlement when duplicate completion webhooks race a reconciliation worker | PASS | 2.275 |
| R05 | `cctp.arc-to-stellar` | does not regress a confirmed terminal failure when a later lookup reports pending | PASS | 2.468 |
| R06 | `cctp.arc-to-stellar` | preserves completed status, destination identifiers and the ledger settlement after a later pending observation | PASS | 2.790 |
| R07 | `cctp.stellar-to-arc` | recovers an accepted transfer after a lost response and worker restart without another source transfer | PASS | 2.952 |
| R08 | `cctp.stellar-to-arc` | finds a completed transfer whose webhook was missed using only the global scanner | PASS | 2.314 |
| R09 | `cctp.stellar-to-arc` | keeps an accepted source transfer pending until the destination completes without submitting another source transfer | PASS | 3.540 |
| R10 | `cctp.stellar-to-arc` | commits one settlement when duplicate completion webhooks race a reconciliation worker | PASS | 2.530 |
| R11 | `cctp.stellar-to-arc` | does not regress a confirmed terminal failure when a later lookup reports pending | PASS | 2.227 |
| R12 | `cctp.stellar-to-arc` | preserves completed status, destination identifiers and the ledger settlement after a later pending observation | PASS | 2.308 |
| R13 | `near.to-stellar` | recovers an accepted transfer after a lost response and worker restart without another source transfer | PASS | 3.894 |
| R14 | `near.to-stellar` | finds a completed transfer whose webhook was missed using only the global scanner | PASS | 2.134 |
| R15 | `near.to-stellar` | keeps an accepted source transfer pending until the destination completes without submitting another source transfer | PASS | 3.078 |
| R16 | `near.to-stellar` | commits one settlement when duplicate completion webhooks race a reconciliation worker | PASS | 2.121 |
| R17 | `near.to-stellar` | does not regress a confirmed terminal failure when a later lookup reports pending | PASS | 2.634 |
| R18 | `near.to-stellar` | preserves completed status, destination identifiers and the ledger settlement after a later pending observation | PASS | 2.350 |
| R19 | `all routes` | one global scanner pass discovers and settles missed completions across every required route | PASS | 3.372 |

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
