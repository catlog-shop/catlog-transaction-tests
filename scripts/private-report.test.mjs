import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateReport } from "./private-report.mjs";

// Synthetic reporter fixtures test only this packaging utility, never Catlog behavior.
const manifest = [{ file: "tests/example.test.ts", cases: 2 }];
const root = "/fixture";
const fixture = () => ({ success: true, numTotalTests: 2, numPassedTests: 2,
  numFailedTests: 0, numPendingTests: 0, numTodoTests: 0, numFailedTestSuites: 0, numPendingTestSuites: 0,
  testResults: [{ name: "/fixture/tests/example.test.ts", status: "passed",
    assertionResults: [{ status: "passed", failureMessages: [] }, { status: "passed", failureMessages: [] }] }],
});
const evaluate = (report, typeExit = 0, testExit = 0) => evaluateReport(report, manifest, root, typeExit, testExit);

test("report evaluator accepts a complete successful run", () => {
  assert.equal(evaluate(fixture()).result, "passed");
});
test("skipped and todo cases cannot produce a passing summary", () => {
  for (const state of ["skipped", "todo", "pending", "disabled"]) {
    const report = fixture(); report.testResults[0].assertionResults[0].status = state;
    assert.equal(evaluate(report).result, "failed");
  }
});
test("a failure remains a failure even if aggregate counters say passed", () => {
  const report = fixture(); report.testResults[0].assertionResults[0].status = "failed";
  assert.equal(evaluate(report).result, "failed");
});
test("failed suite setup, missing files and duplicate files cannot pass", () => {
  const report = fixture(); report.testResults[0].status = "failed";
  assert.equal(evaluate(report).result, "failed");
  report.testResults = []; assert.equal(evaluate(report).result, "failed");
  const duplicate = fixture(); duplicate.testResults.push(duplicate.testResults[0]);
  assert.equal(evaluate(duplicate).result, "failed");
});
test("wrong case counts, nonzero exits and missing reports cannot pass", () => {
  const report = fixture(); report.testResults[0].assertionResults.pop();
  assert.equal(evaluate(report).result, "failed");
  assert.equal(evaluate(fixture(), 1, 0).result, "failed");
  assert.equal(evaluate(fixture(), 0, 1).result, "failed");
  assert.equal(evaluate(undefined).result, "failed");
});
test("summary omits assertion payloads and private absolute paths", () => {
  const report = fixture(); report.testResults[0].message = "PRIVATE_RESPONSE_CONTENT";
  report.testResults[0].assertionResults[0].failureMessages = ["PRIVATE_RESPONSE_CONTENT"];
  const summary = JSON.stringify(evaluate(report));
  assert.equal(summary.includes("PRIVATE_RESPONSE_CONTENT"), false);
  assert.equal(summary.includes(root), false);
  assert.equal(evaluate(report).result, "failed");
});
