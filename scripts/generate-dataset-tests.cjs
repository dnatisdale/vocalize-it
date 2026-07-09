const fs = require('fs');
const path = require('path');

const testDocsDir = path.join(__dirname, '..', 'test-documents', 'structured-data');
fs.mkdirSync(testDocsDir, { recursive: true });

const generateTSV = (headers, numRows) => {
  let text = headers.join('\t') + '\n';
  for (let i = 0; i < numRows; i++) {
    text += headers.map(h => `Data ${h} ${i}`).join('\t') + '\n';
  }
  return text;
};

const generateCSV = (headers, numRows) => {
  let text = headers.join(',') + '\n';
  for (let i = 0; i < numRows; i++) {
    text += headers.map(h => `"Data ${h} ${i}"`).join(',') + '\n';
  }
  return text;
};

const tests = {
  'google-sheet-export.txt': {
    input: generateTSV(['Date', 'Amount', 'Description', 'Category', 'Status'], 150),
    expectedType: 'structured-data',
    expectedRows: 151
  },
  'excel-export.txt': {
    input: generateTSV(Array.from({length: 45}, (_, i) => `Column${i}`), 300),
    expectedType: 'structured-data',
    expectedRows: 301
  },
  'csv-export.txt': {
    input: generateCSV(['id', 'email', 'first_name', 'last_name', 'ip_address'], 600),
    expectedType: 'structured-data',
    expectedRows: 601
  },
  'bible-database-export.txt': {
    input: generateTSV(['id', 'book', 'chapter', 'verse', 'scripture_text', 'translation'], 200),
    expectedType: 'Bible-dataset',
    expectedRows: 201
  },
  'financial-table.txt': {
    input: generateTSV(['Year', 'Q1 Revenue', 'Q2 Revenue', 'Q3 Revenue', 'Q4 Revenue', 'Total'], 50),
    expectedType: 'structured-data',
    expectedRows: 51
  },
  'contact-list.txt': {
    input: generateCSV(['FirstName', 'LastName', 'Email', 'Phone', 'Company', 'Title'], 120),
    expectedType: 'structured-data',
    expectedRows: 121
  },
  'inventory-sheet.txt': {
    input: generateTSV(['SKU', 'Product Name', 'Category', 'In Stock', 'Price', 'Weight'], 80),
    expectedType: 'structured-data',
    expectedRows: 81
  },
  'narrative-newsletter.txt': { // Negative test case
    input: `Dear Friends,\n\nWe hope this newsletter finds you well. \nHere are some updates from the field.\n\nBlessings,\nThe Team`,
    expectedType: 'narrative',
    expectedRows: 5
  }
};

for (const [filename, data] of Object.entries(tests)) {
  fs.writeFileSync(path.join(testDocsDir, filename), data.input);
  fs.writeFileSync(path.join(testDocsDir, filename + '.meta.json'), JSON.stringify({
    expectedType: data.expectedType,
    expectedRows: data.expectedRows
  }, null, 2));
}

console.log("Structured data test files generated successfully!");
