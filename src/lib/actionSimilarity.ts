/** Utilities for detecting similar action plan to-dos (Chinese-friendly). */

/** Normalize text: lowercase, strip punctuation/whitespace */
export function normalizeText(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, '')
    .trim();
}

/** Build character bigram set for fuzzy matching */
export function bigrams(s: string): Set<string> {
  const n = normalizeText(s);
  const set = new Set<string>();
  if (n.length === 0) return set;
  if (n.length === 1) {
    set.add(n);
    return set;
  }
  for (let i = 0; i < n.length - 1; i++) set.add(n.slice(i, i + 2));
  return set;
}

/** Jaccard similarity between two strings using bigrams (0-1) */
export function similarity(a: string, b: string): number {
  const A = bigrams(a);
  const B = bigrams(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  A.forEach((x) => { if (B.has(x)) inter++; });
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

export const SIMILARITY_THRESHOLD = 0.45;

/**
 * Greedy cluster a list of items by bigram similarity.
 * Returns clusters of indices. Each cluster has at least 1 item.
 */
export function clusterBySimilarity<T>(
  items: T[],
  getText: (t: T) => string,
  threshold = SIMILARITY_THRESHOLD,
): number[][] {
  const clusters: number[][] = [];
  const reps: Set<string>[] = [];
  items.forEach((it, idx) => {
    const big = bigrams(getText(it));
    let placed = false;
    for (let c = 0; c < clusters.length; c++) {
      const rep = reps[c];
      let inter = 0;
      big.forEach((x) => { if (rep.has(x)) inter++; });
      const union = big.size + rep.size - inter;
      const sim = union === 0 ? 0 : inter / union;
      if (sim >= threshold) {
        clusters[c].push(idx);
        // expand representative slightly
        big.forEach((x) => rep.add(x));
        placed = true;
        break;
      }
    }
    if (!placed) {
      clusters.push([idx]);
      reps.push(new Set(big));
    }
  });
  return clusters;
}
