import type { CatlogHarness } from "./harness";

/**
 * IMPLEMENT THIS FUNCTION IN CATLOG'S BACKEND REPOSITORY.
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
  throw new Error(
    "CATLOG_SETUP_REQUIRED: Implement tests/catlog.integration.ts using " +
    "Catlog's real backend and an isolated test database. " +
    "Catlog tests cannot run until the backend connection is configured.",
  );
}
