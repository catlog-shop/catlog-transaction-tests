import { setTimeout as delay } from "node:timers/promises";
import {
  Asset, BASE_FEE, Contract, Horizon, Keypair, Networks, StrKey,
  Transaction, TransactionBuilder, nativeToScVal, rpc,
} from "@stellar/stellar-sdk";
import { FetchRequest, JsonRpcProvider, Transaction as EvmTransaction, Wallet,
  type TransactionRequest, type TransactionReceipt } from "ethers";

// These tests cannot select mainnet through configuration.
export const ARC_RPC = "https://rpc.testnet.arc.io";
export const ARC_CHAIN_ID = 5042002n;
export const ARC_USDC = "0x3600000000000000000000000000000000000000";
export const ARC_TOKEN_MESSENGER = "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA";
export const ARC_MESSAGE_TRANSMITTER = "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275";
export const HORIZON = "https://horizon-testnet.stellar.org";
export const STELLAR_RPC = "https://soroban-testnet.stellar.org";
export const IRIS = "https://iris-api-sandbox.circle.com";
export const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
export const STELLAR_USDC = new Asset("USDC", USDC_ISSUER);
export const CCTP_FORWARDER = "CA66Q2WFBND6V4UEB7RD4SAXSVIWMD6RA4X3U32ELVFGXV5PJK4T4VSZ";
export const STELLAR_MESSAGE_TRANSMITTER = "CBJ6MTCKKZG73PMDZCJMSFRD7DQEMI4FKDH7CGDSV4W6FHCRBCQAVVJY";
export const STELLAR_TOKEN_MESSENGER = "CDNG7HXAPBWICI2E3AUBP3YZWZELJLYSB6F5CC7WLDTLTHVM74SLRTHP";
export type PublicReport = Record<string, unknown>;
export type SaveReport = () => Promise<void>;

export function check(condition: unknown, label: string): asserts condition {
  if (!condition) throw new Error(label);
}

export function createStellarClients(signal: AbortSignal) {
  const horizon = new Horizon.Server(HORIZON);
  const soroban = new rpc.Server(STELLAR_RPC);
  for (const client of [horizon, soroban]) {
    client.httpClient.interceptors.request.use(config => ({
      ...config, timeout: 15_000, signal,
    }));
  }
  return { horizon, soroban };
}

export function createArcProvider() {
  const request = new FetchRequest(ARC_RPC);
  request.timeout = 15_000;
  return new JsonRpcProvider(request, undefined, { batchMaxCount: 1, cacheTimeout: -1 });
}

export async function requestJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
  });
  if (!response.ok) throw new Error(`Public endpoint returned HTTP ${response.status}`);
  return await response.json() as T;
}

export async function poll<T>(
  signal: AbortSignal, label: string, read: () => Promise<T>,
  ready: (value: T) => boolean, timeoutMs = 120_000, intervalMs = 2_000,
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    signal.throwIfAborted();
    // Callers decide which missing-record responses are safe to retry. Do not
    // turn a confirmed onchain failure into an eventual timeout.
    const value = await read();
    if (ready(value)) return value;
    await delay(intervalMs, undefined, { signal });
  }
  throw new Error(`${label} timed out; inspect saved transaction hashes before retrying`);
}

export function stellarAmountUnits(value: string): bigint {
  check(/^\d+(\.\d{1,7})?$/.test(value), "Invalid Stellar amount");
  const [whole, fractional = ""] = value.split(".");
  return BigInt(whole) * 10_000_000n + BigInt(fractional.padEnd(7, "0"));
}

export function stellarUsdcUnits(account: Horizon.AccountResponse): bigint {
  const balance = account.balances.find(balance =>
    balance.asset_type !== "native" && balance.asset_type !== "liquidity_pool_shares" &&
    balance.asset_code === "USDC" && balance.asset_issuer === USDC_ISSUER);
  return balance ? stellarAmountUnits(balance.balance) : 0n;
}

export function contractBytes32(address: string): string {
  check(StrKey.isValidContract(address), "Expected Stellar contract address");
  return `0x${Buffer.from(StrKey.decodeContract(address)).toString("hex")}`;
}

export function evmBytes32(address: string): string {
  check(/^0x[0-9a-fA-F]{40}$/.test(address), "Expected EVM address");
  return `0x${address.slice(2).toLowerCase().padStart(64, "0")}`;
}

export function forwarderHook(recipient: string): string {
  check(StrKey.isValidEd25519PublicKey(recipient), "Expected Stellar account recipient");
  const text = Buffer.from(recipient, "utf8");
  const hook = Buffer.alloc(32 + text.length);
  hook.writeUInt32BE(text.length, 28);
  text.copy(hook, 32);
  return `0x${hook.toString("hex")}`;
}

export interface ParsedCctpMessage {
  version: number; sourceDomain: number; destinationDomain: number;
  nonce: string; sender: string; recipient: string; destinationCaller: string;
  minFinalityThreshold: number; finalityThresholdExecuted: number;
  bodyVersion: number; burnToken: string; mintRecipient: string;
  amount: bigint; messageSender: string; maxFee: bigint; feeExecuted: bigint;
  expirationBlock: bigint; hookData: string;
}

export function parseCctpMessage(message: string): ParsedCctpMessage {
  check(/^0x(?:[0-9a-fA-F]{2})+$/.test(message), "Invalid CCTP message encoding");
  const bytes = Buffer.from(message.slice(2), "hex");
  check(bytes.length >= 376, "Truncated CCTP message");
  const hex = (offset: number, length = 32) => `0x${bytes.subarray(offset, offset + length).toString("hex")}`;
  const uint = (offset: number) => BigInt(hex(offset));
  return {
    version: bytes.readUInt32BE(0), sourceDomain: bytes.readUInt32BE(4),
    destinationDomain: bytes.readUInt32BE(8), nonce: hex(12), sender: hex(44),
    recipient: hex(76), destinationCaller: hex(108),
    minFinalityThreshold: bytes.readUInt32BE(140), finalityThresholdExecuted: bytes.readUInt32BE(144),
    bodyVersion: bytes.readUInt32BE(148), burnToken: hex(152), mintRecipient: hex(184),
    amount: uint(216), messageSender: hex(248), maxFee: uint(280),
    feeExecuted: uint(312), expirationBlock: uint(344),
    hookData: `0x${bytes.subarray(376).toString("hex")}`,
  };
}

export interface AttestationMessage {
  status: string; message: string; attestation: string; eventNonce?: string; cctpVersion?: number;
}

export async function getAttestation(domain: number, hash: string, signal: AbortSignal) {
  const url = `${IRIS}/v2/messages/${domain}?transactionHash=${encodeURIComponent(hash)}`;
  return poll(signal, "CCTP attestation", async () => {
    const response = await fetch(url, {
      signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
    });
    if (response.status === 404 || response.status === 429 || response.status >= 500) return null;
    check(response.ok, `Attestation endpoint returned HTTP ${response.status}`);
    const body = await response.json() as { messages?: AttestationMessage[] };
    const complete = body.messages?.filter(item => item.status === "complete");
    check(!complete || complete.length <= 1, "Expected exactly one CCTP burn message");
    return complete?.[0] ?? null;
  }, value => value !== null, 240_000, 3_000).then(value => {
    check(value && value.cctpVersion === 2, "Expected CCTP V2 attestation");
    check(/^0x(?:[0-9a-fA-F]{2})+$/.test(value.attestation), "Missing attestation bytes");
    return value;
  });
}

export async function submitEvm(
  wallet: Wallet, request: TransactionRequest, signal: AbortSignal,
  transactionReport: PublicReport, save: SaveReport,
): Promise<TransactionReceipt> {
  signal.throwIfAborted();
  const provider = wallet.provider;
  check(provider, "Arc provider missing");
  const populated = await wallet.populateTransaction(request);
  check(BigInt(populated.chainId ?? 0) === ARC_CHAIN_ID, "Refusing non-testnet EVM transaction");
  const signed = await wallet.signTransaction(populated);
  const hash = EvmTransaction.from(signed).hash;
  check(hash, "EVM transaction hash unavailable");
  Object.assign(transactionReport, { hash, status: "prepared", explorerUrl: `https://explorer.testnet.arc.io/tx/${hash}` });
  await save();
  signal.throwIfAborted();
  try {
    await provider.broadcastTransaction(signed);
  } catch {
    // The exact signed transaction may already have been accepted. Reconcile
    // its known hash; never create another burn because a response was lost.
    transactionReport.submissionResponse = "No success response; reconciling saved hash";
    await save();
  }
  const receipt = await poll(signal, "Arc transaction confirmation",
    () => provider.getTransactionReceipt(hash), value => value !== null);
  check(receipt, "Arc receipt missing");
  Object.assign(transactionReport, {
    status: receipt.status === 1 ? "confirmed" : "reverted", blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(), gasPrice: receipt.gasPrice.toString(),
    gasFeeNativeUsdc18: receipt.fee.toString(),
  });
  await save();
  check(receipt.status === 1, "Arc transaction reverted");
  return receipt;
}

export async function submitClassic(
  horizon: Horizon.Server, transaction: Transaction, keypair: Keypair,
  signal: AbortSignal, transactionReport: PublicReport, save: SaveReport,
) {
  transaction.sign(keypair);
  const hash = Buffer.from(transaction.hash()).toString("hex");
  Object.assign(transactionReport, { hash, status: "prepared", explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}` });
  await save();
  signal.throwIfAborted();
  try { await horizon.submitTransaction(transaction); } catch {
    transactionReport.submissionResponse = "No success response; reconciling saved hash";
    await save();
  }
  const confirmed = await poll(signal, "Stellar transaction confirmation", async () => {
    try { return await horizon.transactions().transaction(hash).call(); } catch (error) {
      if ((error as { response?: { status?: number } }).response?.status === 404) return null;
      throw new Error("Unable to read Stellar transaction confirmation");
    }
  }, value => value !== null);
  check(confirmed, "Stellar confirmation missing");
  Object.assign(transactionReport, { status: confirmed.successful ? "confirmed" : "failed", ledger: confirmed.ledger_attr, feeChargedStroops: String(confirmed.fee_charged) });
  await save();
  check(confirmed.successful, "Stellar transaction failed");
  return confirmed;
}

export async function invokeContract(
  soroban: rpc.Server, keypair: Keypair, contract: string, method: string,
  args: Parameters<Contract["call"]> extends [string, ...infer Rest] ? Rest : never,
  signal: AbortSignal, transactionReport: PublicReport, save: SaveReport,
) {
  signal.throwIfAborted();
  const account = await soroban.getAccount(keypair.publicKey());
  const raw = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(new Contract(contract).call(method, ...args)).setTimeout(180).build();
  const simulation = await soroban.simulateTransaction(raw);
  check(rpc.Api.isSimulationSuccess(simulation), "Stellar contract simulation did not succeed");
  const transaction = rpc.assembleTransaction(raw, simulation).build();
  // Resource fee cap: 1 test XLM, preventing unexpectedly expensive execution.
  check(BigInt(transaction.fee) <= 10_000_000n, "Stellar contract fee exceeds test cap");
  transaction.sign(keypair);
  const hash = Buffer.from(transaction.hash()).toString("hex");
  Object.assign(transactionReport, { hash, status: "prepared", feeBidStroops: transaction.fee,
    explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}` });
  await save();
  signal.throwIfAborted();
  try {
    const sent = await soroban.sendTransaction(transaction);
    transactionReport.submissionStatus = sent.status;
  } catch {
    transactionReport.submissionResponse = "No success response; reconciling saved hash";
  }
  await save();
  const confirmed = await poll(signal, "Stellar contract confirmation",
    () => soroban.getTransaction(hash), value => value.status !== rpc.Api.GetTransactionStatus.NOT_FOUND);
  check(confirmed.status !== rpc.Api.GetTransactionStatus.NOT_FOUND, "Stellar contract confirmation missing");
  Object.assign(transactionReport, { status: confirmed.status, ledger: confirmed.ledger,
    feeChargedStroops: confirmed.resultXdr.feeCharged.toString() });
  await save();
  check(confirmed.status === rpc.Api.GetTransactionStatus.SUCCESS, "Stellar contract transaction failed");
  return { transaction, confirmed };
}

export function bytesArgument(hex: string) {
  check(/^0x(?:[0-9a-fA-F]{2})*$/.test(hex), "Invalid bytes argument");
  return nativeToScVal(Buffer.from(hex.slice(2), "hex"), { type: "bytes" });
}
