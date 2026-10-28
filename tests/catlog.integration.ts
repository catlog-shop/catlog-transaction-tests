import type { CatlogHarness } from "./harness";
import { backendFactory } from "./backend-adapter";

/**
 * Implement createHarness in the private module selected by CATLOG_BACKEND_ADAPTER.
 *
 * 1. Start Catlog against an isolated database using its normal database engine.
 * 2. Create two isolated merchants, supported assets and valid recipients.
 * 3. Inject a controllable provider at the external network boundary only.
 * 4. Bind the methods in harness.ts to actual services, workers and DB reads.
 * 5. Return a fresh fixture with deposits enabled for every test.
 *
 * Do not implement a second transaction system here. A fake database or
 * hard-coded balances would test that fake, not Catlog.
 */
export async function createHarness(): Promise<CatlogHarness> {
  return (await backendFactory("createHarness"))();
}
