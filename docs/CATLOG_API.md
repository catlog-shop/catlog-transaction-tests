# Catlog deposit and payment status API

Base URL: `https://catlog-backend.throbbing-cloud-0f8e.workers.dev`

These endpoints prepare real payment sessions independently of the automated
71-case suite. Creating a session does not send funds. NEAR returns a
1Click-generated deposit address; CCTP returns a newly generated Arc testnet
wallet. Both routes deliver USDC to the specified Stellar network.

| Route | `provider` | `sourceChain` | Deposit token/network | Destination |
| --- | --- | --- | --- | --- |
| Ethereum | `near` | `ethereum` | USDC / Ethereum mainnet | USDC / Stellar mainnet |
| Base | `near` | `base` | USDC / Base mainnet | USDC / Stellar mainnet |
| Tron | `near` | `tron` | USDT / Tron mainnet | USDC / Stellar mainnet |
| Arc | `cctp` | `arc` | USDC / Arc testnet | USDC / Stellar testnet |

## Authentication and setup

Creation uses the privately supplied Catlog API key in the `Authorization`
header. Status requests use the returned `sessionToken` in
`x-catlog-session`; the API key alone does not authorize a status request.
Session tokens are private and only authorize their own session. Neither
credential grants backend administration or returns wallet signing keys.

Examples below use a shell, `curl` and `jq`. Load the supplied `.env.catlog`:

```sh
set -a
. ./.env.catlog
set +a
umask 077
mkdir -p .catlog-sessions/api
```

Alternatively set `CATLOG_BACKEND_URL` to the base URL above and
`CATLOG_API_KEY` to your privately supplied key. Replace all public-address
placeholders in the examples before running them. The saved session JSON files
contain a private session token; keep them private.

## Create a deposit: `POST /catlog/v1/live/sessions`

Headers:

```text
Authorization: Bearer <catlog-api-key>
Content-Type: application/json
```

| JSON field | Requirement | Meaning |
| --- | --- | --- |
| `idempotencyKey` | Required string, at most 200 characters | Choose a unique value for a new payment. Reuse the same value and body if retrying a creation request. |
| `provider` | Required | `near` or `cctp`. |
| `sourceChain` | Set explicitly | `ethereum`, `base`, `tron` or `arc`, using one of the combinations above. |
| `amountAtomic7` | Optional decimal-integer string; default `"10000000"` | Desired Stellar USDC output, in units of 0.0000001 USDC. `"10000000"` means 1 USDC. |
| `maximumSourceAtomic6` | Optional decimal-integer string; default `"2000000"` | NEAR quote's maximum source-token amount, in units of 0.000001 USDC or USDT. `"2000000"` means 2 source tokens. This is a cap, not the funding amount. Omit it for CCTP. |
| `refundAddress` | Required for NEAR | Your public payer address on the source chain: Ethereum/Base `0x...` or a valid Tron Base58Check address. Use the wallet that will fund the deposit. |
| `stellarRecipient` | Required for NEAR; optional for CCTP | Public Stellar `G...` receiving address. NEAR requires an existing mainnet account with the canonical USDC trustline. CCTP generates a testnet receiving account when omitted; an explicitly supplied account must exist on testnet with the test USDC trustline. |

The requested output must be at least 0.1 USDC and have at most six decimal
places. Ethereum, Base and Arc output limits are 10 USDC; Tron's is 250 USDC. NEAR source
caps cannot exceed 10 USDC on Ethereum/Base or 300 USDT on Tron. Source fees and the
provider's own minimums can make a request ineligible even within these limits.

Reusing an idempotency key with different normalized payment details returns HTTP
409 `IDEMPOTENCY_CONFLICT`. Reusing the same details returns the same session and
address, not a fresh quote. Use a new key if an unfunded quote has expired.

## Example: Ethereum mainnet USDC to Stellar mainnet USDC

This requests exactly **1 USDC on Stellar**, with a maximum **2 USDC** source quote.
Pay the exact `instructions.amountAtomic6` returned, plus Ethereum gas from your
own wallet. The quoted source amount includes the provider's fees.

```sh
curl --fail-with-body --silent --show-error --max-time 90 \
  -X POST "$CATLOG_BACKEND_URL/catlog/v1/live/sessions" \
  -H "Authorization: Bearer $CATLOG_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{
    "idempotencyKey": "eth-usdc-001",
    "provider": "near",
    "sourceChain": "ethereum",
    "refundAddress": "0xYOUR_ETHEREUM_PAYER_ADDRESS",
    "stellarRecipient": "YOUR_STELLAR_MAINNET_USDC_ADDRESS",
    "amountAtomic7": "10000000",
    "maximumSourceAtomic6": "2000000"
  }' --output .catlog-sessions/api/eth-session.json

jq '{id, phase, instructions, issue, providerIssue}' .catlog-sessions/api/eth-session.json
```

The token is canonical Ethereum USDC at
`0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`, with six decimals.

## Example: Base mainnet USDC to Stellar mainnet USDC

This requests exactly **1 USDC on Stellar**, with a maximum **2 USDC** source quote.
Pay the exact `instructions.amountAtomic6` returned, plus Base ETH gas from your
own wallet. The quoted source amount includes the provider's fees.

```sh
curl --fail-with-body --silent --show-error --max-time 90 \
  -X POST "$CATLOG_BACKEND_URL/catlog/v1/live/sessions" \
  -H "Authorization: Bearer $CATLOG_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{
    "idempotencyKey": "base-usdc-001",
    "provider": "near",
    "sourceChain": "base",
    "refundAddress": "0xYOUR_BASE_PAYER_ADDRESS",
    "stellarRecipient": "YOUR_STELLAR_MAINNET_USDC_ADDRESS",
    "amountAtomic7": "10000000",
    "maximumSourceAtomic6": "2000000"
  }' --output .catlog-sessions/api/base-session.json

jq '{id, phase, instructions, issue, providerIssue}' .catlog-sessions/api/base-session.json
```

The token is native Base USDC at
`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`, with six decimals.

Base mainnet uses chain ID **8453**. Send the returned USDC amount on Base and
pay network gas in ETH on Base. Catlog verifies the Base deposit against the
chain's `finalized` block before recording completion, along with verified Stellar
USDC delivery. A provider may report success while this finality check is still
pending. Base documents L1 batch finality as roughly 20 minutes; normal waiting
continues automatically. Sources: [Circle USDC addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses),
[Base network details](https://docs.base.org/get-started/connect-to-base),
[Base transaction finality](https://docs.base.org/specifications/transactions/transaction-finality).

## Example: Tron mainnet USDT to Stellar mainnet USDC

This requests **105 USDC on Stellar**, with a maximum **120 USDT** source quote.
As verified on October 28, 2026, the provider reports a temporary $100 minimum for
Tron swaps. A 105 USDC output quote succeeded; smaller requests can return
`NEAR_MINIMUM_SWAP_AMOUNT`. The quote does not spend money. Fund it only after
reviewing the returned amount, recipient, network and deadline. Pay Tron network
costs from your own wallet.

```sh
curl --fail-with-body --silent --show-error --max-time 90 \
  -X POST "$CATLOG_BACKEND_URL/catlog/v1/live/sessions" \
  -H "Authorization: Bearer $CATLOG_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{
    "idempotencyKey": "tron-usdt-001",
    "provider": "near",
    "sourceChain": "tron",
    "refundAddress": "YOUR_TRON_PAYER_ADDRESS",
    "stellarRecipient": "YOUR_STELLAR_MAINNET_USDC_ADDRESS",
    "amountAtomic7": "1050000000",
    "maximumSourceAtomic6": "120000000"
  }' --output .catlog-sessions/api/tron-session.json

jq '{id, phase, instructions, issue, providerIssue}' .catlog-sessions/api/tron-session.json
```

The token is canonical Tron USDT (TRC20) at
`TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`, with six decimals. Use USDT on Tron,
not USDC or a token on a different network. The returned instructions identify
`networkFeeAsset: "TRX"`.

## Example: Arc testnet USDC to Stellar testnet USDC

This generates a fresh Arc wallet and a fresh Stellar testnet receiving account.
It requests **1 test USDC** on Stellar. Fund the returned Arc address with
**3 test USDC**: 1 to bridge and an additional 2 reserved for Arc gas. The backend
only burns the bridge amount. Use Circle's faucet and select Arc Testnet.

```sh
curl --fail-with-body --silent --show-error --max-time 90 \
  -X POST "$CATLOG_BACKEND_URL/catlog/v1/live/sessions" \
  -H "Authorization: Bearer $CATLOG_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{
    "idempotencyKey": "arc-usdc-001",
    "provider": "cctp",
    "sourceChain": "arc",
    "amountAtomic7": "10000000"
  }' --output .catlog-sessions/api/arc-session.json

jq '{id, phase, instructions, issue}' .catlog-sessions/api/arc-session.json
```

To use an existing Stellar testnet destination, add
`"stellarRecipient": "YOUR_STELLAR_TESTNET_USDC_ADDRESS"` to this body. Use a
fresh idempotency key if changing an existing request. The Arc testnet USDC
contract is `0x3600000000000000000000000000000000000000`, with six decimals;
the returned instructions also include a faucet URL. Fund within the returned
deadline, normally one hour after creation. Private keys remain in the backend.

## Creation response and funding instructions

A successfully created or resumed session returns HTTP **201**. An abridged
response looks like:

```json
{
  "id": "SESSION_ID",
  "sessionToken": "PRIVATE_SESSION_TOKEN",
  "expiresAtMs": 1793270000000,
  "provider": "near",
  "sourceChain": "ethereum",
  "mode": "live",
  "network": "mainnet",
  "phase": "AWAITING_OR_PROCESSING_PAYMENT",
  "transaction": {
    "id": "TRANSACTION_ID",
    "status": "PENDING"
  },
  "instructions": {
    "network": "ethereum-mainnet",
    "token": "USDC",
    "depositAddress": "ADDRESS_RETURNED_BY_API",
    "amountAtomic6": "1027805",
    "decimals": 6,
    "deadline": "2026-10-28T15:00:00.000Z",
    "recipient": "YOUR_STELLAR_MAINNET_USDC_ADDRESS",
    "destinationNetwork": "stellar-mainnet",
    "expectedDestinationAtomic7": "10000000",
    "signatureVerified": true,
    "networkFeeAsset": "ETH"
  },
  "issue": null,
  "providerIssue": null,
  "providerStage": "PENDING_DEPOSIT",
  "privateKeysExported": false
}
```

The addresses, amounts and times above are illustrative. Always use the current
API response. `id` is the **session ID** used in the status URL;
`transaction.id` is the separate payment-record ID. Save `sessionToken` together
with the session ID. It is returned at creation and is not returned by status.

Only fund when instructions are present, their deadline is in the future, and
the session is awaiting payment. HTTP 201 confirms creation of a session, not a
successful quote or payment: a provider rejection can produce `phase: "FAILED"`
with `instructions: null`. If still preparing, poll status until instructions or
an explicit issue appear.

For NEAR, `amountAtomic6` is the exact USDC/USDT amount to send and
`expectedDestinationAtomic7` is the promised Stellar USDC output. For Arc,
`amountAtomic6` is the total funding requirement, including
`gasReserveAtomic6`; `bridgeAmountAtomic7` is the requested Stellar output and
`stellarRecipient` is the receiving address. Neither the NEAR source cap nor
`amountAtomic7` should be substituted for the returned funding amount.

## Check payment: `GET /catlog/v1/live/sessions/:id/status`

Use the session ID and token from the same creation response. This example works
for any of the four routes; change the saved filename as needed:

```sh
CATLOG_SESSION_FILE=.catlog-sessions/api/eth-session.json
CATLOG_SESSION_ID=$(jq -er '.id' "$CATLOG_SESSION_FILE")
CATLOG_SESSION_TOKEN=$(jq -er '.sessionToken' "$CATLOG_SESSION_FILE")

curl --fail-with-body --silent --show-error --max-time 30 \
  "$CATLOG_BACKEND_URL/catlog/v1/live/sessions/$CATLOG_SESSION_ID/status" \
  -H "x-catlog-session: $CATLOG_SESSION_TOKEN" \
  --output .catlog-sessions/api/payment-status.json

jq '{phase, providerStage, issue, providerIssue, transaction, instructions}' \
  .catlog-sessions/api/payment-status.json
```

Status returns HTTP **200** with the current payment body. Poll about every
15 seconds while waiting or processing. Server workers progress payments
independently of polling. Keep the original session JSON: do not replace it with
the status body, which omits `id` and `sessionToken`.

| `phase` | Meaning / next action |
| --- | --- |
| `PREPARING` | The quote or instructions are being prepared. Poll status. |
| `AWAITING_FUNDING` | CCTP is waiting for the full required Arc testnet funding. |
| `AWAITING_OR_PROCESSING_PAYMENT` | NEAR is waiting for a deposit or processing it; inspect `providerStage` for detail. Do not pay again after sending the quoted amount. |
| `PROCESSING` | CCTP is processing the funded bridge. |
| `COMPLETED` | Verified Stellar USDC delivery and backend ledger credit have completed. |
| `FAILED` | The payment or quote has failed. Read `issue` and `providerIssue`; do not fund this session. |
| `NEEDS_ATTENTION` | Recovery needs operator attention. Keep the session ID and transaction references; do not create another payment to recover the original. |
| `EXPIRED` | An unfunded Arc session passed its funding deadline and stopped watching. Do not fund it. |

NEAR quote expiry may appear as `issue: "NEAR_QUOTE_EXPIRED"` with
`instructions: null`, rather than an `EXPIRED` phase. Do not fund expired
instructions or a completed payment. After a completed NEAR payment,
`instructions` is normally `null`; use the transaction fields below.

Successful delivery is confirmed by `phase: "COMPLETED"` and
`transaction.status: "COMPLETED"`. The response includes:

- `transaction.externalIds.sourceTransactionId`: confirmed source transaction.
- `transaction.externalIds.destinationTransactionId`: confirmed Stellar transaction.
- `transaction.externalIds.destinationEventId`: verified Stellar payment/event reference.
- `transaction.creditedAtomic`: credited USDC in seven-decimal atomic units.
- `transaction.recovery`: recovery state, attempts and latest error code.

For example, a completed 1 USDC payment includes this abridged transaction:

```json
{
  "phase": "COMPLETED",
  "transaction": {
    "id": "TRANSACTION_ID",
    "status": "COMPLETED",
    "creditedAtomic": "10000000",
    "externalIds": {
      "sourceTransactionId": "CONFIRMED_SOURCE_HASH",
      "destinationTransactionId": "CONFIRMED_STELLAR_HASH",
      "destinationEventId": "VERIFIED_OPERATION_OR_EVENT_ID"
    }
  },
  "issue": null,
  "providerIssue": null
}
```

Mainnet ledger credit waits for finalized Ethereum/Base inclusion or a solidified
Tron receipt, and verified Stellar USDC delivery. A provider's success response
alone does not credit funds. Mainnet destination accounts need their existing
USDC trustline; automatically generated Arc-session destinations are on testnet.

## Errors, expiry and limits

HTTP errors use a JSON body such as `{"error":"UNAUTHORIZED_API_KEY"}`.

| HTTP status | Example error codes | Meaning |
| --- | --- | --- |
| 400 | `INVALID_LIVE_SESSION`, `INVALID_SESSION`, `INVALID_STELLAR_RECIPIENT`, `INVALID_ETHEREUM_REFUND_ADDRESS`, `INVALID_BASE_REFUND_ADDRESS`, `INVALID_TRON_REFUND_ADDRESS`, `NEAR_REFUND_AND_STELLAR_ADDRESSES_REQUIRED` | Invalid body, amount or public addresses. |
| 401 | `UNAUTHORIZED_API_KEY`, `UNAUTHORIZED_SESSION` | Wrong/missing API key, or wrong/missing session token for that session. |
| 403 | `CATLOG_API_KEY_EXPIRED` | Request a renewed API key from the owner. |
| 404 | `NOT_FOUND`, `LIVE_SESSION_NOT_FOUND` | Endpoint or session unavailable. |
| 409 | `IDEMPOTENCY_CONFLICT` | The idempotency key was already used for different payment details. |
| 410 | `CATLOG_SESSION_EXPIRED` | This session's access token expired. |
| 429 | `CATLOG_LIVE_HOURLY_LIMIT`, `CATLOG_DAILY_LIMIT` | Shared API key creation quota reached. |
| 500 / 503 | `LIVE_SESSION_ERROR`, `CATLOG_INTERNAL_ERROR`, `CATLOG_NOT_CONFIGURED`, `LIVE_SESSIONS_NOT_CONFIGURED` | Server/configuration issue. Retry a creation request with the same key and body. |

Provider issues can instead appear inside an HTTP 201 creation or HTTP 200 status
response. A Tron quote below the provider minimum, for example, produces:

```json
{
  "phase": "FAILED",
  "instructions": null,
  "issue": "NEAR_MINIMUM_SWAP_AMOUNT",
  "providerIssue": {
    "code": "NEAR_MINIMUM_SWAP_AMOUNT",
    "service": "API",
    "httpStatus": 400,
    "message": "Temporary swap limits: minimum swap amount is $100"
  }
}
```

Creation is limited to 12 live sessions per hour and 1,000 total test and live sessions
per rolling 24 hours, shared by everyone using the same API key. An
idempotent retry does not consume another session. Session access lasts at most
24 hours and can end earlier at the API key's expiry. Key rotation invalidates
previous session tokens. The payment funding deadline is separate and can be
much earlier; always use `instructions.deadline`.

## Health check: `GET /catlog/v1/health`

No authentication is required:

```sh
curl --fail-with-body --silent --show-error \
  "$CATLOG_BACKEND_URL/catlog/v1/health" | jq .
```

The response identifies `service: "catlog-backend"`, `protocolVersion: 1`, the
deployed `buildRevision`, `automatedMode: "controlled-providers"` for the separate
automated tests, and the supported live routes. The live API above uses real
network providers; it is not part of the controlled-provider acceptance suite.
