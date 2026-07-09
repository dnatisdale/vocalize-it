import { advancedOfflineDistill, benchmarkCleaners } from "./src/utils/contentDistiller.js";
import fs from "fs";
import path from "path";

const docsDir = path.join(process.cwd(), "test-documents");

function runTest(filename) {
  const text = fs.readFileSync(path.join(docsDir, filename), "utf8");
  console.log(`\n=== Testing ${filename} ===`);
  const result = advancedOfflineDistill(text);
  console.log("Hints:", result.documentHints);
  console.log("Removed:", result.removedSections);
  console.log("Benchmarks:", benchmarkCleaners(text));
}

runTest("newsletter-sample.txt");
runTest("email-sample.txt");
runTest("government-notice-sample.txt");
runTest("training-guide-sample.txt");
