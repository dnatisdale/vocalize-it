import {
  LINE_DROP_RULES,
  TEXT_REPLACE_RULES,
  LINE_CLEAN_RULES,
  SEMANTIC_RULES
} from "./distillerRules";
import { CLEANERS } from "./cleaners";
import { classifyDocument } from "./documentClassifier";

/**
 * distillContent(rawText: string, options?: object): string
 *
 * Strips boilerplate from raw pasted text and returns clean readable prose.
 *
 * @param {string} rawText - The raw text from clipboard or textarea.
 * @param {object} [options]
 * @param {boolean} [options.debug=false] - If true, logs which rules matched which lines.
 * @param {string[]} [options.disabledRules=[]] - Array of rule labels to skip.
 *
 * @returns {string} - Cleaned text with \n\n paragraph spacing for TTS.
 */
export function distillContent(rawText, options = {}) {
  const { debug = false, disabledRules = [], customBlockedPhrases = [], blocklist = [] } = options;

  if (!rawText || typeof rawText !== "string") return "";

  let text = rawText;

  // ── STEP 1: Apply whole-text regex replacements ────────────────────────────
  for (const rule of TEXT_REPLACE_RULES) {
    if (disabledRules.includes(rule.label)) continue;
    text = text.replace(rule.pattern, rule.replace);
  }

  // ── STEP 2: Split into lines for per-line analysis ─────────────────────────
  const lines = text.split("\n");
  const survivingLines = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Always keep blank lines (they signal paragraph breaks)
    if (trimmed === "") {
      survivingLines.push("");
      continue;
    }

    // ── STEP 2a: Check for Endnote Blocks ──────────────────────────────────────
    if (/^(footnotes|references|study notes|cross references|bibliography|sources)[\s:]*$/i.test(trimmed)) {
      if (debug) console.log(`[distiller] ENDNOTE TRUNCATION hit at:`, JSON.stringify(trimmed));
      break; // Stop processing entirely; drop the rest of the document
    }

    let dropped = false;

    // ── STEP 2b: Check LINE_DROP_RULES & user blocklist ──────────────────────
    // 1. Check user blocklist (exact normalized match)
    const normalizedLine = trimmed.toLowerCase();
    if (blocklist.some(b => b.toLowerCase() === normalizedLine)) {
      if (debug) console.log(`[distiller] DROP [blocklist]:`, JSON.stringify(trimmed));
      dropped = true;
    }

    if (!dropped) {
      // 2. Check standard rules
      for (const rule of LINE_DROP_RULES) {
        if (disabledRules.includes(rule.label)) continue;
        if (rule.test(trimmed)) {
          if (debug) console.log(`[distiller] DROP [${rule.label}]:`, JSON.stringify(trimmed));
          dropped = true;
          break;
        }
      }
    }

    if (dropped) continue;

    // ── STEP 2b: Apply LINE_CLEAN_RULES (partial trimming) ───────────────────
    let cleanedLine = trimmed;
    for (const rule of LINE_CLEAN_RULES) {
      if (disabledRules.includes(rule.label)) continue;
      if (rule.test(cleanedLine)) {
        if (debug) console.log(`[distiller] CLEAN [${rule.label}]:`, JSON.stringify(cleanedLine));
        cleanedLine = rule.clean(cleanedLine);
      }
    }

    // After cleaning, skip if the line is now empty
    if (cleanedLine === "") continue;

    survivingLines.push(cleanedLine);
  }

  // ── STEP 3: Reassemble into paragraphs ────────────────────────────────────
  // Join surviving lines; consecutive blank lines collapse to a single paragraph break.
  const assembled = survivingLines.join("\n");

  // Collapse multiple sequential blank lines (again, after filtering may create runs)
  const collapsed = assembled.replace(/\n{3,}/g, "\n\n");

  // Apply custom blocked phrases on paragraph level to match the tuner exactly
  let paragraphs = collapsed.split("\n\n");
  if (customBlockedPhrases && customBlockedPhrases.length > 0) {
    paragraphs = paragraphs.filter(para => {
      const lowerPara = para.toLowerCase();
      return !customBlockedPhrases.some(phrase => {
        if (!phrase) return false;
        const p = phrase.toLowerCase().trim();
        if (SEMANTIC_RULES[p]) {
          return SEMANTIC_RULES[p].test(para.trim());
        }
        return lowerPara.includes(p);
      });
    });
  }

  // Final trim
  return paragraphs.join("\n\n").trim();
}

/**
 * getDistillerStats(rawText: string, cleanText: string): string
 *
 * Returns a human-readable summary comparing raw vs. cleaned text.
 * Useful for displaying a "Removed X lines" indicator in the UI.
 *
 * @param {string} rawText
 * @param {string} cleanText
 * @returns {string}
 */
export function getDistillerStats(rawText, cleanText) {
  const rawLines = rawText.split("\n").filter((l) => l.trim()).length;
  const cleanLines = cleanText.split("\n").filter((l) => l.trim()).length;
  const removed = rawLines - cleanLines;
  const pct = rawLines > 0 ? Math.round((removed / rawLines) * 100) : 0;
  return removed > 0
    ? `Stripped ${removed} boilerplate lines (${pct}% reduction)`
    : "No boilerplate detected";
}

/**
 * advancedOfflineDistill(rawText: string, options?: object): object
 * 
 * Runs text through all specialized local cleaners and returns the best result.
 */
export function advancedOfflineDistill(rawText, options = {}) {
  if (!rawText) return { cleanedText: "", removedSections: [], documentHints: [] };

  let bestClean = rawText;
  let bestRemoved = [];
  const hints = [];
  let highestScore = 0;

  for (const [cleanerName, cleaner] of Object.entries(CLEANERS)) {
    const result = cleaner.clean(rawText);
    if (result.score > 0) {
      hints.push(cleanerName);
      if (result.score > highestScore) {
        highestScore = result.score;
        bestClean = result.cleanedText;
        bestRemoved = result.removedSections;
      }
    }
  }

  // If no specific cleaner scored high enough, fallback to basic text processing
  if (highestScore === 0) {
    bestClean = rawText;
  }

  // Then pass through the existing general distiller for basic text cleanup
  const finalCleanedText = distillContent(bestClean, options);

  const classification = classifyDocument(rawText);

  return {
    cleanedText: finalCleanedText,
    removedSections: bestRemoved,
    documentHints: hints,
    classification
  };
}

/**
 * benchmarkCleaners(rawText: string): object
 * 
 * Runs performance benchmarks for each modular cleaner.
 */
export function benchmarkCleaners(rawText) {
  if (!rawText) return {};
  
  const benchmarks = {};
  
  // Use performance.now() if available (browser), otherwise fallback to Date.now()
  const getNow = () => typeof performance !== "undefined" ? performance.now() : Date.now();

  for (const [cleanerName, cleaner] of Object.entries(CLEANERS)) {
    const start = getNow();
    cleaner.clean(rawText);
    const end = getNow();
    benchmarks[cleanerName] = (end - start).toFixed(2) + "ms";
  }

  return benchmarks;
}
