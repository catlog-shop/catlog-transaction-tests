import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Keypair } from "@stellar/stellar-sdk";
import { Wallet } from "ethers";

const file = resolve(process.argv[2] ?? ".env.cctp-wallet.json");
const arc = Wallet.createRandom();
const stellar = Keypair.random();
// Never overwrite an existing wallet or print its private keys.
await writeFile(file, JSON.stringify({
  arcPrivateKey: arc.privateKey,
  stellarSecret: stellar.secret(),
}, null, 2) + "\n", { mode: 0o600, flag: "wx" });
console.log(JSON.stringify({
  walletFile: file,
  arcAddress: arc.address,
  stellarAddress: stellar.publicKey(),
  network: "testnet",
}, null, 2));
