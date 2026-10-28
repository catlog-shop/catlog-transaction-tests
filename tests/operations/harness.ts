/** Bind this contract to Catlog services, durable storage and authenticated support endpoints. */
export const REQUIRED_ROUTES = [
  { id: "cctp.arc-to-stellar", provider: "CCTP", sourceNetwork: "arc-testnet", destinationNetwork: "stellar-testnet" },
  { id: "cctp.stellar-to-arc", provider: "CCTP", sourceNetwork: "stellar-testnet", destinationNetwork: "arc-testnet" },
  // NEAR identifies the execution provider. Its source chain must come from the real fixture.
  { id: "near.to-stellar", provider: "NEAR", sourceNetwork: null, destinationNetwork: "stellar-testnet" },
] as const;
export type RouteId = typeof REQUIRED_ROUTES[number]["id"];
export type FinancialStatus = "PENDING" | "COMPLETED" | "FAILED";
export type SupportState = FinancialStatus | "RECOVERABLE";
export type RecoveryState = "NONE" | "SCHEDULED" | "RETRYING" | "MANUAL_REQUIRED";
export const TEST_POLICY = {
  maxAttempts: 3, baseDelayMs: 1_000, maxDelayMs: 1_500,
  leaseMs: 5_000, reconcileIntervalMs: 1_000, jitter: false,
} as const;
export const START_TIME_MS = Date.parse("2026-10-19T09:00:00Z");

export interface RouteFixture {
  id: RouteId;
  provider: "CCTP" | "NEAR";
  sourceNetwork: string;
  destinationNetwork: string;
  sourceAsset: string;
  destinationAsset: string;
  recipient: string;
}
export interface TransferRequest {
  merchantId: string;
  idempotencyKey: string;
  routeId: RouteId;
  sourceAsset: string;
  destinationAsset: string;
  recipient: string;
  /** Normalize all fixture amounts to integer seven-decimal units. */
  amountAtomic: bigint;
}
export interface TransferKey { merchantId: string; routeId: RouteId; idempotencyKey: string }
export interface ExternalIds {
  sourceTransactionId: string | null;
  providerExecutionId: string | null;
  /** CCTP nonce/message ID; null for a provider that has no bridge message ID. */
  bridgeMessageId: string | null;
  destinationTransactionId: string | null;
  destinationEventId: string | null;
}
export interface Recovery {
  state: RecoveryState;
  /** Attempts in the current job's retry budget, including its initial attempt. */
  attempts: number;
  maxAttempts: number;
  nextAttemptAtMs: number | null;
  lastErrorCode: string | null;
}
export interface OperationRecord extends TransferRequest {
  id: string;
  status: FinancialStatus;
  externalIds: ExternalIds;
  recovery: Recovery;
  createdAtMs: number;
}
export interface QueueJob {
  /** Persisted logical job identity, stable across attempts and worker restarts. */
  id: string;
  transactionId: string;
  routeId: RouteId;
  kind: "SUBMIT" | "RECONCILE";
  state: "READY" | "WAITING" | "LEASED" | "SUCCEEDED" | "DEAD";
  attempts: number;
  nextAttemptAtMs: number | null;
  leaseUntilMs: number | null;
  lastErrorCode: string | null;
}
export interface Settlement {
  eventId: string;
  externalIds: ExternalIds;
  routeId: RouteId;
  recipient: string;
  asset: string;
  grossAtomic: bigint;
  feeAtomic: bigint;
  netAtomic: bigint;
}
export type Observation =
  | { status: "PENDING"; externalIds: ExternalIds; nextAction?: "WAIT" | "RESUME_DESTINATION" }
  | { status: "COMPLETED"; settlement: Settlement }
  | { status: "FAILED"; externalIds: ExternalIds; code: string };
export type SubmitStep =
  | { result: "TRANSIENT_ERROR"; code: string }
  | { result: "REJECTED"; code: string }
  | { result: "ACCEPTED" | "ACCEPTED_RESPONSE_LOST"; externalIds: ExternalIds };
export interface Snapshot {
  transactions: OperationRecord[];
  jobs: QueueJob[];
  /** Actual committed settlement ledger effects, excluding holds/reservations. */
  settlements: { transactionId: string; merchantId: string; ledgerReference: string; asset: string; netAtomic: bigint }[];
}
export interface ProviderSnapshot {
  calls: (
    | { operation: "LOOKUP"; key: TransferKey }
    | { operation: "SUBMIT" | "RESUME"; key: TransferKey;
        /** Actual signed envelope/transaction identity, or a real provider-supported deduplication token. */
        submissionIdentity: string }
  )[];
  /** Logical external effects per transfer; same-envelope sends do not add an effect. */
  transfers: { key: TransferKey; sourceTransfers: number; destinationTransfers: number }[];
}
export interface SupportRow {
  id: string;
  merchantId: string;
  routeId: RouteId;
  /** RECOVERABLE means financial PENDING with a non-NONE recovery state. */
  state: SupportState;
  financialStatus: FinancialStatus;
  externalIds: ExternalIds;
  recovery: Recovery;
}
export type Actor = "support" | "merchant" | "anonymous";
export interface SupportQuery {
  state?: SupportState;
  routeId?: RouteId;
  /** Search by Catlog ID or external ID. */
  search?: string;
  limit?: number;
  cursor?: string;
}
export interface OperationsHarness {
  fixture: { merchantId: string; otherMerchantId: string; routes: RouteFixture[] };
  /**
   * Real application API: persist the record and initial SUBMIT job atomically.
   * Fixture workers start paused. Repeated merchant-scoped keys return the same ID.
   */
  createTransfer(request: TransferRequest): Promise<{ id: string }>;
  /** Read persisted transactions, queue rows and ledger effects in this namespace. */
  snapshot(): Promise<Snapshot>;
  clock: {
    nowMs(): Promise<number>;
    /** Advance the application's injected clock AND queue scheduling clock; never sleep. */
    advanceTo(timestampMs: number): Promise<void>;
  };
  workers: {
    /** Run jobs eligible now, at most once per job per call; do not advance time. */
    runDue(options?: { concurrency?: number }): Promise<void>;
    /** Restart actual workers; keep the database, queued jobs and controlled provider. */
    restart(): Promise<void>;
    /** Fault-inject a real worker exit after a durable claim, before provider submission. */
    claimAndCrash(): Promise<{ jobId: string }>;
  };
  reconciliation: {
    /** Run the real scanner/dispatcher for ALL required routes in the namespace. */
    scan(): Promise<void>;
    /** Enqueue through the normal idempotent reconciliation entry point. */
    enqueue(transactionId: string): Promise<void>;
  };
  provider: {
    /** Control only the external boundary. Transient errors here are pre-acceptance. */
    plan(key: TransferKey, steps: SubmitStep[]): Promise<void>;
    /** Fail the next count LOOKUP calls before returning their existing remote state. */
    failLookups(key: TransferKey, count: number, code: string): Promise<void>;
    /** Change the remote lookup result only. Do not deliver a webhook or write Catlog rows. */
    observe(key: TransferKey, result: Observation): Promise<void>;
    /** Make destination execution ready. LOOKUP remains PENDING/RESUME_DESTINATION;
     * only an actual RESUME call at the provider boundary executes this settlement.
     */
    readyToResume(key: TransferKey, settlement: Settlement): Promise<void>;
    /** Deliver through Catlog's actual verified webhook/settlement handler. */
    deliver(key: TransferKey, result: Observation): Promise<void>;
    snapshot(): Promise<ProviderSnapshot>;
  };
  support: {
    /** Real authenticated endpoint backing the internal view, not a local snapshot filter. */
    list(actor: Actor, query?: SupportQuery): Promise<{ rows: SupportRow[]; nextCursor: string | null }>;
    detail(actor: Actor, transactionId: string): Promise<SupportRow>;
    /** Enqueue one immediately eligible RECONCILE job; concurrent requests share it. Workers remain paused until runDue(). */
    retry(actor: Actor, transactionId: string): Promise<void>;
  };
  /** Delete only this fixture and release its real workers/connections. */
  close(): Promise<void>;
}
