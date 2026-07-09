const fs = require('fs');
const path = require('path');

// Dynamically import the layout analyzer from the src directory
async function runTests() {
  // Use a dynamic import since the project is type: module
  const { analyzeLayout } = await import('./src/utils/layoutAnalyzer.js');

  const testDocsDir = path.join(__dirname, 'test-documents', 'layout-recovery');
  const expectedDir = path.join(__dirname, 'expected-output', 'layout-recovery');

  const testFiles = fs.readdirSync(testDocsDir).filter(f => f.endsWith('.txt'));

  let totalScore = 0;
  const maxPossibleScore = testFiles.length * 10; // 10 points per test

  console.log("==================================================");
  console.log("RUNNING DOCUMENT LAYOUT INTELLIGENCE TESTS");
  console.log("==================================================\n");

  for (const filename of testFiles) {
    const rawText = fs.readFileSync(path.join(testDocsDir, filename), 'utf8');
    const expected = fs.readFileSync(path.join(expectedDir, filename), 'utf8');

    const result = analyzeLayout(rawText);

    // Basic scoring based on how many lines of the expected output appear in the result IN ORDER
    const expectedLines = expected.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const resultLines = result.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    let matchCount = 0;
    let lastFoundIdx = -1;
    
    for (const expLine of expectedLines) {
      // Find this line in the result, ensuring it appears after the previously found line
      const foundIdx = resultLines.findIndex((resLine, idx) => {
        return idx > lastFoundIdx && resLine.includes(expLine);
      });

      if (foundIdx !== -1) {
        matchCount++;
        lastFoundIdx = foundIdx;
      } else {
        // If exact match not found, check for high similarity or containment
        const looseMatchIdx = resultLines.findIndex((resLine, idx) => {
          return idx > lastFoundIdx && (resLine.includes(expLine.substring(0, 10)) || expLine.includes(resLine.substring(0, 10)));
        });
        if (looseMatchIdx !== -1) {
          matchCount += 0.5; // Partial points for loose matches
          lastFoundIdx = looseMatchIdx;
        }
      }
    }

    const score = Math.round((matchCount / expectedLines.length) * 10);
    totalScore += score;

    console.log(`Test: ${filename}`);
    console.log(`Score: ${score}/10`);
    if (score < 8) {
      console.log(`\n--- EXPECTED ---`);
      console.log(expected.substring(0, 200) + "...");
      console.log(`\n--- ACTUAL ---`);
      console.log(result.substring(0, 200) + "...");
    }
    console.log("--------------------------------------------------");
  }

  const averageScore = Math.round((totalScore / maxPossibleScore) * 100);
  console.log(`\n==================================================`);
  console.log(`FINAL ACCURACY SCORE: ${averageScore}%`);
  console.log(`==================================================\n`);
  
  if (averageScore < 80) {
    console.error("FAILED: Accuracy below 80%. Need to refine heuristics.");
    process.exit(1);
  } else {
    console.log("PASSED: Heuristics are performing well!");
  }
}

runTests().catch(err => {
  console.error("Test framework error:", err);
  process.exit(1);
});
