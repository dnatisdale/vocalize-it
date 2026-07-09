// Targets: Unsubscribe links, "view in browser", sponsorship blocks, footer addresses.

export function clean(text) {
  let cleanedText = text;
  const removedSections = [];
  let score = 0;

  const patterns = [
    { regex: /\b(unsubscribe|manage preferences|manage subscription|opt[- ]?out)\b/gi, score: 20 },
    { regex: /\b(view\s+in\s+(your\s+)?browser|read\s+online)\b/gi, score: 10 },
    { regex: /^(sponsored\s+by|advertisement|this\s+(email\s+)?is\s+sponsored)/gim, score: 10 },
    { regex: /\b\d{1,5}\s+[\w\s]{2,40},\s*[\w\s]{2,30},?\s*[A-Z]{2}\s+\d{5}(-\d{4})?\b/gi, score: 10 }, // Address
  ];

  const lines = cleanedText.split("\n");
  const survivingLines = [];

  for (const line of lines) {
    let drop = false;
    for (const p of patterns) {
      if (p.regex.test(line)) {
        drop = true;
        score += p.score;
        break;
      }
    }
    if (drop) {
      removedSections.push(line.trim());
    } else {
      survivingLines.push(line);
    }
  }

  return {
    cleanedText: survivingLines.join("\n").trim(),
    removedSections,
    score
  };
}
