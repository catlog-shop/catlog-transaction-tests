import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { CatlogHarness } from "./harness";
import type { OperationsHarness } from "./operations/harness";

export interface BackendBindings {
  createHarness(): Promise<CatlogHarness>;
  createOperationsHarness(): Promise<OperationsHarness>;
}

/** Load developer-owned bindings without copying private backend code into this repository. */
export async function backendFactory<K extends keyof BackendBindings>(name: K): Promise<BackendBindings[K]> {
  const adapterPath = process.env.CATLOG_BACKEND_ADAPTER;
  if (!adapterPath?.trim()) {
    throw new Error("CATLOG_BACKEND_ADAPTER_REQUIRED: Set CATLOG_BACKEND_ADAPTER to a private module " +
      "exporting createHarness and createOperationsHarness. " +
      "A real Catlog backend connection is required; no default implementation is provided.");
  }
  const adapter = await import(/* @vite-ignore */ pathToFileURL(resolve(adapterPath)).href);
  if (typeof adapter[name] !== "function") {
    throw new Error(`CATLOG_BACKEND_EXPORT_REQUIRED: The private adapter must export ${name}().`);
  }
  return adapter[name] as BackendBindings[K];
}
