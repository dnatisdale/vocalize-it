// Targets: "Share this article", author bio blocks, "Read more:", cookie consent leftovers.

export function clean(text) {
  let cleanedText = text;
  const removedSections = [];
  let score = 0;

  const patterns = [
    { regex: /^(share this( article)?|tweet this|post to facebook)$/gi, score: 10 },
    { regex: /^(read more|related articles|also in this section)\s*:/gi, score: 10 },
    { regex: /^(about the author|written by)\s*:/gi, score: 15 },
    { regex: /we use cookies( to improve your experience)?/gi, score: 10 },
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
