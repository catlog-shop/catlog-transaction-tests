export const START_TIME_MS = Date.parse("2026-10-19T09:00:00Z");
export const TEST_POLICY = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 1500,
  leaseMs: 5000,
  reconcileIntervalMs: 1000,
  jitter: false,
};
export const STELLAR_ASSET =
  "USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
// Valid Stellar account encodings. Fixtures never sign or broadcast transfers.
export const RECIPIENT =
  "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
export const OTHER_RECIPIENT =
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
export const routes = [
  {
    id: "cctp.arc-to-stellar",
    provider: "CCTP",
    sourceNetwork: "arc-testnet",
    destinationNetwork: "stellar-testnet",
    sourceAsset: "arc-testnet:native-USDC",
    destinationAsset: STELLAR_ASSET,
    recipient: RECIPIENT,
  },
  {
    id: "cctp.stellar-to-arc",
    provider: "CCTP",
    sourceNetwork: "stellar-testnet",
    destinationNetwork: "arc-testnet",
    sourceAsset: STELLAR_ASSET,
    destinationAsset: "arc-testnet:native-USDC",
    recipient: "0x0000000000000000000000000000000000000001",
  },
  // A declared controlled-provider fixture, not a claim of NEAR testnet support.
  {
    id: "near.to-stellar",
    provider: "NEAR",
    sourceNetwork: "ethereum-sepolia",
    destinationNetwork: "stellar-testnet",
    sourceAsset: "ethereum-sepolia:WETH",
    destinationAsset: STELLAR_ASSET,
    recipient: RECIPIENT,
  },
];
