import type { BaseTransaction } from "./contract";

type Observation = {
  operation: "create" | "read" | "list" | "process" | "event";
  processed?: boolean;
  duplicate?: boolean;
  applied?: boolean;
};
type Snapshot = { historyLength: number; attempts: number; status: string; fingerprint: string };
const quoted = (value: unknown) => JSON.stringify(value);

export class TransactionLog {
  private readonly snapshots = new Map<string, Snapshot>();
  private readonly emit: (text: string) => void;

  constructor(emit: (text: string) => void = text => console.log(text)) {
    this.emit = emit;
  }

  observe(transaction: BaseTransaction, observation: Observation) {
    const previous = this.snapshots.get(transaction.id);
    const context = [`operation=${observation.operation}`];
    for (const key of ["processed", "duplicate", "applied"] as const) {
      if (observation[key] !== undefined) context.push(`${key}=${observation[key]}`);
    }
    const heading = `[BASE] transaction=${quoted(transaction.id)} ${context.join(" ")}`;
    // Concurrent requests can finish out of order. Never print an older response
    // as a new status change or decrement the observed attempt count.
    if (previous && (transaction.history.length < previous.historyLength || transaction.attempts < previous.attempts)) {
      if (observation.operation !== "read" && observation.operation !== "list") {
        this.emit(`${heading} ignored=older-snapshot`);
      }
      return;
    }
    // Only these response fields are logged; never dump requests, credentials,
    // merchant details, idempotency keys or the entire transaction object.
    const externalIds = {
      sourceTransactionId: transaction.externalIds.sourceTransactionId,
      destinationTransactionId: transaction.externalIds.destinationTransactionId,
      bridgeMessageId: transaction.externalIds.bridgeMessageId,
      providerExecutionId: transaction.externalIds.providerExecutionId,
    };
    const fingerprint = JSON.stringify({
      status: transaction.status, attempts: transaction.attempts, recovery: transaction.recovery,
      nextAttemptAtMs: transaction.nextAttemptAtMs, lastErrorCode: transaction.lastErrorCode, externalIds,
    });
    if (previous && previous.fingerprint === fingerprint && previous.historyLength === transaction.history.length) {
      if (observation.operation === "create") this.emit(`${heading} reused=true state=unchanged`);
      else if (observation.processed === false || observation.duplicate !== undefined || observation.applied !== undefined) {
        this.emit(`${heading} state=unchanged`);
      }
      return;
    }
    const lines = [heading, `  route=${quoted(transaction.routeId)} scenario=${quoted(transaction.scenario)}`];
    const history = transaction.history.slice(previous?.historyLength ?? 0);
    let from = previous?.status ?? "(created)";
    for (const entry of history) {
      lines.push(`  status: ${from} -> ${entry.status}; reason=${quoted(entry.reason)}; atMs=${entry.atMs}`);
      from = entry.status;
    }
    if (history.length === 0) lines.push(`  status: ${transaction.status} (unchanged)`);
    lines.push(
      `  attempts=${transaction.attempts}/${transaction.maxAttempts} retryAttempts=${Math.max(0, transaction.attempts - 1)} recovery=${transaction.recovery}`,
      `  nextAttemptAtMs=${quoted(transaction.nextAttemptAtMs)} lastErrorCode=${quoted(transaction.lastErrorCode)}`,
      `  externalIds=${JSON.stringify(externalIds)}`,
    );
    this.emit(lines.join("\n"));
    this.snapshots.set(transaction.id, {
      historyLength: transaction.history.length, attempts: transaction.attempts, status: transaction.status, fingerprint,
    });
  }

  clear() { this.snapshots.clear(); }
}
