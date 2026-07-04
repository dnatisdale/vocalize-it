import { normalizeBibleReferences } from "./src/utils/bibleReferenceNormalizer.js";

const testString = "For God so loved the world in Jn 3:16. Read also 1 Cor 13:4-7; Phil 4:6-7; Psalm 23.";
const result = normalizeBibleReferences(testString);
console.log(JSON.stringify(result, null, 2));
