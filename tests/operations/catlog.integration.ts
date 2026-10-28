import type { OperationsHarness } from "./harness";
import { backendFactory } from "../backend-adapter";

/**
 * Bind to Catlog's real backend, durable queue, database and support API.
 * Export this factory from the private module selected by CATLOG_BACKEND_ADAPTER.
 * Configure TEST_POLICY and START_TIME_MS from harness.ts in an isolated namespace.
 * Return all three REQUIRED_ROUTES, including the actual NEAR source network.
 * Normalize auth errors to UNAUTHENTICATED/FORBIDDEN and retry of terminal rows
 * to NOT_RECOVERABLE (Error objects with a string code field). Missing fixtures must fail, never skip a required route.
 *
 * Provider plans must remain at the external boundary. Accepted submissions have
 * stable wire/submission identities; a lost response must not create a second
 * source transfer. Never implement provider deduplication that does not exist.
 * observe() changes only remote state; deliver() enters the real webhook handler.
 * Queue restarts and leases must use persistent application storage. Support
 * reads/actions must use real authentication, not a local implementation of the UI.
 * Do not build an in-memory Catlog substitute or write settlement rows from tests.
 */
export async function createOperationsHarness(): Promise<OperationsHarness> {
  return (await backendFactory("createOperationsHarness"))();
}
