import { randomUUID } from "node:crypto";
import type { Route, Scenario, BaseCredit, BaseTransaction } from "./contract";
import { TransactionLog } from "./transaction-log";

export class BaseClient {
  private readonly log = new TransactionLog();
  constructor(readonly url: string, readonly token = "", readonly sessionId?: string, private readonly reviewerKey = "") {}
  async call<T>(path: string, method = "GET", data?: unknown, token = this.token): Promise<T> {
    const response = await fetch(new URL(path, this.url), {
      method, redirect: "error", signal: AbortSignal.timeout(20000),
      headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(data === undefined ? {} : { "content-type": "application/json" }) },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    const envelope = await response.json() as { service: string; backend: boolean; mode: string; base: boolean; data: T & { error?: string } };
    if (response.headers.get("x-catlog-backend") !== "true" || envelope.backend !== true ||
      envelope.mode !== "base" || envelope.base !== true || envelope.service !== "catlog test") {
      throw new Error("The API did not identify itself as the Catlog test backend.");
    }
    if (!response.ok) throw Object.assign(new Error(envelope.data.error ?? "Backend request failed"), { status: response.status, code: envelope.data.error });
    return envelope.data;
  }
  path(tail = "") { if (!this.sessionId) throw new Error("No backend test session"); return `/v1/base/${this.sessionId}${tail}`; }
  async open() {
    const session = await this.call<{ id: string; nowMs: number; token: string }>("/v1/base", "POST", {}, this.reviewerKey);
    if (typeof session.token !== "string" || !/^[1-9]\d{12}\.[0-9a-f]{64}$/.test(session.token)) {
      throw new Error("The backend did not issue a session credential.");
    }
    return new BaseClient(this.url, session.token, session.id, this.reviewerKey);
  }
  async create(routeId: Route, scenario: Scenario, extra: Record<string, unknown> = {}) {
    const transaction = await this.call<BaseTransaction>(this.path("/transactions"), "POST", {
      merchantId: "base-merchant-acceptance", idempotencyKey: randomUUID(), routeId, scenario,
      amountAtomic: "100000000", feeAtomic: "1000000", ...extra,
    });
    this.log.observe(transaction, { operation: "create" });
    return transaction;
  }
  async get(id: string) {
    const transaction = await this.call<BaseTransaction>(this.path(`/transactions/${id}`));
    this.log.observe(transaction, { operation: "read" });
    return transaction;
  }
  async process(id: string) {
    const result = await this.call<{ transaction: BaseTransaction; processed: boolean }>(this.path(`/transactions/${id}/process`), "POST", {});
    this.log.observe(result.transaction, { operation: "process", processed: result.processed });
    return result;
  }
  advance(advanceMs: number) { return this.call<{ nowMs: number }>(this.path("/clock"), "POST", { advanceMs }); }
  ledger(merchantId?: string) {
    return this.call<{ credits: BaseCredit[]; totalAtomic: string }>(this.path(`/ledger${merchantId ? `?merchantId=${merchantId}` : ""}`));
  }
  async list(status?: string) {
    const result = await this.call<{ transactions: BaseTransaction[] }>(this.path(`/transactions${status ? `?status=${status}` : ""}`));
    for (const transaction of result.transactions) this.log.observe(transaction, { operation: "list" });
    return result;
  }
  async event(id: string, outcome: "COMPLETED" | "FAILED" | "PENDING", eventId = `base-event-${randomUUID()}`) {
    const result = await this.call<{ duplicate: boolean; applied: boolean; transaction: BaseTransaction }>(this.path("/events"), "POST", { transactionId: id, outcome, eventId });
    this.log.observe(result.transaction, { operation: "event", duplicate: result.duplicate, applied: result.applied });
    return result;
  }
  async close() {
    const result = await this.call(this.path(), "DELETE");
    this.log.clear();
    return result;
  }
}
