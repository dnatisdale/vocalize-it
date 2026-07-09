// Targets: Legal disclaimers, "All rights reserved", statutory reference numbers, official footers.

export function clean(text) {
  let cleanedText = text;
  const removedSections = [];
  let score = 0;

  const patterns = [
    { regex: /^(pursuant to section|in accordance with)/gi, score: 10 },
    { regex: /all rights reserved/gi, score: 10 },
    { regex: /copyright\s*(city|county|state|government)/gi, score: 20 },
    { regex: /public\s+notice/gi, score: 15 },
    { regex: /for\s+more\s+information\s+visit\s+the/gi, score: 5 },
  ];

  const lines = cleanedText.split("\n");
  const survivingLines = [];

  for (const line of lines) {
    let drop = false;
    for (const p of patterns) {
      if (p.regex.test(line.trim())) {
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
