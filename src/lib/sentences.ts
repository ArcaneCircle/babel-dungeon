import { PAIRS } from "~/lib/constants";

// Shared array, mutated in-place by initializeSentences()
export const SENTENCES: string[] = [];

/**
 * Loads the sentences for a learning language, "<learn>-<known>".
 * If the data file is named "<known>-<learn>" the sentences are inverted.
 */
export async function initializeSentences(learningLang: string) {
  const [learn, known] = learningLang.split("-");
  let data: string[] = [];
  if (learn && known) {
    const direct = PAIRS.indexOf(`${learn}-${known}`) !== -1;
    const pair = direct ? `${learn}-${known}` : `${known}-${learn}`;
    const resp = await fetch(`data/${pair}.json`);
    if (!resp.ok) throw new Error(`failed to load ${pair}: ${resp.status}`);
    data = await resp.json();
    if (!direct) data = invertSentencesArray(data);
  }
  SENTENCES.length = 0;
  // loop instead of push(...data) to avoid argument limit with large arrays
  for (let i = 0; i < data.length; i++) SENTENCES.push(data[i]);
}

/**
 * Inverts a sentences array from <learn>-><known> to <known>-><learn>
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
