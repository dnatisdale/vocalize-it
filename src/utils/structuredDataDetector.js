/**
 * structuredDataDetector.js
 * 
 * Heuristics-based detection for large structured datasets (CSV, TSV, tabular data).
 * Identifies formats, row/column counts, and classifies document types to prevent
 * expensive LLM round-trips for non-narrative tabular data.
 */

/**
 * Analyzes pasted text for structured data formats (CSV, TSV, aligned grids).
 * @param {string} text 
 * @returns {Object} { documentType, rowCount, columnCount, confidence, headers, recommendedAction, data }
 */
export function analyzeStructuredData(text) {
  if (!text || text.trim().length === 0) {
    return { documentType: 'unknown', rowCount: 0, columnCount: 0, confidence: 0, headers: [] };
  }

  // Pre-process: split into lines (limit evaluation to first 500 lines for speed)
  const allLines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  const sampleLines = allLines.slice(0, 100);
  
  if (allLines.length < 3) {
    // Too few lines to reliably be a dataset; likely narrative or short text
    return { documentType: 'narrative', rowCount: allLines.length, columnCount: 1, confidence: 100, headers: [] };
  }

  // Evaluate TSV vs CSV vs grid
  const tsvCols = sampleLines.map(l => l.split('\t').length);
  const csvCols = sampleLines.map(l => l.split(',').length);
  // Simple visual grid (e.g. 4+ spaces)
  const gridCols = sampleLines.map(l => l.split(/\s{4,}/).length);

  // We look for consistent column counts > 1 across the sample
  const getConsistency = (counts) => {
    const freq = {};
    let maxFreq = 0;
    let mode = 1;
    for (const c of counts) {
      freq[c] = (freq[c] || 0) + 1;
      if (freq[c] > maxFreq) {
        maxFreq = freq[c];
        mode = c;
      }
    }
    const consistency = maxFreq / counts.length;
    return { mode, consistency };
  };

  const tsv = getConsistency(tsvCols);
  const csv = getConsistency(csvCols);
  const grid = getConsistency(gridCols);

  let bestFormat = { type: 'narrative', mode: 1, consistency: 0, delimiter: '' };
  
  if (tsv.mode > 1 && tsv.consistency > 0.8) {
    bestFormat = { type: 'structured-data', mode: tsv.mode, consistency: tsv.consistency, delimiter: '\t' };
  } else if (csv.mode > 1 && csv.consistency > 0.8) {
    bestFormat = { type: 'structured-data', mode: csv.mode, consistency: csv.consistency, delimiter: ',' };
  } else if (grid.mode > 1 && grid.consistency > 0.8) {
    bestFormat = { type: 'structured-data', mode: grid.mode, consistency: grid.consistency, delimiter: /\s{4,}/ };
  }

  if (bestFormat.type === 'narrative' || bestFormat.mode === 1) {
    return { documentType: 'narrative', rowCount: allLines.length, columnCount: 1, confidence: 100, headers: [] };
  }

  // It's structured data. Extract headers and check if it's a Bible Dataset
  const headerLine = allLines[0];
  let headers = [];
  if (bestFormat.delimiter instanceof RegExp) {
    headers = headerLine.split(bestFormat.delimiter);
  } else {
    headers = headerLine.split(bestFormat.delimiter);
  }
  
  // Clean headers
  headers = headers.map(h => h.trim().replace(/^["']|["']$/g, '')).filter(h => h.length > 0);

  // Check for Bible Dataset signatures
  const bibleKeywords = ['book', 'chapter', 'verse', 'scripture', 'reference'];
  const lowercaseHeaders = headers.map(h => h.toLowerCase());
  const matches = lowercaseHeaders.filter(h => bibleKeywords.some(keyword => h.includes(keyword)));
  
  let documentType = 'structured-data';
  if (matches.length >= 2) {
    documentType = 'Bible-dataset';
  }

  // Parse up to 500 rows for internal data
  const data = [];
  for (let i = 1; i < Math.min(allLines.length, 501); i++) {
    let row;
    if (bestFormat.delimiter instanceof RegExp) {
      row = allLines[i].split(bestFormat.delimiter);
    } else {
      row = allLines[i].split(bestFormat.delimiter);
    }
    data.push(row.map(c => c.trim().replace(/^["']|["']$/g, '')));
  }

  return {
    documentType,
    rowCount: allLines.length,
    columnCount: bestFormat.mode,
    confidence: Math.round(bestFormat.consistency * 100),
    headers,
    data,
    delimiterUsed: bestFormat.delimiter.toString()
  };
}

/**
 * Generates warning thresholds based on size limits
 */
export function getDatasetWarnings(rowCount, columnCount) {
  let rowWarning = null;
  let colWarning = null;

  if (rowCount > 500) {
    rowWarning = "This dataset exceeds the recommended size for narration.";
  } else if (rowCount > 250) {
    rowWarning = "This is a large dataset.";
  } else if (rowCount > 100) {
    rowWarning = "This appears to be structured tabular data.";
  }

  if (columnCount > 40) {
    colWarning = "This dataset exceeds the recommended column width for Listen Better.";
  } else if (columnCount > 20) {
    colWarning = "This appears to contain many fields.";
  }

  return { rowWarning, colWarning };
}
