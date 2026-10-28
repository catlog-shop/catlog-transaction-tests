import { parseArgs } from "node:util";
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { parseUnits } from "ethers";
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    "refund-address": { type: "string" },
    "stellar-recipient": { type: "string" },
    amount: { type: "string", default: "1" },
    "idempotency-key": { type: "string" },
    "max-source": { type: "string", default: "2" },
  },
});
const url = process.env.CATLOG_BACKEND_URL,
  key = process.env.CATLOG_API_KEY;
if (!url || !key) throw Error("Load the supplied .env.catlog configuration.");
const origin = new URL(url);
if (
  origin.protocol !== "https:" ||
  origin.username ||
  origin.password ||
  origin.pathname !== "/" ||
  origin.search ||
  origin.hash
)
  throw Error("Use the supplied HTTPS backend origin.");
const [command, provider, sourceChain] = positionals;
mkdirSync(".catlog-sessions", { recursive: true, mode: 0o700 });
if (command === "create") {
  const input = {
    idempotencyKey: values["idempotency-key"] ?? randomUUID(),
    provider,
    sourceChain,
    amountAtomic7: parseUnits(values.amount, 7).toString(),
    maximumSourceAtomic6: parseUnits(values["max-source"], 6).toString(),
    ...(values["refund-address"]
      ? { refundAddress: values["refund-address"] }
      : {}),
    ...(values["stellar-recipient"]
      ? { stellarRecipient: values["stellar-recipient"] }
      : {}),
  };
  const response = await fetch(origin.origin + "/catlog/v1/live/sessions", {
    method: "POST",
    redirect: "error",
    headers: {
      authorization: "Bearer " + key,
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(90000),
  });
  const result = await response.json();
  if (!response.ok) throw Error(result.error ?? "LIVE_SESSION_FAILED");
  const file = ".catlog-sessions/" + result.id + ".json";
  writeFileSync(
    file,
    JSON.stringify({ origin: origin.origin, input, ...result }, null, 2) + "\n",
    { mode: 0o600 },
  );
  const { sessionToken, ...publicResult } = result;
  console.log(
    JSON.stringify(
      { ...publicResult, statusCommand: "npm run live:status -- " + result.id },
      null,
      2,
    ),
  );
} else if (command === "status") {
  const id = provider;
  if (!/^[a-f0-9-]{36}$/.test(id ?? ""))
    throw Error("Provide the live session ID.");
  const file = ".catlog-sessions/" + id + ".json";
  if (!existsSync(file))
    throw Error("Keep the session file created with this payment.");
  const saved = JSON.parse(readFileSync(file, "utf8"));
  if (saved.origin !== origin.origin)
    throw Error("Saved session belongs to another backend.");
  const response = await fetch(
    origin.origin + "/catlog/v1/live/sessions/" + id + "/status",
    {
      headers: { "x-catlog-session": saved.sessionToken },
      redirect: "error",
      signal: AbortSignal.timeout(30000),
    },
  );
  const result = await response.json();
  if (!response.ok) throw Error(result.error ?? "STATUS_FAILED");
  writeFileSync(file, JSON.stringify({ ...saved, ...result }, null, 2) + "\n", {
    mode: 0o600,
  });
  console.log(JSON.stringify(result, null, 2));
} else
  throw Error(
    "Use: create near ethereum|base|tron --refund-address <public address> --stellar-recipient <G...> [--amount 1], create cctp arc [--amount 1], or status <session-id>.",
  );
