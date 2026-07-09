/**
 * layoutAnalyzer.js
 * 
 * Heuristics-based document layout intelligence for recovering logical
 * reading order from messy clipboard pastes (PDFs, newsletters, brochures).
 */

/**
 * Main entry point for layout analysis.
 * Takes raw text, detects columns/artifacts, and reconstructs reading order.
 * @param {string} rawText 
 * @returns {string} Reconstructed text
 */
export function analyzeLayout(rawText) {
  if (!rawText || rawText.trim().length === 0) return rawText;

  let text = rawText;

  // 1. Detect and strip repeated elements (headers, footers, page numbers)
  text = detectAndStripRepeatedElements(text);

  // 2. Detect Columns & Reconstruct Reading Order
  const columnCount = detectColumns(text);
  if (columnCount > 1) {
    text = reconstructReadingOrder(text, columnCount);
  }

  // 3. Clean up spacing and structural artifacts
  text = cleanupStructuralArtifacts(text);

  return text;
}

/**
 * Detects if the text has multiple columns by looking at line length distributions,
 * large gaps of spaces, or pipe characters indicating tabular/column data.
 * @param {string} text 
 * @returns {number} 1, 2, or 3
 */
function detectColumns(text) {
  const lines = text.split('\n');
  
  // Count how many lines contain large gaps of spaces (e.g. "     ")
  // which often indicates columns flattened to single lines by PDF extractors.
  let linesWithGaps = 0;
  let linesWithTwoGaps = 0;

  for (const line of lines) {
    const gapMatches = line.match(/\s{4,}/g);
    if (gapMatches) {
      if (gapMatches.length >= 2) {
        linesWithTwoGaps++;
      }
      linesWithGaps++;
    }
  }

  // If a significant portion of lines have two large gaps, it's likely 3 columns
  if (linesWithTwoGaps > lines.length * 0.1) {
    return 3;
  }
  
  // If a significant portion of lines have one large gap, it's likely 2 columns
  if (linesWithGaps > lines.length * 0.1) {
    return 2;
  }

  // Check for column-like interleaving (short lines followed by short lines)
  // This is harder to perfectly detect with pure regex, but we can look at average line lengths.
  // If the average line length is unexpectedly short (< 40 chars) but the block is long,
  // it might be interleaved columns, but PDF copiers usually extract line-by-line horizontally.
  
  return 1;
}

/**
 * Extracts and removes repeated headers/footers/page numbers.
 * @param {string} text 
 */
function detectAndStripRepeatedElements(text) {
  let lines = text.split('\n');
  
  // Strip obvious page artifacts (Page X of Y, Page X, etc)
  lines = lines.filter(line => {
    const trimmed = line.trim();
    if (/^Page \d+(\s*\|.*)?$/i.test(trimmed)) return false;
    if (/^\d+\s*\|\s*Page(\s*\d+)?/i.test(trimmed)) return false;
    // Copyright lines
    if (/^Copyright \d{4}/i.test(trimmed)) return false;
    return true;
  });

  // We could implement block similarity for multi-page documents,
  // but for clipboard pastes, they are often a single flat string.
  // We'll rely on specific known boilerplate patterns.

  return lines.join('\n');
}

/**
 * Attempts to re-stitch intertwined columns back into narrative flow.
 * @param {string} text 
 * @param {number} columnCount 
 */
function reconstructReadingOrder(text, columnCount) {
  const lines = text.split('\n');
  let col1 = [];
  let col2 = [];
  let col3 = [];
  
  let header = [];
  
  // A very basic heuristic: 
  // If a line has a large gap of spaces (e.g., 4+ spaces), split it into columns.
  // If a line has no gaps, it might be a header that spans the columns.
  
  for (const line of lines) {
    // Look for separator gaps. We'll use 4+ spaces or tabs or pipes surrounded by spaces
    const parts = line.split(/(?:\s{4,}|\s+\|\s+)/);
    
    if (parts.length === 1) {
      // If it's a short line, it might just be part of a single column, 
      // but if we are in "column parsing mode", we'll append to col1.
      // If it's a long line spanning the width, it's a header.
      // For simplicity, we just push to col1 if there are no gaps.
      if (line.trim().length > 0) {
        col1.push(line.trim());
      }
    } else if (parts.length === 2) {
      col1.push(parts[0].trim());
      col2.push(parts[1].trim());
    } else if (parts.length >= 3) {
      col1.push(parts[0].trim());
      col2.push(parts[1].trim());
      col3.push(parts.slice(2).join(' ').trim()); // Join remaining into col3
    }
  }

  // Stitch them together logically
  let reconstructed = [];
  
  if (col1.length > 0) reconstructed.push(col1.join('\n'));
  if (col2.length > 0) reconstructed.push(col2.join('\n'));
  if (col3.length > 0) reconstructed.push(col3.join('\n'));

  return reconstructed.join('\n\n');
}

/**
 * Cleans up double spaces, strange bullet points, and other structural artifacts.
 * @param {string} text 
 */
function cleanupStructuralArtifacts(text) {
  let cleaned = text.replace(/\n{3,}/g, '\n\n'); // Max 2 newlines
  
  // Re-join broken sentences. If a line ends without punctuation and the next line 
  // starts with a lowercase letter, join them.
  const lines = cleaned.split('\n');
  let joined = [];
  
  for (let i = 0; i < lines.length; i++) {
    const current = lines[i];
    
    if (i < lines.length - 1 && current.trim().length > 0) {
      const next = lines[i + 1].trim();
      const endsWithPunctuation = /[.!?:]$/.test(current.trim());
      const startsWithLowercase = /^[a-z]/.test(next);
      
      if (!endsWithPunctuation && startsWithLowercase && next.length > 0) {
        // This line probably wraps to the next line. Join them.
        lines[i + 1] = current.trim() + " " + next;
        continue;
      }
    }
    joined.push(current);
  }
  
  return joined.join('\n').trim();
}
