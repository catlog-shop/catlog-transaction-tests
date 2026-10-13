import { mkdir, writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import {
  Asset, BASE_FEE, Horizon, Keypair, Memo, Networks, Operation, TransactionBuilder,
} from "@stellar/stellar-sdk";
import { expect, test } from "vitest";

// Fixed testnet endpoints and fresh in-memory keys: no wallet secrets required.
const HORIZON = "https://horizon-testnet.stellar.org";
const FRIENDBOT = "https://friendbot.stellar.org";
const AMOUNT = "1.0000000";
const REPORT = "reports/stellar-testnet.json";
const server = new Horizon.Server(HORIZON);

function stroops(value: string): bigint {
  if (!/^\d+(\.\d{1,7})?$/.test(value)) throw new Error("Invalid XLM amount");
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * 10_000_000n + BigInt(fraction.padEnd(7, "0"));
}

function nativeBalance(account: Horizon.AccountResponse): bigint {
  const native = account.balances.find(balance => balance.asset_type === "native");
  if (!native) throw new Error("Account has no native XLM balance");
  return stroops(native.balance);
}

function httpStatus(error: unknown): number | undefined {
  return (error as { response?: { status?: number } } | undefined)?.response?.status;
}

async function waitFor<T>(
  signal: AbortSignal,
  label: string,
  read: () => Promise<T>,
  ready: (value: T) => boolean = () => true,
  timeoutMs = 45_000,
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    signal.throwIfAborted();
    try {
      const value = await read();
      if (ready(value)) return value;
    } catch (error) {
      signal.throwIfAborted();
      const status = httpStatus(error);
      // Not-found, transient network errors, rate limiting and server errors
      // may recover. Other HTTP failures should not be hidden by polling.
      if (status && status !== 404 && status !== 429 && status < 500) {
        throw new Error(`${label}: HTTP ${status}`);
      }
    }
    await delay(1_000, undefined, { signal });
  }
  throw new Error(`${label}: timed out; any submitted transaction may still settle`);
}

async function fund(address: string, signal: AbortSignal): Promise<void> {
  const response = await fetch(`${FRIENDBOT}/?addr=${encodeURIComponent(address)}`, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(30_000)]),
  });
  if (!response.ok) throw new Error(`Friendbot funding failed: HTTP ${response.status}`);
  await response.arrayBuffer();
}

test("real testnet payment settles once when its signed transaction is replayed", async () => {
  // Cancel requests and polling before Vitest's outer timeout can fire.
  const runSignal = AbortSignal.timeout(210_000);
  server.httpClient.interceptors.request.use(config => ({
    ...config, timeout: 12_000, signal: runSignal,
  }));
  await mkdir("reports", { recursive: true });
  // Overwrite any old result before attempting a new run.
  const report: Record<string, unknown> = {
    status: "running",
    startedAt: new Date().toISOString(),
    network: "stellar-testnet",
    scope: "Direct Stellar XLM payment and same-envelope replay; Catlog backend not exercised",
    amount: AMOUNT,
    asset: "XLM",
  };
  const save = () => writeFile(REPORT, JSON.stringify(report, null, 2) + "\n");
  await save();

  try {
    const networkResponse = await fetch(HORIZON, {
      signal: AbortSignal.any([runSignal, AbortSignal.timeout(15_000)]),
    });
    if (!networkResponse.ok) throw new Error(`Horizon unavailable: HTTP ${networkResponse.status}`);
    const network = await networkResponse.json() as { network_passphrase?: string };
    expect(network.network_passphrase).toBe(Networks.TESTNET);

    const sender = Keypair.random();
    const recipient = Keypair.random();
    report.sender = sender.publicKey();
    report.recipient = recipient.publicKey();
    await save();
    await fund(sender.publicKey(), runSignal);
    await fund(recipient.publicKey(), runSignal);

    const [source, destination] = await Promise.all([
      waitFor(runSignal, "Sender funding", () => server.loadAccount(sender.publicKey())),
      waitFor(runSignal, "Recipient funding", () => server.loadAccount(recipient.publicKey())),
    ]);
    const balanceBefore = nativeBalance(destination);
    const sourceBalanceBefore = nativeBalance(source);
    const sequenceBefore = BigInt(source.sequenceNumber());
    const transaction = new TransactionBuilder(source, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(Operation.payment({
        destination: recipient.publicKey(), asset: Asset.native(), amount: AMOUNT,
      }))
      .addMemo(Memo.text("Catlog layer test"))
      .setTimeout(180)
      .build();
    transaction.sign(sender);
    const hash = Buffer.from(transaction.hash()).toString("hex");
    const envelope = transaction.toXDR();
    report.transactionHash = hash;
    report.transactionUrl = `${HORIZON}/transactions/${hash}`;
    report.explorerUrl = `https://stellar.expert/explorer/testnet/tx/${hash}`;
    report.status = "prepared";
    await save();

    // Keep the original signed transaction on any ambiguous response. Poll the
    // precomputed hash rather than constructing a second payment.
    let submitHash: string | undefined;
    try {
      submitHash = (await server.submitTransaction(transaction)).hash;
    } catch (error) {
      report.submissionResponse = `No success response; polling known hash (HTTP ${httpStatus(error) ?? "unknown"})`;
    }
    if (submitHash) expect(submitHash).toBe(hash);
    const confirmed = await waitFor(
      runSignal,
      "Payment confirmation",
      () => server.transactions().transaction(hash).call(),
      () => true,
      60_000,
    );
    expect(confirmed.successful).toBe(true);
    expect(confirmed.hash).toBe(hash);
    expect(confirmed.source_account).toBe(sender.publicKey());
    expect(BigInt(confirmed.source_account_sequence)).toBe(sequenceBefore + 1n);
    expect(confirmed.operation_count).toBe(1);
    expect(confirmed.ledger_attr).toBeGreaterThan(0);

    const operations = await waitFor(runSignal, "Payment operation", () =>
      server.operations().forTransaction(hash).limit(10).call(),
      page => page.records.length > 0,
    );
    expect(operations.records).toHaveLength(1);
    const payment = operations.records[0];
    if (payment.type !== "payment") throw new Error("Expected a payment operation");
    expect(payment.transaction_successful).toBe(true);
    expect(payment.from).toBe(sender.publicKey());
    expect(payment.to).toBe(recipient.publicKey());
    expect(payment.asset_type).toBe("native");
    expect(payment.amount).toBe(AMOUNT);

    const expectedBalance = balanceBefore + stroops(AMOUNT);
    const received = await waitFor(runSignal, "Recipient credit", () => server.loadAccount(recipient.publicKey()),
      account => nativeBalance(account) === expectedBalance);
    const expectedSourceBalance = sourceBalanceBefore - stroops(AMOUNT) - BigInt(confirmed.fee_charged);
    const sourceAfter = await waitFor(runSignal, "Sender debit", () => server.loadAccount(sender.publicKey()),
      account => nativeBalance(account) === expectedSourceBalance);

    // Replay the EXACT signed envelope. Rebuilding could create another payment.
    expect(transaction.toXDR()).toBe(envelope);
    let replay: Awaited<ReturnType<typeof server.submitTransaction>>;
    try {
      replay = await server.submitTransaction(transaction);
    } catch (error) {
      throw new Error(`Replay was not acknowledged (HTTP ${httpStatus(error) ?? "unknown"}); original hash: ${hash}`);
    }
    expect(replay.hash).toBe(hash);
    expect(replay.successful).toBe(true);
    const [recipientAfterReplay, sourceAfterReplay] = await Promise.all([
      server.loadAccount(recipient.publicKey()),
      server.loadAccount(sender.publicKey()),
    ]);
    expect(nativeBalance(recipientAfterReplay)).toBe(nativeBalance(received));
    expect(nativeBalance(sourceAfterReplay)).toBe(nativeBalance(sourceAfter));
    expect(sourceAfterReplay.sequenceNumber()).toBe(sourceAfter.sequenceNumber());

    runSignal.throwIfAborted();
    Object.assign(report, {
      status: "passed",
      finishedAt: new Date().toISOString(),
      ledger: confirmed.ledger_attr,
      operationId: payment.id,
      feeChargedStroops: String(confirmed.fee_charged),
      recipientBalanceBeforeStroops: balanceBefore.toString(),
      recipientBalanceAfterStroops: expectedBalance.toString(),
      replayHash: replay.hash,
      replayDidNotChangeBalancesOrSequence: true,
    });
    await save();
    console.log(`Verified Stellar testnet transaction: ${report.explorerUrl}`);
  } catch (error) {
    report.status = "failed";
    report.finishedAt = new Date().toISOString();
    // Avoid serializing SDK request objects or any key material into artifacts.
    await save();
    throw error;
  }
});
