/**
 * ttsOptimizer.js
 * 
 * Pre-processes text purely offline for optimal Text-to-Speech playback.
 * 
 * Responsibilities:
 * - remove visual references
 * - improve pauses
 * - optimize punctuation
 * - shorten sentences
 * - improve paragraph structure
 * - normalize abbreviations
 */

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
  "\\betc\\.\\b": "et cetera",
  "\\bvs\\.\\b": "versus",
  "\\bDr\\.\\b": "Doctor",
  "\\bMr\\.\\b": "Mister",
  "\\bMrs\\.\\b": "Missus",
  "\\bMs\\.\\b": "Miss",
  "\\bProf\\.\\b": "Professor",
  "\\bSt\\.\\b": "Street", // Context dependent, but safe fallback
  "\\bAve\\.\\b": "Avenue"
};

const VISUAL_REFERENCES = [
  /see above/gi,
  /see below/gi,
  /see table\s*\d*/gi,
  /see figure\s*\d*/gi,
  /figure\s*\d+/gi,
  /table\s*\d+/gi,
  /image above/gi,
  /click here/gi,
  /read more/gi,
  /link in bio/gi,
  /swipe up/gi,
  /in the chart/gi,
  /as shown in/gi,
  /click the link/gi
];

/**
 * Split text into sentences using basic punctuation boundaries.
 */
function splitIntoSentences(text) {
  // Matches punctuation followed by space and a capital letter, or newline
  return text.match(/[^.!?]+[.!?]+(?=\s+[A-Z]|\s*$|\n)/g) || [text];
}

export function optimizeForSpeech(rawText) {
  if (!rawText) return "";
  let text = rawText;

  // 1. Remove Visual References
  for (const ref of VISUAL_REFERENCES) {
    text = text.replace(ref, "");
  }

  // 2. Normalize Abbreviations
  for (const [abbr, expansion] of Object.entries(ABBREVIATIONS)) {
    const regex = new RegExp(abbr, 'gi'); 
    text = text.replace(regex, expansion);
  }

  // 2a. Remove Cross-References and Academic Citations
  text = text.replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]+/g, "");
  text = text.replace(/[*†‡§]+/g, "");
  text = text.replace(/\[\d+\]/g, "");
  text = text.replace(/\(Ref\s*\d+\)/gi, "");
  text = text.replace(/Footnote\s*\d+/gi, "");
  text = text.replace(/Endnote\s*\d+/gi, "");

  // 2b. Expand Scripture References
  text = text.replace(/\b([1-3]?\s*[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?\b/g, (match, book, chapter, verseStart, verseEnd) => {
    if (verseEnd) {
      return `${book} chapter ${chapter}, verses ${verseStart} through ${verseEnd}`;
    }
    return `${book} chapter ${chapter}, verse ${verseStart}`;
  });

  // 2c. Remove Embedded Verse Numbers
  text = text.replace(/(^|\n|\.\s+)\d+\s+/g, "$1");

  // 3. Optimize Punctuation & Improve Pauses
  // Convert colons/semicolons followed by newlines/spaces into ellipses for natural pauses
  text = text.replace(/[:;]\s*\n/g, "... \n");
  text = text.replace(/[:;]/g, ", ");
  
  // Replace long dashes with commas for pause rhythm
  text = text.replace(/—|-{2,}/g, ", ");
  
  // Replace parentheses with commas to improve pause rhythm (TTS often ignores them or reads them awkwardly)
  text = text.replace(/[()\[\]{}]/g, ", ");

  // Clean up double commas/punctuation
  text = text.replace(/,\s*,/g, ",");
  text = text.replace(/\.\s*\./g, ".");
  
  // Clean up whitespace
  text = text.replace(/[ \t]{2,}/g, " ");

  // 4. Shorten Sentences & 5. Improve Paragraph Structure
  // We will split into paragraphs, then into sentences. Long sentences will be forcefully split at commas.
  const paragraphs = text.split(/\n+/);
  const optimizedParagraphs = [];

  for (const para of paragraphs) {
    if (!para.trim()) continue;

    // Truncate spoken text at endnote headers
    if (/^(footnotes|references|study notes|bibliography|source notes|cross references|citation sections)[\s:]*$/i.test(para.trim())) {
      break;
    }

    const sentences = splitIntoSentences(para.trim());
    const shortSentences = [];

    for (const sentence of sentences) {
      const words = sentence.split(/\s+/);
      
      // If sentence is longer than ~25 words, try to split at a comma to give the TTS engine a breath
      if (words.length > 25 && sentence.includes(", ")) {
        // Find the comma closest to the middle
        let bestSplitIdx = -1;
        let minDiff = Infinity;
        let charIndex = 0;

        for (let i = 0; i < words.length; i++) {
          if (words[i].endsWith(",")) {
            const diff = Math.abs((words.length / 2) - i);
            if (diff < minDiff) {
              minDiff = diff;
              bestSplitIdx = sentence.indexOf(words[i]) + words[i].length - 1;
            }
          }
        }

        if (bestSplitIdx !== -1) {
          // Replace comma with period to force a hard stop and breath
          const firstHalf = sentence.substring(0, bestSplitIdx) + ".";
          let secondHalf = sentence.substring(bestSplitIdx + 1).trim();
          // Capitalize second half
          if (secondHalf.length > 0) {
            secondHalf = secondHalf.charAt(0).toUpperCase() + secondHalf.slice(1);
          }
          shortSentences.push(firstHalf);
          if (secondHalf) shortSentences.push(secondHalf);
        } else {
          shortSentences.push(sentence);
        }
      } else {
        shortSentences.push(sentence);
      }
    }

    // Improve paragraph structure by grouping sentences into small, easily digestible paragraphs
    let currentPara = [];
    for (const sentence of shortSentences) {
      currentPara.push(sentence);
      // Create a new paragraph break every ~3 sentences for optimal TTS buffer loading
      if (currentPara.length >= 3) {
        optimizedParagraphs.push(currentPara.join(" ").trim());
        currentPara = [];
      }
    }
    if (currentPara.length > 0) {
      optimizedParagraphs.push(currentPara.join(" ").trim());
    }
  }

  // Final cleanup of punctuation anomalies at paragraph boundaries
  const finalOutput = optimizedParagraphs
    .map(p => {
      let cleaned = p.replace(/,\s*$/g, "."); // Ensure ending punctuation
      if (!/[.!?]$/.test(cleaned)) cleaned += ".";
      return cleaned;
    })
    .join("\n\n");

  return finalOutput;
}
