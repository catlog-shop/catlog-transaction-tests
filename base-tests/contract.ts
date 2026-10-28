// Public response contract for the test backend; no Worker implementation.
export const ROUTES = ["cctp.arc-to-stellar", "cctp.stellar-to-arc", "near.to-stellar"] as const;
export type Route = typeof ROUTES[number];
export type Status = "PENDING" | "COMPLETED" | "FAILED" | "EXPIRED";
export type Scenario = "success" | "failure" | "retry" | "expiry";
export interface Input {
  idempotencyKey: string; merchantId: string; routeId: Route; scenario: Scenario;
  amountAtomic: string; feeAtomic: string; failuresBeforeSuccess: number; ttlMs: number;
}
export interface BaseTransaction extends Input {
  id: string; asset: "USDC"; decimals: 7; status: Status; createdAtMs: number; expiresAtMs: number;
  attempts: number; maxAttempts: number;
  recovery: "NONE" | "SCHEDULED" | "MANUAL_REQUIRED";
  nextAttemptAtMs: number | null; lastErrorCode: string | null;
  history: { status: Status; atMs: number; reason: string }[];
  externalIds: { sourceTransactionId: string | null; providerExecutionId: string;
    bridgeMessageId: string | null; destinationTransactionId: string | null };
}
export interface BaseCredit {
  id: string; transactionId: string; merchantId: string; asset: "USDC"; amountAtomic: string;
}
