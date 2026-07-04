/**
 * classifyDocument(text: string): object
 * 
 * Uses heuristics to determine the likely document type from raw text.
 * Returns: { type: string, confidence: number, reasons: string[] }
 */
export function classifyDocument(text) {
  if (!text) return { type: "unknown", confidence: 0, reasons: [] };

  const lines = text.split("\n");
  const sample = text.substring(0, 3000); // Only scan the first 3000 chars for efficiency

  const categories = [
    {
      type: "email",
      rules: [
        { regex: /^(from|to|cc|bcc|subject|date|reply-?to)\s*:/im, weight: 0.4, reason: "Contains email header (From/To/Subject)" },
        { regex: /^-{3,}\s*(forwarded message|original message)\s*-{3,}$/im, weight: 0.5, reason: "Contains forwarded message divider" },
        { regex: /^sent from my (iphone|ipad|android)/im, weight: 0.3, reason: "Contains mobile signature" },
        { regex: /\b(best regards|sincerely|cheers),\s*\n/im, weight: 0.2, reason: "Contains email sign-off" }
      ]
    },
    {
      type: "newsletter",
      rules: [
        { regex: /\b(unsubscribe|manage preferences|opt[- ]?out)\b/im, weight: 0.5, reason: "Contains unsubscribe instructions" },
        { regex: /\b(view\s+in\s+(your\s+)?browser|read\s+online)\b/im, weight: 0.3, reason: "Contains view-in-browser link" },
        { regex: /^(sponsored\s+by|advertisement|this\s+email\s+is\s+sponsored)/im, weight: 0.3, reason: "Contains sponsorship block" },
        { regex: /\b\d{1,5}\s+[\w\s]{2,40},\s*[\w\s]{2,30},?\s*[A-Z]{2}\s+\d{5}(-\d{4})?\b/im, weight: 0.2, reason: "Contains mailing address footer" }
      ]
    },
    {
      type: "news article",
      rules: [
        { regex: /^(by|written by)\s+[A-Z][a-z]+/im, weight: 0.3, reason: "Contains author byline" },
        { regex: /^(published|updated)\s*:/im, weight: 0.3, reason: "Contains publication date" },
        { regex: /^(share this( article)?|tweet this|post to facebook)$/im, weight: 0.3, reason: "Contains social sharing prompt" },
        { regex: /^(read more|related articles|also in this section)\s*:/im, weight: 0.2, reason: "Contains related articles section" }
      ]
    },
    {
      type: "government notice",
      rules: [
        { regex: /public\s+notice/im, weight: 0.5, reason: "Contains 'Public notice'" },
        { regex: /pursuant\s+to\s+section/im, weight: 0.4, reason: "Contains statutory language" },
        { regex: /(city\s+council|county\s+commission|state\s+government)/im, weight: 0.3, reason: "Contains government body reference" },
        { regex: /all\s+rights\s+reserved/im, weight: 0.2, reason: "Contains official copyright" }
      ]
    },
    {
      type: "training guide",
      rules: [
        { regex: /\b(learning\s+objectives?|module\s+\d+|lesson\s+\d+)\b/im, weight: 0.4, reason: "Contains training structure keywords" },
        { regex: /exercise\s+\d+/im, weight: 0.3, reason: "Contains exercise identifier" },
        { regex: /page\s+\d+\s+of\s+\d+/im, weight: 0.2, reason: "Contains pagination" }
      ]
    },
    {
      type: "prayer request",
      rules: [
        { regex: /prayer\s+request/im, weight: 0.6, reason: "Explicitly titled 'Prayer request'" },
        { regex: /please\s+pray\s+for/im, weight: 0.5, reason: "Contains 'Please pray for'" },
        { regex: /\b(surgery|recovery|healing|hospital)\b/im, weight: 0.2, reason: "Contains common prayer request themes" }
      ]
    },
    {
      type: "devotional",
      rules: [
        { regex: /(today's\s+reading|morning\s+devotional|daily\s+bread)/im, weight: 0.5, reason: "Contains devotional header" },
        { regex: /\b(encouragement|scripture|faithfulness)\b/im, weight: 0.2, reason: "Contains devotional themes" },
        { regex: /\b(John|Romans|Psalm|Matthew|Isaiah|Philippians)\s+\d+:\d+\b/im, weight: 0.3, reason: "Contains Bible scripture reference" }
      ]
    },
    {
      type: "church bulletin",
      rules: [
        { regex: /(nursery\s+schedule|tithes\s+and\s+offerings)/im, weight: 0.5, reason: "Contains specific church administrative terms" },
        { regex: /(worship\s+service|wednesday\s+night)/im, weight: 0.4, reason: "Contains church schedule terms" },
        { regex: /contact\s+the\s+church\s+office/im, weight: 0.3, reason: "Contains church office reference" }
      ]
    },
    {
      type: "research paper",
      rules: [
        { regex: /\b(abstract|methodology|conclusion)\b/im, weight: 0.3, reason: "Contains standard academic section headers" },
        { regex: /\b(references|bibliography)\b/im, weight: 0.2, reason: "Contains reference section" },
        { regex: /\b(peer-reviewed|doi:? 10\.\d{4,9}\/[-._;()/:a-z0-9]+)\b/im, weight: 0.5, reason: "Contains academic publication markers" },
        { regex: /\b(et al\.|fig\.|table)\b/im, weight: 0.2, reason: "Contains academic citation/reference markers" }
      ]
    }
  ];

  let bestMatch = { type: "unknown", confidence: 0, reasons: [] };

  for (const cat of categories) {
    let confidence = 0;
    const reasons = [];

    for (const rule of cat.rules) {
      if (rule.regex.test(sample)) {
        confidence += rule.weight;
        reasons.push(rule.reason);
      }
    }

    // Cap confidence at 0.99
    confidence = Math.min(confidence, 0.99);

    if (confidence > bestMatch.confidence) {
      bestMatch = {
        type: cat.type,
        confidence: Number(confidence.toFixed(2)),
        reasons
      };
    }
  }

  // Minimum threshold for confident classification
  if (bestMatch.confidence < 0.25) {
    return { type: "unknown", confidence: bestMatch.confidence, reasons: bestMatch.reasons };
  }

  return bestMatch;
}
