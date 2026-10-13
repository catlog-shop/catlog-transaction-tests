/** Connection contract, not an implementation of Catlog's business logic. */
export type Status = "PENDING" | "COMPLETED" | "FAILED";

export interface DepositRequest {
  merchantId: string;
  idempotencyKey: string;
  network: "testnet";
  /** Asset code + issuer, or another unambiguous asset identifier. */
  asset: string;
  recipient: string;
  /** Integer units at 7 decimals: 100_000_000n represents 10 units. */
  amountAtomic: bigint;
}

export interface Settlement {
  eventId: string;
  executionId: string;
  stellarHash: string;
  operationOrEventId: string;
  network: "testnet";
  recipient: string;
  asset: string;
  grossAtomic: bigint;
  /** Merchant fee in this same settlement asset, NOT the XLM network fee. */
  feeAtomic: bigint;
  netAtomic: bigint;
}

export type ProviderOutcome =
  | { status: "COMPLETED"; settlement: Settlement }
  | { status: "PENDING"; eventId: string }
  | { status: "FAILED"; eventId: string; reason: string };

export interface TransactionRecord extends DepositRequest {
  id: string;
  status: Status;
  /**
   * Persisted history mapped to these states; collapse consecutive equivalent
   * states (e.g. CREATED and SUBMITTED both map to PENDING). Preserve reversals.
   * COMPLETED and confirmed FAILED are terminal in this test suite's contract.
   */
  history: Status[];
  executionId: string | null;
  stellarHash: string | null;
  operationOrEventId: string | null;
  feeAtomic: bigint | null;
  creditedAtomic: bigint | null;
}

export interface LedgerCredit {
  id: string;
  transactionId: string;
  merchantId: string;
  asset: string;
  amountAtomic: bigint;
}

export interface Snapshot {
  /** All transaction and credit rows in this test's isolated namespace. */
  transactions: TransactionRecord[];
  credits: LedgerCredit[];
  /** Balances for both fixture merchants in the fixture settlement asset. */
  balances: Record<string, bigint>;
  /** Count logical transfers, not HTTP calls or same-envelope retries. */
  effectiveProviderTransfers: number;
}

export interface CatlogHarness {
  fixture: {
    merchantId: string;
    otherMerchantId: string;
    asset: string;
    otherAsset: string;
    recipient: string;
    otherRecipient: string;
  };
  /**
   * Call the REAL authenticated API or application service. Normalize explicit
   * application errors to Error objects with code IDEMPOTENCY_CONFLICT or
   * FEATURE_DISABLED. Do not swallow unexpected errors.
   * Duplicate/in-progress responses should resolve to the canonical Catlog ID.
   */
  createDeposit(request: DepositRequest): Promise<{ id: string }>;
  /** Run actual queued work with a bounded wait; propagate worker failures. */
  drain(): Promise<void>;
  /** Read actual database records/balances, not a cache inside the test helper. */
  snapshot(): Promise<Snapshot>;
  /** Control the real server-side feature flag for this isolated test. */
  setDepositsEnabled(enabled: boolean): Promise<void>;
  /** Invoke the actual recovery/reconciliation entry point. */
  reconcile(transactionId: string): Promise<void>;
  provider: {
    /**
     * Simulate external provider results, then deliver them through Catlog's
     * actual verified webhook/polling and settlement path. Never write ledger
     * or status rows from this helper. Replay must reach the real deduplicator.
     * Ignore/reject stale outcomes without throwing; unexpected failures throw.
     */
    emit(transactionId: string, outcome: ProviderOutcome): Promise<void>;
    /**
     * Next submit is accepted externally but its response times out. The
     * provider retains the logical execution so reconciliation can recover it.
     */
    loseNextSubmissionResponse(acceptedExecutionId: string): Promise<void>;
  };
  /** Clean up only this fixture's records and release connections/workers. */
  close(): Promise<void>;
}
