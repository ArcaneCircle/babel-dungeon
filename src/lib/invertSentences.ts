import { SENTENCES } from "~/lib/sentences";

let meaningToSentencesCache: Map<string, string[]> | null = null;

/**
 * Inverts the SENTENCES array from LANG1->LANG2 to LANG2->LANG1
 * Groups sentences by their shared meanings.
 *
 * Example:
 * Input:  ["S1\tM1|M2", "S2\tM1|M3"]
 * Output: ["M1\tS1|S2", "M2\tS1", "M3\tS2"]
 */
function invertSentencesArray(sentences: string[]): string[] {
  const meaningToSentences = new Map<string, Set<string>>();

  // Build a map of meaning -> set of sentences that have that meaning
  for (const line of sentences) {
    const [sentence, meaningsStr] = line.split("\t");
    if (!sentence || !meaningsStr) continue;

    const meanings = meaningsStr.split("|");
    for (const meaning of meanings) {
      const trimmedMeaning = meaning.trim();
      if (!trimmedMeaning) continue;

      if (!meaningToSentences.has(trimmedMeaning)) {
        meaningToSentences.set(trimmedMeaning, new Set());
      }
      meaningToSentences.get(trimmedMeaning)!.add(sentence.trim());
    }
  }

  // Convert the map to an array of strings in the same format
  return Array.from(meaningToSentences.entries()).map(
    ([meaning, sentences]) => {
      return `${meaning}\t${Array.from(sentences).join("|")}`;
    },
  );
}

function getMeaningToSentences(): Map<string, string[]> {
  if (meaningToSentencesCache) return meaningToSentencesCache;

  const map = new Map<string, Set<string>>();
  for (const line of SENTENCES) {
    const [sentence, meaningsStr] = line.split("\t");
    if (!sentence || !meaningsStr) continue;

    const meanings = meaningsStr.split("|");
    for (const meaning of meanings) {
      const trimmedMeaning = meaning.trim();
      if (!trimmedMeaning) continue;
      let sentences = map.get(trimmedMeaning);
      if (!sentences) {
        sentences = new Set();
        map.set(trimmedMeaning, sentences);
      }
      sentences.add(sentence.trim());
    }
  }

  meaningToSentencesCache = new Map(
    Array.from(map.entries()).map(([meaning, sentences]) => [
      meaning,
      Array.from(sentences),
    ]),
  );
  return meaningToSentencesCache;
}

export function getSentencesForMeaning(meaning: string): string[] {
  return getMeaningToSentences().get(meaning.trim()) ?? [];
}

/**
 * Initializes the SENTENCES array based on learning language.
 * Must be called once at app startup.
 * Replaces SENTENCES in-place if learning LANG2.
 */
export function initializeSentences(learningLang: string): void {
  meaningToSentencesCache = null;
  if (learningLang === "LANG2") {
    const inverted = invertSentencesArray(SENTENCES);
    SENTENCES.length = 0;
    // Use a simple loop to avoid stack overflow with large arrays
    // The spread operator with push has a limit on the number of arguments
    for (let i = 0; i < inverted.length; i++) {
      SENTENCES[i] = inverted[i];
    }
  }
}
