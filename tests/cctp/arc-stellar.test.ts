import { mkdir, readFile, writeFile } from "node:fs/promises";
import { BASE_FEE, Keypair, Networks, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { Contract, Interface, Wallet } from "ethers";
import { test } from "vitest";
import {
  ARC_CHAIN_ID, ARC_USDC, ARC_TOKEN_MESSENGER, ARC_MESSAGE_TRANSMITTER,
  CCTP_FORWARDER, STELLAR_TOKEN_MESSENGER, HORIZON, STELLAR_USDC, USDC_ISSUER,
  bytesArgument, check, contractBytes32, createArcProvider, createStellarClients,
  evmBytes32, forwarderHook, getAttestation, invokeContract, parseCctpMessage,
  poll, requestJson, stellarUsdcUnits, submitClassic, submitEvm,
  type PublicReport,
} from "./helpers.js";

const AMOUNT = 1_000_000n; // Six-decimal CCTP / ERC20 units: exactly 1 USDC.
const MAX_CCTP_FEE = 10_000n; // At most 0.01 test USDC.
const REPORT_PATH = "reports/cctp-testnet.json";
const erc20Interface = new Interface([
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
]);
const messengerInterface = new Interface([
  "function getMinFeeAmount(uint256) view returns (uint256)",
  "function depositForBurnWithHook(uint256,uint32,bytes32,address,bytes32,uint256,uint32,bytes)",
]);
const messageInterface = new Interface(["event MessageSent(bytes message)"]);

test("real CCTP USDC burn on Arc settles once on Stellar testnet", async () => {
  const signal = AbortSignal.timeout(18 * 60_000);
  const provider = createArcProvider();
  const { horizon, soroban } = createStellarClients(signal);
  await mkdir("reports", { recursive: true });
  const resumePath = process.env.CCTP_RESUME_REPORT;
  const previous: PublicReport | undefined = resumePath
    ? JSON.parse(await readFile(resumePath, "utf8")) as PublicReport : undefined;
  if (previous) {
    check(previous.status === "failed" && (previous.arcBurn as PublicReport)?.hash, "Resume requires a failed report with a recorded burn");
    check(!(previous.stellarMint as PublicReport | undefined)?.hash, "A mint is already recorded; reconcile that hash before resuming");
  }
  const report: PublicReport = {
    status: "running", stage: "initializing", startedAt: new Date().toISOString(),
    scope: "Direct Circle CCTP Arc-to-Stellar testnet transfer; Catlog backend not exercised",
    sourceNetwork: "arc-testnet", destinationNetwork: "stellar-testnet",
    amount: "1.000000", asset: "USDC", sourceAsset: ARC_USDC, stellarIssuer: USDC_ISSUER,
    sourceDomain: 26, destinationDomain: 27, arcChainId: ARC_CHAIN_ID.toString(),
    precision: { cctpAndArcErc20Decimals: 6, arcNativeGasDecimals: 18, stellarAssetDecimals: 7 },
    ...previous,
    ...(previous ? { status: "running", stage: "resuming recorded burn", resumedAt: new Date().toISOString(), finishedAt: undefined } : {}),
  };
  const save = () => writeFile(REPORT_PATH, JSON.stringify(report, null, 2) + "\n");
  const stage = async (value: string) => { report.stage = value; await save(); };
  await save();

  try {
    let arc: Wallet;
    let stellar: Keypair;
    if (process.env.CCTP_TEST_WALLET_FILE) {
      const keys = JSON.parse(await readFile(process.env.CCTP_TEST_WALLET_FILE, "utf8")) as {
        arcPrivateKey?: string; stellarSecret?: string;
      };
      check(typeof keys.arcPrivateKey === "string" && typeof keys.stellarSecret === "string", "Test wallet file is missing keys");
      arc = new Wallet(keys.arcPrivateKey, provider);
      stellar = Keypair.fromSecret(keys.stellarSecret);
    } else {
      arc = new Wallet(Wallet.createRandom().privateKey, provider);
      stellar = Keypair.random();
    }
    if (previous) {
      check(previous.sourceAddress === arc.address && previous.recipientAddress === stellar.publicKey(), "Resume wallet addresses differ");
      check(previous.sourceDomain === 26 && previous.destinationDomain === 27 && previous.amount === "1.000000", "Resume route or amount differs");
    }
    report.sourceAddress = arc.address;
    report.recipientAddress = stellar.publicKey();
    await save();
    check((await provider.getNetwork()).chainId === ARC_CHAIN_ID, "Arc endpoint is not the expected testnet");
    const network = await requestJson<{ network_passphrase?: string }>(HORIZON, signal);
    check(network.network_passphrase === Networks.TESTNET, "Horizon endpoint is not Stellar testnet");
    check((await soroban.getNetwork()).passphrase === Networks.TESTNET, "Soroban endpoint is not Stellar testnet");

    await stage("preparing Stellar recipient");
    let stellarAccount;
    try { stellarAccount = await horizon.loadAccount(stellar.publicKey()); } catch (error) {
      check((error as { response?: { status?: number } }).response?.status === 404, "Unable to inspect Stellar recipient");
      const funded = await requestJson<{ hash?: string }>(
        `https://friendbot.stellar.org/?addr=${encodeURIComponent(stellar.publicKey())}`, signal);
      report.stellarFundingTransactionHash = funded.hash;
      await save();
      stellarAccount = await poll(signal, "Stellar funding", async () => {
        try { return await horizon.loadAccount(stellar.publicKey()); } catch { return null; }
      }, value => value !== null, 60_000);
      check(stellarAccount, "Stellar account was not funded");
    }
    const hasTrustline = stellarAccount.balances.some(balance =>
      balance.asset_type !== "native" && balance.asset_type !== "liquidity_pool_shares" &&
      balance.asset_code === "USDC" && balance.asset_issuer === USDC_ISSUER);
    if (!hasTrustline) {
      const trustlineReport: PublicReport = {};
      report.stellarTrustline = trustlineReport;
      const transaction = new TransactionBuilder(stellarAccount, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
        .addOperation(Operation.changeTrust({ asset: STELLAR_USDC, limit: "100.0000000" }))
        .setTimeout(180).build();
      await submitClassic(horizon, transaction, stellar, signal, trustlineReport, save);
    }
    const currentStellarBalance = stellarUsdcUnits(await horizon.loadAccount(stellar.publicKey()));
    const stellarBefore = previous ? BigInt(String(previous.stellarBalanceBefore7)) : currentStellarBalance;
    check(currentStellarBalance === stellarBefore, "Stellar balance changed since the recorded burn; reconcile before resuming");
    report.stellarBalanceBefore7 = stellarBefore.toString();

    await stage("waiting for Arc faucet funding");
    console.log(`Fund this Arc TESTNET address through https://faucet.circle.com: ${arc.address}`);
    const token = new Contract(ARC_USDC, erc20Interface, provider);
    const messenger = new Contract(ARC_TOKEN_MESSENGER, messengerInterface, provider);
    if (!previous) await poll(signal, "Arc faucet funding", async () => ({
      token: BigInt(await token.balanceOf(arc.address)), native: await provider.getBalance(arc.address),
    }), value => value.token >= 2_000_000n && value.native >= 2n * 10n ** 18n, 10 * 60_000, 5_000);
    const arcBefore18 = previous ? BigInt(String(previous.arcBalanceBefore18)) : await provider.getBalance(arc.address);
    const arcBefore6 = previous ? BigInt(String(previous.arcBalanceBefore6)) : BigInt(await token.balanceOf(arc.address));
    check(arcBefore6 === arcBefore18 / 10n ** 12n, "Arc native and ERC20 USDC balances do not reconcile");
    report.arcBalanceBefore6 = arcBefore6.toString();
    report.arcBalanceBefore18 = arcBefore18.toString();
    const maxFee = previous ? BigInt(String(previous.maxFee6)) : BigInt(await messenger.getMinFeeAmount(AMOUNT));
    check(maxFee <= MAX_CCTP_FEE && maxFee < AMOUNT, "CCTP fee exceeds test cap");
    report.maxFee6 = maxFee.toString();
    await save();

    await stage("approving exact burn amount");
    const approvalReport: PublicReport = previous ? previous.arcApproval as PublicReport : {};
    report.arcApproval = approvalReport;
    const approval = previous ? await provider.getTransactionReceipt(String(approvalReport.hash)) : await submitEvm(arc, {
      to: ARC_USDC, data: erc20Interface.encodeFunctionData("approve", [ARC_TOKEN_MESSENGER, AMOUNT]),
    }, signal, approvalReport, save);
    check(approval?.status === 1 && approval.from.toLowerCase() === arc.address.toLowerCase() && approval.to?.toLowerCase() === ARC_USDC.toLowerCase(), "Invalid source approval receipt");
    if (!previous) check(BigInt(await token.allowance(arc.address, ARC_TOKEN_MESSENGER)) === AMOUNT, "Expected exact USDC burn allowance");

    await stage("burning USDC on Arc");
    const hook = forwarderHook(stellar.publicKey());
    const forwarder = contractBytes32(CCTP_FORWARDER);
    const burnReport: PublicReport = previous ? previous.arcBurn as PublicReport : {};
    report.arcBurn = burnReport;
    const burn = previous ? await provider.getTransactionReceipt(String(burnReport.hash)) : await submitEvm(arc, {
      to: ARC_TOKEN_MESSENGER,
      data: messengerInterface.encodeFunctionData("depositForBurnWithHook", [
        AMOUNT, 27, forwarder, ARC_USDC, forwarder, maxFee, 2000, hook,
      ]),
    }, signal, burnReport, save);
    check(burn?.status === 1 && burn.from.toLowerCase() === arc.address.toLowerCase() && burn.to?.toLowerCase() === ARC_TOKEN_MESSENGER.toLowerCase(), "Invalid source burn receipt");
    const sourceMessages = burn.logs.filter(log => log.address.toLowerCase() === ARC_MESSAGE_TRANSMITTER.toLowerCase())
      .flatMap(log => {
        try { const parsed = messageInterface.parseLog(log); return parsed?.name === "MessageSent" ? [String(parsed.args.message)] : []; }
        catch { return []; }
      });
    check(sourceMessages.length === 1, "Expected one source MessageSent event");
    report.sourceMessage = sourceMessages[0];
    // Public wallets can receive unrelated credits between our transactions.
    // Compare each confirmed transaction with its immediately preceding block.
    const [approvalBefore18, approvalAfter18, burnBefore18, arcAfter18] = await Promise.all([
      provider.getBalance(arc.address, approval.blockNumber - 1),
      provider.getBalance(arc.address, approval.blockNumber),
      provider.getBalance(arc.address, burn.blockNumber - 1),
      provider.getBalance(arc.address, burn.blockNumber),
    ]);
    check(approvalAfter18 === approvalBefore18 - approval.fee, "Arc approval balance does not reconcile with gas");
    check(arcAfter18 === burnBefore18 - AMOUNT * 10n ** 12n - burn.fee, "Arc burn balance does not reconcile with amount and gas");
    check(BigInt(await token.allowance(arc.address, ARC_TOKEN_MESSENGER, { blockTag: burn.blockNumber })) === 0n, "Burn allowance was not consumed");
    Object.assign(report, {
      arcApprovalBalanceBefore18: approvalBefore18.toString(), arcApprovalBalanceAfter18: approvalAfter18.toString(),
      arcBurnBalanceBefore18: burnBefore18.toString(), arcBalanceAfter18: arcAfter18.toString(),
      arcInterveningBalanceChange18: (burnBefore18 - approvalAfter18).toString(),
      arcBalanceAfter6: String(await token.balanceOf(arc.address, { blockTag: burn.blockNumber })),
      arcGasFeeNativeUsdc18: (approval.fee + burn.fee).toString(),
      arcTransactionBalancesVerified: true,
    });
    await save();

    await stage("waiting for Circle attestation");
    const attested = await getAttestation(26, burn.hash, signal);
    report.message = attested.message;
    report.attestation = attested.attestation;
    const message = parseCctpMessage(attested.message);
    const sourceMessage = parseCctpMessage(sourceMessages[0]);
    // Circle assigns the nonce and finality/fee metadata. Verify all immutable
    // source fields and all expected routing/amount fields before minting.
    check(message.version === 1 && message.bodyVersion === 1, "Unexpected CCTP message version");
    check(message.sourceDomain === 26 && message.destinationDomain === 27, "Wrong CCTP domains");
    check(message.sender === evmBytes32(ARC_TOKEN_MESSENGER), "Wrong source messenger");
    check(message.recipient === contractBytes32(STELLAR_TOKEN_MESSENGER), "Wrong Stellar messenger");
    check(message.destinationCaller === forwarder && message.mintRecipient === forwarder, "Wrong Stellar forwarder routing");
    check(message.burnToken === evmBytes32(ARC_USDC) && message.messageSender === evmBytes32(arc.address), "Wrong USDC asset or source wallet");
    check(message.amount === AMOUNT && message.maxFee === maxFee && message.feeExecuted <= maxFee, "Wrong CCTP amount or fee");
    check(message.minFinalityThreshold === 2000 && message.finalityThresholdExecuted >= 2000, "CCTP message has insufficient finality");
    check(message.hookData === hook && message.expirationBlock === 0n, "Unexpected forwarding hook or expiry");
    for (const key of ["version", "sourceDomain", "destinationDomain", "bodyVersion", "minFinalityThreshold", "sender", "recipient", "destinationCaller", "burnToken", "mintRecipient", "amount", "messageSender", "maxFee", "hookData"] as const) {
      check(message[key] === sourceMessage[key], `Attestation differs from source event: ${key}`);
    }
    report.messageNonce = message.nonce;
    report.feeExecuted6 = message.feeExecuted.toString();
    report.rawMessageFieldsVerified = true;
    const expectedCredit7 = (AMOUNT - message.feeExecuted) * 10n;
    report.expectedStellarCredit7 = expectedCredit7.toString();
    await save();

    await stage("minting and forwarding USDC on Stellar");
    const mintReport: PublicReport = {};
    report.stellarMint = mintReport;
    const { transaction } = await invokeContract(soroban, stellar, CCTP_FORWARDER, "mint_and_forward",
      [bytesArgument(attested.message), bytesArgument(attested.attestation)], signal, mintReport, save);
    const afterMint = await poll(signal, "Stellar USDC credit", () => horizon.loadAccount(stellar.publicKey()),
      account => stellarUsdcUnits(account) === stellarBefore + expectedCredit7);
    report.stellarBalanceAfter7 = stellarUsdcUnits(afterMint).toString();
    report.stellarCreditMatchesCctpAmountAndFee = true;

    await stage("checking exact Stellar envelope replay");
    const sequenceAfter = afterMint.sequenceNumber();
    const nativeAfter = afterMint.balances.find(item => item.asset_type === "native")?.balance;
    // Horizon acknowledges the existing confirmed transaction. Soroban RPC may
    // return TRY_AGAIN_LATER even for an already ingested envelope.
    const replay = await horizon.submitTransaction(transaction);
    check(replay.hash === mintReport.hash && replay.successful, "Stellar replay was not recognized");
    check(replay.ledger === mintReport.ledger, "Replay returned a different ledger");
    const afterReplay = await horizon.loadAccount(stellar.publicKey());
    check(stellarUsdcUnits(afterReplay) === stellarUsdcUnits(afterMint), "Stellar replay changed USDC balance");
    check(afterReplay.sequenceNumber() === sequenceAfter, "Stellar replay changed sequence");
    check(afterReplay.balances.find(item => item.asset_type === "native")?.balance === nativeAfter, "Stellar replay charged another fee");
    report.replay = { hash: replay.hash, response: "SUCCESS", ledger: replay.ledger, balancesAndSequenceUnchanged: true };
    signal.throwIfAborted();
    Object.assign(report, { status: "passed", stage: "complete", finishedAt: new Date().toISOString() });
    await save();
    console.log(`Verified Arc burn: https://explorer.testnet.arc.io/tx/${burn.hash}`);
    console.log(`Verified Stellar mint: ${mintReport.explorerUrl}`);
  } catch {
    report.status = "failed";
    report.finishedAt = new Date().toISOString();
    await save();
    // SDK errors may contain request objects. Keep public failures and reports
    // limited to the stage and recorded public identifiers.
    throw new Error(`CCTP test failed during ${String(report.stage)}. Inspect ${REPORT_PATH}; do not repeat a recorded burn automatically.`);
  } finally {
    provider.destroy();
  }
}, 20 * 60_000);
