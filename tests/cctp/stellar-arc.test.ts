import { mkdir, readFile, writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import {
  Address, Asset, BASE_FEE, Contract, Horizon, Keypair, Networks,
  TransactionBuilder, nativeToScVal, rpc, scValToNative, StrKey, xdr,
} from "@stellar/stellar-sdk";
import {
  Contract as EvmContract, Interface, Wallet, ZeroAddress, zeroPadValue,
} from "ethers";
import { expect, test } from "vitest";
import { createArcProvider, createStellarClients, invokeContract, submitEvm } from "./helpers.js";

// Fixed testnets only. Run after the inbound test has funded this Stellar wallet.
const IRIS = "https://iris-api-sandbox.circle.com";
const ARC_CHAIN_ID = 5042002n;
const ARC_USDC = "0x3600000000000000000000000000000000000000";
const ARC_MESSENGER = "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA";
const ARC_TRANSMITTER = "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275";
const STELLAR_MESSENGER = "CDNG7HXAPBWICI2E3AUBP3YZWZELJLYSB6F5CC7WLDTLTHVM74SLRTHP";
const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const AMOUNT7 = 5_000_000n; // 0.5000000 Stellar USDC.
const AMOUNT6 = 500_000n;
const MAX_FEE7 = 100_000n; // At most 0.01 USDC for the CCTP transfer fee.
const REPORT_PATH = "reports/cctp-return-testnet.json";
const mintEvents = new Interface(["event Transfer(address indexed from, address indexed to, uint256 value)"]);

type AttestedMessage = {
  message?: string;
  attestation?: string;
  status?: string;
  cctpVersion?: number;
};

function bytes(value: string): Buffer {
  if (!/^0x(?:[0-9a-fA-F]{2})+$/.test(value)) throw new Error("Invalid hex bytes");
  return Buffer.from(value.slice(2), "hex");
}

function contractBytes(address: string): Buffer {
  return Buffer.from(StrKey.decodeContract(address));
}

function amount7(value: string): bigint {
  if (!/^\d+(\.\d{1,7})?$/.test(value)) throw new Error("Invalid USDC balance");
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * 10_000_000n + BigInt(fraction.padEnd(7, "0"));
}

function usdcBalance(account: Horizon.AccountResponse): bigint {
  const balance = account.balances.find(item =>
    item.asset_type !== "native" && "asset_code" in item &&
    item.asset_code === "USDC" && item.asset_issuer === USDC_ISSUER,
  );
  if (!balance) throw new Error("Stellar USDC trustline is missing");
  return amount7(balance.balance);
}

async function poll<T>(
  signal: AbortSignal,
  read: () => Promise<T>,
  ready: (value: T) => boolean,
  timeoutMs: number,
  intervalMs = 2_000,
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    signal.throwIfAborted();
    const value = await read();
    if (ready(value)) return value;
    await delay(intervalMs, undefined, { signal });
  }
  throw new Error("Timed out; a submitted transaction can still settle");
}

function validateMessage(
  entry: AttestedMessage,
  stellarAccount: string,
  stellarUsdcContract: string,
  arcAccount: string,
  expectedMaxFee7: bigint,
): { nonce: string; fee6: bigint; net6: bigint } {
  expect(entry.status).toBe("complete");
  expect(entry.cctpVersion).toBe(2);
  const raw = bytes(entry.message ?? "");
  expect(raw.length).toBe(376); // No hook on the return leg.
  const attestation = bytes(entry.attestation ?? "");
  expect(attestation.length).toBeGreaterThan(0);
  expect(attestation.length % 65).toBe(0);
  const u256 = (offset: number): bigint => BigInt(`0x${raw.subarray(offset, offset + 32).toString("hex")}`);
  const at = (offset: number): string => raw.subarray(offset, offset + 32).toString("hex");
  const evm = (address: string): string => zeroPadValue(address, 32).slice(2).toLowerCase();
  expect(raw.readUInt32BE(0)).toBe(1);
  expect(raw.readUInt32BE(4)).toBe(27);
  expect(raw.readUInt32BE(8)).toBe(26);
  expect(at(44)).toBe(contractBytes(STELLAR_MESSENGER).toString("hex"));
  expect(at(76)).toBe(evm(ARC_MESSENGER));
  expect(at(108)).toBe(evm(arcAccount));
  expect(raw.readUInt32BE(140)).toBe(2000);
  expect(raw.readUInt32BE(144)).toBeGreaterThanOrEqual(2000);
  expect(raw.readUInt32BE(148)).toBe(1);
  expect(at(152)).toBe(contractBytes(stellarUsdcContract).toString("hex"));
  expect(at(184)).toBe(evm(arcAccount));
  expect(u256(216)).toBe(AMOUNT6);
  expect(at(248)).toBe(Buffer.from(StrKey.decodeEd25519PublicKey(stellarAccount)).toString("hex"));
  expect(u256(280)).toBe(expectedMaxFee7 / 10n);
  const fee6 = u256(312);
  expect(fee6).toBeLessThanOrEqual(expectedMaxFee7 / 10n);
  expect(fee6).toBeLessThan(AMOUNT6);
  expect(u256(344)).toBe(0n); // Standard finality has no fast-message expiry.
  const nonce = `0x${at(12)}`;
  expect(BigInt(nonce)).not.toBe(0n);
  return { nonce, fee6, net6: AMOUNT6 - fee6 };
}

test("bridges 0.5 USDC from Stellar testnet back to the Arc testnet wallet", async () => {
  const signal = AbortSignal.timeout(1_140_000);
  const { horizon, soroban: stellar } = createStellarClients(signal);
  const arc = createArcProvider();
  const resumePath = process.env.CCTP_RETURN_RESUME_REPORT;
  const previous: Record<string, unknown> | undefined = resumePath
    ? JSON.parse(await readFile(resumePath, "utf8")) as Record<string, unknown> : undefined;
  if (previous && (!previous.burnTransactionHash || (previous.mint as Record<string, unknown> | undefined)?.hash)) {
    throw new Error("Resume requires a recorded Stellar burn and no recorded Arc mint; otherwise reconcile the saved mint hash");
  }
  const report: Record<string, unknown> = {
    status: "running",
    startedAt: new Date().toISOString(),
    route: "Stellar testnet -> Arc testnet",
    sourceDomain: 27,
    destinationDomain: 26,
    asset: "Circle testnet USDC",
    amount: "0.5000000",
    scope: "Direct CCTP standard transfer; Catlog backend is not exercised",
    ...previous,
    ...(previous ? { status: "running", resumedAt: new Date().toISOString(), finishedAt: undefined } : {}),
  };
  await mkdir("reports", { recursive: true });
  const save = () => writeFile(REPORT_PATH, JSON.stringify(report, null, 2) + "\n");
  const stage = async (name: string) => { report.stage = name; await save(); };
  await save();

  try {
    await stage("load test wallets");
    const keyFile = process.env.CCTP_TEST_WALLET_FILE;
    if (!keyFile) throw new Error("CCTP_TEST_WALLET_FILE must point to the generated test wallet file");
    const stored = JSON.parse(await readFile(keyFile, "utf8")) as { arcPrivateKey?: string; stellarSecret?: string };
    if (!stored.arcPrivateKey || !stored.stellarSecret) throw new Error("Both test wallet keys are required");
    const arcWallet = new Wallet(stored.arcPrivateKey, arc);
    const stellarWallet = Keypair.fromSecret(stored.stellarSecret);
    const stellarPublicKey = stellarWallet.publicKey();
    const usdc = new Asset("USDC", USDC_ISSUER);
    const usdcContract = usdc.contractId(Networks.TESTNET);
    if (previous) {
      expect(previous.stellarAccount).toBe(stellarPublicKey);
      expect(previous.arcAccount).toBe(arcWallet.address);
      expect(previous.sourceDomain).toBe(27);
      expect(previous.destinationDomain).toBe(26);
      expect(previous.amount).toBe("0.5000000");
    }
    Object.assign(report, { stellarAccount: stellarPublicKey, arcAccount: arcWallet.address, stellarUsdcContract: usdcContract });
    await save();

    await stage("verify test networks and balances");
    expect((await arc.getNetwork()).chainId).toBe(ARC_CHAIN_ID);
    expect((await stellar.getNetwork()).passphrase).toBe(Networks.TESTNET);
    const currentStellarBalance = usdcBalance(await horizon.loadAccount(stellarPublicKey));
    const balanceBefore = previous ? BigInt(String(previous.stellarUsdcBeforeUnits7)) : currentStellarBalance;
    expect(balanceBefore).toBeGreaterThanOrEqual(AMOUNT7);
    if (previous) expect(currentStellarBalance).toBe(balanceBefore - AMOUNT7);
    expect(await arc.getBalance(arcWallet.address)).toBeGreaterThan(0n);
    report.stellarUsdcBeforeUnits7 = balanceBefore.toString();

    // The source account is also the account whose contract authorization is required.
    const build = async (contractId: string, method: string, args: xdr.ScVal[]) =>
      new TransactionBuilder(await stellar.getAccount(stellarPublicKey), {
        fee: BASE_FEE, networkPassphrase: Networks.TESTNET,
      }).addOperation(new Contract(contractId).call(method, ...args)).setTimeout(180).build();

    const invoke = async (contractId: string, method: string, args: xdr.ScVal[], prefix: string) => {
      const transactionReport: Record<string, unknown> = {};
      report[prefix] = transactionReport;
      // The shared helper saves the signed hash before broadcasting and reconciles
      // that exact transaction after any ambiguous network response.
      const { transaction, confirmed } = await invokeContract(stellar, stellarWallet,
        contractId, method, args, signal, transactionReport, save);
      const hash = Buffer.from(transaction.hash()).toString("hex");
      Object.assign(report, {
        [`${prefix}TransactionHash`]: hash,
        [`${prefix}ExplorerUrl`]: `https://stellar.expert/explorer/testnet/tx/${hash}`,
        [`${prefix}State`]: "confirmed",
        [`${prefix}Ledger`]: confirmed.ledger,
        [`${prefix}FeeStroops`]: confirmed.resultXdr.feeCharged.toString(),
      });
      await save();
      return { hash, confirmed };
    };

    const address = (value: string) => new Address(value).toScVal();
    const i128 = (value: bigint) => nativeToScVal(value, { type: "i128" });
    const u32 = (value: number) => nativeToScVal(value, { type: "u32" });
    const arcRecipient = bytes(zeroPadValue(arcWallet.address, 32));

    await stage("check standard transfer fee");
    const feeSimulation = await stellar.simulateTransaction(await build(STELLAR_MESSENGER,
      "get_min_fee_amount", [address(usdcContract), i128(AMOUNT7)]));
    if (!rpc.Api.isSimulationSuccess(feeSimulation) || !feeSimulation.result) throw new Error("Fee query failed");
    const minFee7 = BigInt(scValToNative(feeSimulation.result.retval));
    expect(minFee7).toBeGreaterThanOrEqual(0n);
    expect(minFee7).toBeLessThanOrEqual(MAX_FEE7);
    expect(minFee7 % 10n).toBe(0n);
    report.minimumFeeUnits7 = minFee7.toString();
    report.maximumFeeUnits7 = MAX_FEE7.toString();

    await stage("approve exact Stellar USDC amount");
    const approvalExpiry = previous ? Number(previous.approvalExpiryLedger)
      : (await stellar.getLatestLedger()).sequence + 120;
    report.approvalExpiryLedger = approvalExpiry;
    if (!previous) await invoke(usdcContract, "approve", [address(stellarPublicKey), address(STELLAR_MESSENGER),
      i128(AMOUNT7), u32(approvalExpiry)], "approval");

    await stage("burn Stellar USDC");
    const burned = previous ? { hash: String(previous.burnTransactionHash) } : await invoke(STELLAR_MESSENGER, "deposit_for_burn", [
      address(stellarPublicKey), i128(AMOUNT7), u32(26), xdr.ScVal.scvBytes(arcRecipient),
      address(usdcContract), xdr.ScVal.scvBytes(arcRecipient), i128(MAX_FEE7), u32(2000),
    ], "burn");
    if (previous) {
      const recordedBurn = await stellar.getTransaction(burned.hash);
      expect(recordedBurn.status).toBe(rpc.Api.GetTransactionStatus.SUCCESS);
    }
    const afterBurn = await poll(signal, () => horizon.loadAccount(stellarPublicKey),
      account => usdcBalance(account) === balanceBefore - AMOUNT7, 60_000);
    report.stellarUsdcAfterBurnUnits7 = usdcBalance(afterBurn).toString();
    await save();

    await stage("wait for Circle attestation");
    const attestationUrl = `${IRIS}/v2/messages/27?transactionHash=${burned.hash}`;
    report.attestationUrl = attestationUrl;
    await save();
    const message = await poll<AttestedMessage | undefined>(signal, async () => {
      const response = await fetch(attestationUrl, { signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]) });
      if (response.status === 404 || response.status === 429 || response.status >= 500) return undefined;
      if (!response.ok) throw new Error("Attestation query rejected");
      const data = await response.json() as { messages?: AttestedMessage[] };
      if (!Array.isArray(data.messages) || data.messages.length === 0) return undefined;
      expect(data.messages).toHaveLength(1);
      return data.messages[0];
    }, item => item?.status === "complete", 720_000, 5_000);
    if (!message?.message || !message.attestation) throw new Error("Attestation missing");
    const decoded = validateMessage(message, stellarPublicKey, usdcContract, arcWallet.address, MAX_FEE7);
    Object.assign(report, {
      attestationStatus: message.status, cctpNonce: decoded.nonce,
      cctpFeeUnits6: decoded.fee6.toString(), arcMintAmountUnits6: decoded.net6.toString(),
      message: message.message, attestation: message.attestation,
      rawMessageFieldsVerified: true,
    });
    await save();

    await stage("mint USDC on Arc");
    const transmitter = new EvmContract(ARC_TRANSMITTER, [
      "function receiveMessage(bytes message, bytes attestation) returns (bool)",
      "function usedNonces(bytes32 nonce) view returns (uint256)",
    ], arcWallet);
    expect(await transmitter.usedNonces(decoded.nonce)).toBe(0n);
    const request = await transmitter.receiveMessage.populateTransaction(message.message, message.attestation);
    const populated = await arcWallet.populateTransaction(request);
    expect(BigInt(populated.chainId ?? 0)).toBe(ARC_CHAIN_ID);
    expect(String(populated.to).toLowerCase()).toBe(ARC_TRANSMITTER.toLowerCase());
    const gasPriceCap = BigInt(populated.maxFeePerGas ?? populated.gasPrice ?? 0);
    expect(gasPriceCap).toBeGreaterThan(0n);
    expect(BigInt(populated.gasLimit ?? 0) * gasPriceCap).toBeLessThanOrEqual(10n ** 18n); // At most 1 test USDC for gas.
    const mintReport: Record<string, unknown> = {};
    report.mint = mintReport;
    const receipt = await submitEvm(arcWallet, populated, signal, mintReport, save);
    report.mintTransactionHash = receipt.hash;
    report.mintExplorerUrl = `https://explorer.testnet.arc.io/tx/${receipt.hash}`;
    expect(receipt.status).toBe(1);
    expect(receipt.from.toLowerCase()).toBe(arcWallet.address.toLowerCase());
    expect(receipt.to?.toLowerCase()).toBe(ARC_TRANSMITTER.toLowerCase());
    expect(await transmitter.usedNonces(decoded.nonce)).toBe(1n);

    const minted = receipt.logs.filter(log => log.address.toLowerCase() === ARC_USDC.toLowerCase())
      .map(log => { try { return mintEvents.parseLog(log); } catch { return null; } })
      .filter(event => event?.name === "Transfer" &&
        String(event.args.from).toLowerCase() === ZeroAddress &&
        String(event.args.to).toLowerCase() === arcWallet.address.toLowerCase());
    expect(minted).toHaveLength(1);
    expect(minted[0]!.args.value).toBe(decoded.net6);
    const nativeBefore = await arc.getBalance(arcWallet.address, receipt.blockNumber - 1);
    const nativeAfter = await arc.getBalance(arcWallet.address, receipt.blockNumber);
    expect(nativeAfter - nativeBefore + receipt.fee).toBe(decoded.net6 * 1_000_000_000_000n);
    signal.throwIfAborted();
    Object.assign(report, {
      status: "passed", stage: "complete", finishedAt: new Date().toISOString(), mintState: "confirmed",
      mintBlock: receipt.blockNumber, mintEventVerified: true, cctpNonceUsed: true,
      arcNativeBeforeUnits18: nativeBefore.toString(), arcNativeAfterUnits18: nativeAfter.toString(),
      arcGasFeeUnits18: receipt.fee.toString(), arcBalanceAccountsForGas: true,
    });
    await save();
    console.log(`Verified CCTP Stellar -> Arc testnet: ${report.mintExplorerUrl}`);
  } catch {
    report.status = "failed";
    report.finishedAt = new Date().toISOString();
    await save();
    // SDK errors can contain request/signing context; keep reports and failures public-only.
    throw new Error(`CCTP return test failed at: ${String(report.stage)}. Check ${REPORT_PATH}; a submitted transfer may still settle.`);
  } finally {
    arc.destroy();
  }
});
