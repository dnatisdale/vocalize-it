// Targets: "Nursery schedule", administrative announcements, donation links, recurring service times.

export function clean(text) {
  let cleanedText = text;
  const removedSections = [];
  let score = 0;

  const patterns = [
    { regex: /nursery\s+schedule|volunteers\s+needed/gi, score: 15 },
    { regex: /sunday\s+school\s+at\s+\d{1,2}:\d{2}\s*[ap]m/gi, score: 10 },
    { regex: /tithes\s+and\s+offerings/gi, score: 10 },
    { regex: /join\s+us\s+every\s+(sunday|wednesday)/gi, score: 10 },
    { regex: /contact\s+the\s+church\s+office/gi, score: 15 },
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
