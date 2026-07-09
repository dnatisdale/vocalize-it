// Targets: Forward headers, "From/To/Date/Subject" blocks, email signatures, "Sent from my iPhone".

export function clean(text) {
  let cleanedText = text;
  const removedSections = [];
  let score = 0;

  const patterns = [
    { regex: /^(from|to|cc|bcc|subject|date|reply-?to|sent)\s*:/gi, score: 10 },
    { regex: /^-{3,}\s*(forwarded message|original message|begin forwarded)\s*-{3,}$/gi, score: 20 },
    { regex: /^sent from my (iphone|ipad|android|blackberry)/gi, score: 15 },
    { regex: /^this\s+(email|message)\s+was\s+sent\s+to\b/gi, score: 10 },
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
