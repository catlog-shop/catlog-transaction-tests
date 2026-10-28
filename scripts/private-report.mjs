import { relative } from "node:path";

/** Summarize only allowlisted counts and filenames; never copy logs or assertion payloads. */
export function evaluateReport(report, manifest, root, typecheckExitCode, testExitCode) {
  const expected = manifest.reduce((sum, item) => sum + item.cases, 0);
  const empty = { result: "failed", expected, collected: 0, passed: 0, failed: 0, skipped: 0, files: [] };
  if (!report || !Array.isArray(report.testResults)) return empty;
  const files = manifest.map(item => {
    const matches = report.testResults.filter(file => typeof file.name === "string" &&
      relative(root, file.name).replaceAll("\\", "/") === item.file);
    const assertions = matches.length === 1 && Array.isArray(matches[0].assertionResults) ? matches[0].assertionResults : [];
    return { file: item.file, expected: item.cases, collected: assertions.length,
      passed: assertions.filter(test => test.status === "passed").length,
      failed: assertions.filter(test => test.status === "failed").length,
      skipped: assertions.filter(test => !["passed", "failed"].includes(test.status)).length,
      complete: matches.length === 1 && matches[0].status === "passed" && assertions.length === item.cases &&
        assertions.every(test => test.status === "passed" && (!test.failureMessages || test.failureMessages.length === 0)),
    };
  });
  const counts = files.reduce((sum, file) => ({ collected: sum.collected + file.collected,
    passed: sum.passed + file.passed, failed: sum.failed + file.failed, skipped: sum.skipped + file.skipped }),
  { collected: 0, passed: 0, failed: 0, skipped: 0 });
  const passed = typecheckExitCode === 0 && testExitCode === 0 && report.success === true &&
    report.numTotalTests === expected && report.numPassedTests === expected &&
    report.numFailedTests === 0 && report.numPendingTests === 0 && report.numTodoTests === 0 &&
    report.numFailedTestSuites === 0 && report.numPendingTestSuites === 0 &&
    report.testResults.length === manifest.length && files.every(file => file.complete);
  return { result: passed ? "passed" : "failed", expected, ...counts, files };
}
