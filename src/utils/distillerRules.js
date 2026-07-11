// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: LINE-LEVEL BLOCK RULES
// ─────────────────────────────────────────────────────────────────────────────
export const LINE_DROP_RULES = [
  {
    label: "date-navigation-bar",
    test: (line) =>
      /^[\w\s]*(january|february|march|april|may|june|july|august|september|october|november|december)[\w\s]*([|/][\w\s]*(january|february|march|april|may|june|july|august|september|october|november|december)[\w\s]*){1,}/i.test(line.trim()),
  },
  {
    label: "brb-page-reference",
    test: (line) => /^brb\s*p\.\s*\d+/i.test(line.trim()),
  },
  {
    label: "unsubscribe-text",
    test: (line) =>
      /\b(unsubscribe|manage preferences|manage subscription|opt[- ]?out|email preferences|update your preferences|you are receiving this|you received this|to stop receiving|if you no longer wish)\b/i.test(line),
  },
  {
    label: "mailing-address",
    test: (line) =>
      /\b\d{1,5}\s+[\w\s]{2,40},\s*[\w\s]{2,30},?\s*[A-Z]{2}\s+\d{5}(-\d{4})?\b/.test(line),
  },
  {
    label: "copyright-line",
    test: (line) =>
      /^[\s©℗®]*(copyright|\(c\)|©)\s*\d{4}/i.test(line.trim()) ||
      /©\s*\d{4}/.test(line),
  },
  {
    label: "social-media-links",
    test: (line) =>
      /^(follow\s+us|find\s+us|connect\s+with\s+us|join\s+us)?\s*\bon\b\s*(twitter|x\.com|instagram|facebook|linkedin|youtube|tiktok|threads|pinterest|snapchat)/i.test(line.trim()) ||
      /^(twitter|instagram|facebook|linkedin|youtube|tiktok|threads)\s*[|•·]\s*(twitter|instagram|facebook|linkedin|youtube|tiktok|threads)/i.test(line.trim()),
  },
  {
    label: "social-handles",
    test: (line) =>
      /^@[\w.]+$/.test(line.trim()),
  },
  {
    label: "view-in-browser",
    test: (line) =>
      /\b(view\s+in\s+(your\s+)?browser|read\s+online|view\s+as\s+plain\s+text|having\s+trouble\s+viewing|click\s+here\s+to\s+view)\b/i.test(line),
  },
  {
    label: "email-headers",
    test: (line) =>
      /^(from|to|cc|bcc|subject|date|reply-?to|message-?id|sent)\s*:/i.test(line.trim()),
  },
  {
    label: "forwarded-divider",
    test: (line) =>
      /^-{3,}\s*(forwarded message|original message|begin forwarded)\s*-{3,}$/i.test(line.trim()),
  },
  {
    label: "sponsor-disclosure",
    test: (line) =>
      /^(sponsored\s+by|advertisement|this\s+(email\s+)?is\s+sponsored|brought\s+to\s+you\s+by|partner\s+content|advertorial)/i.test(line.trim()),
  },
  {
    label: "legal-footer-links",
    test: (line) =>
      /^(privacy\s+policy|terms\s+(of\s+)?(service|use)|cookie\s+policy|legal\s+notice|disclaimer)(\s*[|·•]\s*(privacy\s+policy|terms\s+(of\s+)?(service|use)|cookie\s+policy))*$/i.test(line.trim()),
  },
  {
    label: "this-email-was-sent",
    test: (line) =>
      /^this\s+(email|message|newsletter)\s+was\s+sent\s+to\b/i.test(line.trim()),
  },
  {
    label: "separator-lines",
    test: (line) =>
      /^[-=_*~#]{3,}$/.test(line.trim()),
  },
  {
    label: "all-rights-reserved",
    test: (line) =>
      /\ball rights reserved\b/i.test(line),
  },
  {
    label: "re-consent-lines",
    test: (line) =>
      /\b(if\s+you\s+(no\s+longer\s+want|don't\s+want|would\s+like\s+to\s+stop|wish\s+to\s+stop))\b/i.test(line),
  },
  {
    label: "navigation-menu-bar",
    test: (line) => {
      const t = line.trim();
      return t.length < 80 &&
        /^[A-Z][A-Z\s|•·/&-]{5,}[A-Z]$/.test(t) &&
        !/[,;]/.test(t);
    },
  },
  {
    label: "study-bible-cross-refs",
    test: (line) =>
      /^(see\s+(note|footnote)\s*\d*|cross\s*references?:|footnote:|sources?:)/i.test(line.trim()),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: WHOLE-TEXT REGEX REPLACEMENTS
// ─────────────────────────────────────────────────────────────────────────────
export const TEXT_REPLACE_RULES = [
  {
    label: "html-entities",
    pattern: /&(amp|nbsp|lt|gt|quot|apos|#\d{2,5}|#x[\da-fA-F]{2,4});/g,
    replace: " ",
  },
  {
    label: "excess-blank-lines",
    pattern: /\n{3,}/g,
    replace: "\n\n",
  },
  {
    label: "standalone-urls",
    pattern: /^https?:\/\/\S+\s*$/gm,
    replace: "",
  },
  {
    label: "image-placeholders",
    pattern: /\[(image|img|logo|banner|photo|icon|gif|video|thumbnail)\]/gi,
    replace: "",
  },
  {
    label: "inline-whitespace",
    pattern: /[ \t]{2,}/g,
    replace: " ",
  },
  {
    label: "footnote-superscripts",
    pattern: /[¹²³⁴⁵⁶⁷⁸⁹⁰]+/g,
    replace: "",
  },
  {
    label: "asterisk-dagger-references",
    pattern: /[*†‡§]+/g,
    replace: "",
  },
  {
    label: "academic-citations",
    pattern: /\[\d+\]/g,
    replace: "",
  },
  {
    label: "scripture-cross-reference-letters",
    pattern: /\b(\d+)[a-z]\b/g,
    replace: "$1",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: POST-PROCESSING RULES
// ─────────────────────────────────────────────────────────────────────────────
export const LINE_CLEAN_RULES = [
  {
    label: "scripture-verse-numbers",
    test: (line) => /^\d+\s+/.test(line),
    clean: (line) => line.replace(/^\d+\s+/, "").trim(),
  },
  {
    label: "trailing-footer-fragments",
    test: (line) =>
      /(\|\s*(unsubscribe|privacy policy|terms|contact us|advertise|help|careers)\s*)+$/i.test(line),
    clean: (line) =>
      line.replace(/(\|\s*(unsubscribe|privacy policy|terms|contact us|advertise|help|careers)\s*)+$/gi, "").trim(),
  },
];

// Compile Semantic Rules outside function scope for performance
export const SEMANTIC_RULES = {
  "salutation": /^(dear|hi|hello|greetings|hey|to whom it may concern|good morning|good afternoon|good evening)\b[\s\w,.-]*$/i,
  "greeting": /^(dear|hi|hello|greetings|hey|to whom it may concern|good morning|good afternoon|good evening)\b[\s\w,.-]*$/i,
  "job title": /^(ceo|cto|cfo|coo|cmo|vp|vice president|director|manager|head of|founder|co-founder|president)\b[\s\w,&-]*$/i,
  "mailing address": /^(po box|p\.o\. box|\d+\s+[a-z\s]+(st|street|rd|road|ave|avenue|blvd|boulevard|ln|lane|dr|drive|way|court|ct|plaza|sq|square))/i
};
