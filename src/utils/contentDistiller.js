/**
 * ============================================================================
 * contentDistiller.js — "Clean-It-Up" Utility for Vocalize.it
 * ============================================================================
 *
 * Purpose:
 *   Strips non-essential boilerplate from raw pasted text (newsletters, emails,
 *   web articles) and returns only the meaningful content, with clean paragraph
 *   spacing suitable for speech synthesis.
 *
 * Design philosophy:
 *   All filter rules are isolated into labeled sections so you can easily add,
 *   tweak, or disable specific patterns as you encounter new edge cases in your
 *   daily reading workflow.
 *
 * Usage:
 *   import { distillContent } from './utils/contentDistiller';
 *   const clean = distillContent(rawPastedText);
 * ============================================================================
 */

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: LINE-LEVEL BLOCK RULES
// Each rule is an object with:
//   - label   : A human-readable name for easy debugging
//   - test    : A function(line: string) => boolean — return TRUE to DROP the line
// Lines that match any rule are discarded before paragraph reassembly.
// ─────────────────────────────────────────────────────────────────────────────
const LINE_DROP_RULES = [

  // --- Navigation / Date menus (e.g. "July 02 | July 01 | June 30") ---
  {
    label: "date-navigation-bar",
    test: (line) =>
      // A line that is mostly month names, dates, and pipe separators
      /^[\w\s]*(january|february|march|april|may|june|july|august|september|october|november|december)[\w\s]*([|/][\w\s]*(january|february|march|april|may|june|july|august|september|october|november|december)[\w\s]*){1,}/i.test(line.trim()),
  },

  // --- Unsubscribe / Mailing list footer lines ---
  {
    label: "unsubscribe-text",
    test: (line) =>
      /\b(unsubscribe|manage preferences|manage subscription|opt[- ]?out|email preferences|update your preferences|you are receiving this|you received this|to stop receiving|if you no longer wish)\b/i.test(line),
  },

  // --- Mailing addresses (lines that look like a postal address) ---
  // Catches patterns like: "123 Main Street, Suite 400, San Francisco, CA 94105"
  {
    label: "mailing-address",
    test: (line) =>
      /\b\d{1,5}\s+[\w\s]{2,40},\s*[\w\s]{2,30},?\s*[A-Z]{2}\s+\d{5}(-\d{4})?\b/.test(line),
  },

  // --- Copyright lines ---
  {
    label: "copyright-line",
    test: (line) =>
      /^[\s©℗®]*(copyright|\(c\)|©)\s*\d{4}/i.test(line.trim()) ||
      /©\s*\d{4}/.test(line),
  },

  // --- Social media link lines (standalone "Follow us on Twitter" style lines) ---
  {
    label: "social-media-links",
    test: (line) =>
      /^(follow\s+us|find\s+us|connect\s+with\s+us|join\s+us)?\s*\bon\b\s*(twitter|x\.com|instagram|facebook|linkedin|youtube|tiktok|threads|pinterest|snapchat)/i.test(line.trim()) ||
      /^(twitter|instagram|facebook|linkedin|youtube|tiktok|threads)\s*[|•·]\s*(twitter|instagram|facebook|linkedin|youtube|tiktok|threads)/i.test(line.trim()),
  },

  // --- Short standalone social handle lines (e.g. "@vocalizeit") ---
  {
    label: "social-handles",
    test: (line) =>
      /^@[\w.]+$/.test(line.trim()),
  },

  // --- "View in browser" / "Read online" navigation prompts ---
  {
    label: "view-in-browser",
    test: (line) =>
      /\b(view\s+in\s+(your\s+)?browser|read\s+online|view\s+as\s+plain\s+text|having\s+trouble\s+viewing|click\s+here\s+to\s+view)\b/i.test(line),
  },

  // --- Email header metadata lines (e.g. "From:", "To:", "Subject:", "Date:") ---
  // Only matches lines that START with these tokens (not body mentions)
  {
    label: "email-headers",
    test: (line) =>
      /^(from|to|cc|bcc|subject|date|reply-?to|message-?id|sent)\s*:/i.test(line.trim()),
  },

  // --- "Forwarded message" dividers ---
  {
    label: "forwarded-divider",
    test: (line) =>
      /^-{3,}\s*(forwarded message|original message|begin forwarded)\s*-{3,}$/i.test(line.trim()),
  },

  // --- "Sponsored by" / advertisement disclosure lines ---
  {
    label: "sponsor-disclosure",
    test: (line) =>
      /^(sponsored\s+by|advertisement|this\s+(email\s+)?is\s+sponsored|brought\s+to\s+you\s+by|partner\s+content|advertorial)/i.test(line.trim()),
  },

  // --- Privacy policy / terms links (standalone lines only) ---
  {
    label: "legal-footer-links",
    test: (line) =>
      /^(privacy\s+policy|terms\s+(of\s+)?(service|use)|cookie\s+policy|legal\s+notice|disclaimer)(\s*[|·•]\s*(privacy\s+policy|terms\s+(of\s+)?(service|use)|cookie\s+policy))*$/i.test(line.trim()),
  },

  // --- "This email was sent to" boilerplate ---
  {
    label: "this-email-was-sent",
    test: (line) =>
      /^this\s+(email|message|newsletter)\s+was\s+sent\s+to\b/i.test(line.trim()),
  },

  // --- Pure horizontal rules / separator lines (3+ repeated special chars) ---
  {
    label: "separator-lines",
    test: (line) =>
      /^[-=_*~#]{3,}$/.test(line.trim()),
  },

  // --- "All rights reserved" fragments ---
  {
    label: "all-rights-reserved",
    test: (line) =>
      /\ball rights reserved\b/i.test(line),
  },

  // --- "If you no longer want to receive" and similar re-consent lines ---
  {
    label: "re-consent-lines",
    test: (line) =>
      /\b(if\s+you\s+(no\s+longer\s+want|don't\s+want|would\s+like\s+to\s+stop|wish\s+to\s+stop))\b/i.test(line),
  },

  // --- Generic web nav items: short (under 40 chars), all-caps or title-case,
  //     containing only words (no sentence punctuation like commas or periods) ---
  //   e.g. "HOME  ABOUT  CONTACT  SUBSCRIBE  ARCHIVE"
  {
    label: "navigation-menu-bar",
    test: (line) => {
      const t = line.trim();
      // Must be short and look like a space/pipe/bullet separated list of nav words
      return t.length < 80 &&
        /^[A-Z][A-Z\s|•·/&-]{5,}[A-Z]$/.test(t) &&
        !/[,;]/.test(t); // nav bars don't have commas
    },
  },

];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: WHOLE-TEXT REGEX REPLACEMENTS
// Applied to the full text BEFORE line-by-line filtering.
// Each rule has:
//   - label   : Human-readable name
//   - pattern : RegExp to match
//   - replace : Replacement string (usually '' or '\n')
// ─────────────────────────────────────────────────────────────────────────────
const TEXT_REPLACE_RULES = [

  // --- Remove HTML entities that sometimes survive paste (e.g. &amp; &nbsp; etc.) ---
  {
    label: "html-entities",
    pattern: /&(amp|nbsp|lt|gt|quot|apos|#\d{2,5}|#x[\da-fA-F]{2,4});/g,
    replace: " ",
  },

  // --- Collapse 3+ blank lines into exactly 2 (one blank line between paragraphs) ---
  {
    label: "excess-blank-lines",
    pattern: /\n{3,}/g,
    replace: "\n\n",
  },

  // --- Strip bare URLs that are on their own line (tracking/redirect links) ---
  // Keeps URLs that are mid-sentence (not on their own line).
  {
    label: "standalone-urls",
    pattern: /^https?:\/\/\S+\s*$/gm,
    replace: "",
  },

  // --- Remove image placeholder text like "[image]" "[logo]" "[banner]" ---
  {
    label: "image-placeholders",
    pattern: /\[(image|img|logo|banner|photo|icon|gif|video|thumbnail)\]/gi,
    replace: "",
  },

  // --- Remove excessive whitespace within a line (tabs, multiple spaces) ---
  {
    label: "inline-whitespace",
    pattern: /[ \t]{2,}/g,
    replace: " ",
  },

];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: POST-PROCESSING RULES
// Applied to each surviving line AFTER line-drop filtering.
// Useful for trimming cruft that doesn't warrant dropping the whole line.
// ─────────────────────────────────────────────────────────────────────────────
const LINE_CLEAN_RULES = [

  // --- Strip trailing pipe-separated footer fragments from end of line ---
  // e.g. "Read more about this topic | Unsubscribe | Privacy Policy"
  {
    label: "trailing-footer-fragments",
    test: (line) =>
      /(\|\s*(unsubscribe|privacy policy|terms|contact us|advertise|help|careers)\s*)+$/i.test(line),
    clean: (line) =>
      line.replace(/(\|\s*(unsubscribe|privacy policy|terms|contact us|advertise|help|careers)\s*)+$/gi, "").trim(),
  },

];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

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
  const { debug = false, disabledRules = [], customBlockedPhrases = [] } = options;

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
    let dropped = false;

    // ── STEP 2b: Check LINE_DROP_RULES ───────────────────────────────────────
    for (const rule of LINE_DROP_RULES) {
      if (disabledRules.includes(rule.label)) continue;
      if (rule.test(trimmed)) {
        if (debug) console.log(`[distiller] DROP [${rule.label}]:`, JSON.stringify(trimmed));
        dropped = true;
        break;
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
      return !customBlockedPhrases.some(phrase => 
        phrase && lowerPara.includes(phrase.toLowerCase())
      );
    });
  }

  // Final trim
  return paragraphs.join("\n\n").trim();
}


// ─────────────────────────────────────────────────────────────────────────────
// CONVENIENCE: getDistillerStats — for optional UI feedback
// Returns a brief summary string of how many lines were removed.
// ─────────────────────────────────────────────────────────────────────────────

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
