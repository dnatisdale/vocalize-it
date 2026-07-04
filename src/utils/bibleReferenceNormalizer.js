export const BOOK_MAP = {
  gen: "Genesis", genesis: "Genesis",
  ex: "Exodus", exod: "Exodus", exodus: "Exodus",
  lev: "Leviticus", leviticus: "Leviticus",
  num: "Numbers", numbers: "Numbers",
  deut: "Deuteronomy", deuteronomy: "Deuteronomy",
  josh: "Joshua", joshua: "Joshua",
  judg: "Judges", judges: "Judges",
  ruth: "Ruth",
  sam: "Samuel", samuel: "Samuel",
  kgs: "Kings", kings: "Kings",
  chron: "Chronicles", chronicles: "Chronicles",
  ezra: "Ezra",
  neh: "Nehemiah", nehemiah: "Nehemiah",
  esth: "Esther", esther: "Esther",
  job: "Job",
  ps: "Psalms", psa: "Psalms", psalm: "Psalms", psalms: "Psalms",
  prov: "Proverbs", proverbs: "Proverbs",
  eccles: "Ecclesiastes", ecclesiastes: "Ecclesiastes",
  song: "Song of Solomon",
  isa: "Isaiah", isaiah: "Isaiah",
  jer: "Jeremiah", jeremiah: "Jeremiah",
  lam: "Lamentations", lamentations: "Lamentations",
  ezek: "Ezekiel", ezekiel: "Ezekiel",
  dan: "Daniel", daniel: "Daniel",
  hos: "Hosea", hosea: "Hosea",
  joel: "Joel",
  amos: "Amos",
  obad: "Obadiah", obadiah: "Obadiah",
  jonah: "Jonah",
  mic: "Micah", micah: "Micah",
  nah: "Nahum", nahum: "Nahum",
  hab: "Habakkuk", habakkuk: "Habakkuk",
  zeph: "Zephaniah", zephaniah: "Zephaniah",
  hag: "Haggai", haggai: "Haggai",
  zech: "Zechariah", zechariah: "Zechariah",
  mal: "Malachi", malachi: "Malachi",
  mt: "Matthew", matt: "Matthew", matthew: "Matthew",
  mk: "Mark", mark: "Mark",
  lk: "Luke", luke: "Luke",
  jn: "John", john: "John",
  acts: "Acts",
  rom: "Romans", romans: "Romans",
  cor: "Corinthians", corinthians: "Corinthians",
  gal: "Galatians", galatians: "Galatians",
  eph: "Ephesians", ephesians: "Ephesians",
  phil: "Philippians", philippians: "Philippians",
  col: "Colossians", colossians: "Colossians",
  thess: "Thessalonians", thessalonians: "Thessalonians",
  tim: "Timothy", timothy: "Timothy",
  titus: "Titus",
  philem: "Philemon", philemon: "Philemon",
  heb: "Hebrews", hebrews: "Hebrews",
  jas: "James", james: "James",
  pet: "Peter", peter: "Peter",
  jude: "Jude",
  rev: "Revelation", revelation: "Revelation"
};

const GOSPELS = ["Matthew", "Mark", "Luke", "John"];
const NUMBERED_PREFIX = { "1": "First", "2": "Second", "3": "Third" };

const bookKeys = Object.keys(BOOK_MAP).sort((a,b) => b.length - a.length).join('|');
const BIBLE_REGEX = new RegExp(`\\b(?:([123])\\s*)?(${bookKeys})\\.?\\s*(\\d+)(?::\\s*(\\d+)(?:\\s*-\\s*(\\d+))?)?\\b`, 'gi');

/**
 * normalizeBibleReferences(text: string): object
 * 
 * Extracts and normalizes Bible references in text.
 * Returns: { original, normalized, spoken }
 */
export function normalizeBibleReferences(text) {
  if (!text) return { original: "", normalized: "", spoken: "" };

  let normalized = text;
  let spoken = text;

  // We process matches in reverse order so replacements don't shift the indices for subsequent matches
  const matches = [...text.matchAll(BIBLE_REGEX)];
  
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    const fullMatch = match[0];
    const index = match.index;
    
    const prefix = match[1];
    const rawBook = match[2].toLowerCase();
    const chapter = match[3];
    const verseStart = match[4];
    const verseEnd = match[5];

    const fullBookName = BOOK_MAP[rawBook];
    let normalizedBookName = fullBookName;
    let spokenBookName = fullBookName;

    if (prefix) {
      normalizedBookName = `${prefix} ${fullBookName}`;
      spokenBookName = `${NUMBERED_PREFIX[prefix]} ${fullBookName}`;
    }

    const isGospel = GOSPELS.includes(fullBookName);
    const bookSpokenPrefix = isGospel ? `The Gospel of ${spokenBookName}` : `The Book of ${spokenBookName}`;

    let normalizedRef = `${normalizedBookName} ${chapter}`;
    let spokenRef = `${bookSpokenPrefix}, chapter ${chapter}`;

    if (verseStart) {
      normalizedRef += `:${verseStart}`;
      if (verseEnd) {
        normalizedRef += `-${verseEnd}`;
        spokenRef += `, verses ${verseStart} through ${verseEnd}`;
      } else {
        spokenRef += `, verse ${verseStart}`;
      }
    }

    // String slicing to replace at specific index
    normalized = normalized.substring(0, index) + normalizedRef + normalized.substring(index + fullMatch.length);
    spoken = spoken.substring(0, index) + spokenRef + spoken.substring(index + fullMatch.length);
  }

  // Handle multi-reference lists (e.g. "John 3:16; Romans 8:28" where spoken needs 'and' or better pacing)
  // This is a subtle UX improvement requested in BIBLE-TTS-STANDARDS
  spoken = spoken.replace(/(\d(?: through \d+)?);\s+(The (Book|Gospel) of)/g, "$1; and $2");

  return {
    original: text,
    normalized,
    spoken
  };
}
