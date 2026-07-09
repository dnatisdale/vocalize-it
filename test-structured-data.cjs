const fs = require('fs');
const path = require('path');

async function runTests() {
  const { analyzeStructuredData } = await import('./src/utils/structuredDataDetector.js');
  
  const testDocsDir = path.join(__dirname, 'test-documents', 'structured-data');
  const testFiles = fs.readdirSync(testDocsDir).filter(f => f.endsWith('.txt'));

  let passCount = 0;

  console.log("==================================================");
  console.log("RUNNING STRUCTURED DATA DETECTION TESTS");
  console.log("==================================================\n");

  for (const filename of testFiles) {
    const rawText = fs.readFileSync(path.join(testDocsDir, filename), 'utf8');
    const meta = JSON.parse(fs.readFileSync(path.join(testDocsDir, filename + '.meta.json'), 'utf8'));
    
    const result = analyzeStructuredData(rawText);
    
    let passed = true;
    let errors = [];

    if (result.documentType !== meta.expectedType) {
      passed = false;
      errors.push(`Expected type '${meta.expectedType}', got '${result.documentType}'`);
    }

    if (result.rowCount !== meta.expectedRows) {
      passed = false;
      errors.push(`Expected rows ${meta.expectedRows}, got ${result.rowCount}`);
    }

    console.log(`Test: ${filename}`);
    if (passed) {
      console.log(`✅ PASSED (${result.documentType} | ${result.rowCount} rows | ${result.columnCount} cols)`);
      passCount++;
    } else {
      console.log(`❌ FAILED`);
      errors.forEach(e => console.log(`   - ${e}`));
    }
    console.log("--------------------------------------------------");
  }

  const accuracy = Math.round((passCount / testFiles.length) * 100);
  console.log(`\nFINAL ACCURACY: ${accuracy}%`);
  
  if (accuracy < 100) {
    console.error("Test failed. Refine heuristics.");
    process.exit(1);
  } else {
    console.log("All tests passed successfully!");
  }
}

runTests().catch(console.error);
