const ABBREVIATIONS = {
  "\\bACA\\b": "Adult Children of Alcoholics",
  "\\bWSO\\b": "World Service Organization",
  "\\bFAQ\\b": "Frequently Asked Questions",
  "\\bCEO\\b": "Chief Executive Officer",
  "\\bCFO\\b": "Chief Financial Officer",
  "\\bCTO\\b": "Chief Technology Officer",
  "\\bPDF\\b": "P D F",
  "\\be\\.g\\.\\b": "for example",
  "\\bi\\.e\\.\\b": "that is",
  "\\betc\\.\\b": "et cetera"
};

export function optimizeForSpeech(text) {
  if (!text) return "";
  let optimized = text;

  // 1. Improve pauses
  // Convert patterns such as "Key lesson:" into speech-friendly structure with an ellipsis.
  optimized = optimized.replace(/([a-zA-Z]+):(\s*\n|\s*$)/g, "$1...$2");

  // 2. Remove visual references
  const visualRefs = [
    /see above/gi,
    /see below/gi,
    /see table/gi,
    /figure \d+/gi,
    /table \d+/gi,
    /image above/gi,
    /click here/gi,
    /read more/gi
  ];
  for (const ref of visualRefs) {
    optimized = optimized.replace(ref, "");
  }

  // 3. Abbreviation Handling
  for (const [abbr, expansion] of Object.entries(ABBREVIATIONS)) {
    const regex = new RegExp(abbr, 'g'); 
    optimized = optimized.replace(regex, expansion);
  }

  // 4. Normalize punctuation
  // Remove multiple dashes
  optimized = optimized.replace(/-{2,}/g, ", ");
  
  // Replace parentheses with commas to improve pause rhythm
  optimized = optimized.replace(/[()]/g, ", ");
  
  // Clean up double commas that might have resulted from previous steps
  optimized = optimized.replace(/,\s*,/g, ",");
  
  // Clean up multiple spaces
  optimized = optimized.replace(/[ \t]{2,}/g, " ");

  // 5. Improve paragraph spacing for speech engine
  // Split long paragraphs (very simplistic approach to give the engine a breath)
  // Replaces double newlines with a period and double newline just to enforce a full stop.
  optimized = optimized.replace(/\n\n/g, ". \n\n");
  optimized = optimized.replace(/\.\s*\./g, "."); // fix double periods

  return optimized.trim();
}
